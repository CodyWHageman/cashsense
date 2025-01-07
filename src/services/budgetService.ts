import { supabase } from './supabase';
import { Budget, BudgetExpense, BudgetIncome, ExpenseCategory } from '../models/Budget';
import { getDatabaseMonth } from '../utils/dateUtils';

// Get budget by month and year
export const getBudgetByMonthAndYear = async (month: number, year: number, userId: string): Promise<Budget | null> => {
  const { data, error } = await supabase
    .from('budgets')
    .select(`
      *,
      categories:budget_categories(
        id,
        budgetId:budget_id,
        category:expense_categories!inner(
          id,
          name,
          userId:user_id,
          createdAt:created_at,
          color
        ),
        createdAt:created_at,
        updatedAt:updated_at,
        sequenceNumber:sequence_number
      ),
      expenses:budget_expenses(
        id,
        name,
        amount,
        categoryId:category_id,
        budgetId:budget_id,
        dueDate:due_date,
        fundId:fund_id,
        createdAt:created_at,
        updatedAt:updated_at,
        sequenceNumber:sequence_number
      ),
      incomes:budget_incomes(
        id,
        name,
        amount,
        budgetId:budget_id,
        frequency,
        expectedDate:expected_date,
        createdAt:created_at,
        updatedAt:updated_at
      )
    `)
    .eq('month', month)
    .eq('year', year)
    .eq('user_id', userId)
    .single();

  if (error?.details?.includes('The result contains 0 rows')) return null;
  if (error) throw error;
  console.log('Budget by month and year', data);
  return data;
};

// Get the most recent budget before the given month/year
export const getMostRecentBudget = async (month: number, year: number, userId: string): Promise<Budget | null> => {
  const { data, error } = await supabase
    .from('budgets')
    .select(`
      *,
      budget_categories(
        category:expense_categories(*)
      ),
      expenses:budget_expenses(*),
      incomes:budget_incomes(*)
    `)
    .eq('user_id', userId)
    .or(`year.lt.${year},and(year.eq.${year},month.lt.${month})`)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(1)
    .single();

  // If no budget is found, return null without throwing an error
  if (error?.details?.includes('The result contains 0 rows')) {
    return null;
  }

  // For any other errors, throw them
  if (error) throw error;
  
  if (data) {
    // Transform the nested category data
    const categories = data.budget_categories?.map((bc: any) => bc.category) || [];
    return { ...data, categories };
  }
  console.log('Most Recent Budget', data);
  return null;
};

// Create a new budget
export const createBudget = async (budget: Omit<Budget, 'id'>): Promise<Budget> => {
  // Start a transaction
  const { data: newBudget, error: budgetError } = await supabase
    .from('budgets')
    .insert([{
      month: budget.month, // Month is now already in database format (1-12)
      year: budget.year,
      user_id: budget.userId,
      created_at: budget.createdAt,
      updated_at: budget.updatedAt
    }])
    .select('*')
    .single();

  if (budgetError) throw budgetError;

  // Get the most recent budget to copy data from
  const recentBudget = await getMostRecentBudget(budget.month, budget.year, budget.userId);

  // If we have a recent budget and it has data, copy it
  if (recentBudget?.categories?.length || recentBudget?.expenses?.length || recentBudget?.incomes?.length) {
    try {
      // Copy categories if they exist
      if (recentBudget.categories && recentBudget.categories.length > 0) {
        const categoryAssociations = recentBudget.categories.map(category => ({
          budget_id: newBudget.id,
          category_id: category.id,
          created_at: new Date()
        }));

        const { error: categoriesError } = await supabase
          .from('budget_categories')
          .insert(categoryAssociations);

        if (categoriesError) throw categoriesError;
      }

      // Copy expenses if they exist
      if (recentBudget.expenses && recentBudget.expenses.length > 0) {
        const newExpenses = recentBudget.expenses.map(expense => ({
          ...expense,
          id: undefined,
          budget_id: newBudget.id,
          created_at: new Date(),
          updated_at: new Date()
        }));

        const { error: expensesError } = await supabase
          .from('budget_expenses')
          .insert(newExpenses);

        if (expensesError) throw expensesError;
      }

      // Copy incomes if they exist
      if (recentBudget.incomes && recentBudget.incomes.length > 0) {
        const newIncomes = recentBudget.incomes.map(income => ({
          ...income,
          id: undefined,
          budget_id: newBudget.id,
          created_at: new Date(),
          updated_at: new Date()
        }));

        const { error: incomesError } = await supabase
          .from('budget_incomes')
          .insert(newIncomes);

        if (incomesError) throw incomesError;
      }

      // Return the complete budget with copied data
      const completeBudget = await getBudgetByMonthAndYear(budget.month, budget.year, budget.userId);
      if (completeBudget) return completeBudget;
    } catch (error) {
      console.error('Error copying data from previous budget:', error);
      // If copying fails, continue with empty budget
    }
  }

  // If no recent budget exists or copying failed, return the new empty budget
  return {
    ...newBudget,
    expenses: [],
    incomes: [],
    categories: []
  };
};

// Update a budget
export const updateBudget = async (id: string, updates: Partial<Budget>): Promise<Budget> => {
  const { data, error } = await supabase
    .from('budgets')
    .update({
      month: updates.month,
      year: updates.year,
      updated_at: new Date()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a budget
export const deleteBudget = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Get all budgets for a user
// export const getUserBudgets = async (userId: string): Promise<Budget[]> => {
//   const { data, error } = await supabase
//     .from('budgets')
//     .select(`
//       *,
//       budget_categories!inner(
//         category:expense_categories(*)
//       ),
//       expenses:budget_expenses(*),
//       incomes:budget_incomes(*)
//     `)
//     .eq('user_id', userId)
//     .order('year', { ascending: false })
//     .order('month', { ascending: false });

//   if (error) throw error;

//   if (data) {
//     // Transform the nested category data for each budget
//     return data.map(budget => ({
//       ...budget,
//       categories: budget.budget_categories.map((bc: any) => bc.category)
//     }));
//   }

//   return [];
// };

// Get current budget for the selected month/year
export const getCurrentBudget = async (userId: string): Promise<Budget | null> => {
  const currentDate = new Date();
  return await getBudgetByMonthAndYear(getDatabaseMonth(currentDate.getMonth()), currentDate.getFullYear(), userId);
};
