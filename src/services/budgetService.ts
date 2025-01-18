import { supabase } from './supabase';
import { Budget, BudgetExpense, BudgetIncome, ExpenseCategory, BudgetCategory, BudgetCreateDTO, BudgetExpenseUpdateDTO, BudgetExpenseCreateDTO, BudgetIncomeCreateDTO } from '../models/Budget';
import { getDatabaseMonth } from '../utils/dateUtils';
import { Transaction } from '../models/Transaction';
import { createExpenses } from './expenseService';
import { createIncomes } from './incomeService';

// Helper function to map transaction data
const mapTransaction = (data: any): Transaction => ({
  id: data.id,
  hashId: data.hash_id,
  amount: data.amount,
  date: new Date(data.date),
  description: data.description,
  expenseId: data.expense_id,
  incomeId: data.income_id,
  createdAt: new Date(data.created_at),
  updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
});

// Helper function to map expense category
const mapExpenseCategory = (data: any): ExpenseCategory => ({
  id: data.id,
  name: data.name,
  color: data.color,
  userId: data.user_id,
  createdAt: new Date(data.created_at)
});

// Helper function to map budget category
const mapBudgetCategory = (data: any): BudgetCategory => ({
  id: data.id,
  budgetId: data.budget_id,
  category: mapExpenseCategory(data.category),
  createdAt: new Date(data.created_at),
  updatedAt: new Date(data.updated_at),
  sequenceNumber: data.sequence_number
});

// Helper function to map expense with transactions
const mapExpense = (data: any): BudgetExpense => ({
  id: data.id,
  budgetId: data.budget_id,
  categoryId: data.category_id,
  name: data.name,
  amount: data.amount,
  dueDate: data.due_date ? new Date(data.due_date) : null,
  fundId: data.fund_id,
  createdAt: new Date(data.created_at),
  updatedAt: new Date(data.updated_at),
  sequenceNumber: data.sequence_number,
  transactions: data.transactions ? data.transactions.map(mapTransaction) : []
});

// Helper function to map income with transactions
const mapIncome = (data: any): BudgetIncome => ({
  id: data.id,
  budgetId: data.budget_id,
  name: data.name,
  amount: data.amount,
  frequency: data.frequency,
  expectedDate: new Date(data.expected_date),
  createdAt: new Date(data.created_at),
  updatedAt: new Date(data.updated_at),
  transactions: data.transactions ? data.transactions.map(mapTransaction) : []
});

// Helper function to map entire budget
const mapBudget = (data: any): Budget => ({
  id: data.id,
  month: data.month,
  year: data.year,
  userId: data.user_id,
  createdAt: new Date(data.created_at),
  updatedAt: new Date(data.updated_at),
  categories: data.categories ? data.categories.map(mapBudgetCategory) : [],
  expenses: data.expenses ? data.expenses.map(mapExpense) : [],
  incomes: data.incomes ? data.incomes.map(mapIncome) : []
});

const mapCopiedExpenseToCreateDTO = (budgetId: string, expense: BudgetExpense): BudgetExpenseCreateDTO => ({
  budgetId: budgetId,
  categoryId: expense.categoryId,
  name: expense.name,
  amount: expense.amount,
  dueDate: expense.dueDate ? new Date(expense.dueDate) : null,
  sequenceNumber: expense.sequenceNumber,
  fundId: expense.fundId
});

const mapCopiedIncomeToCreateDTO = (budgetId: string, income: BudgetIncome): BudgetIncomeCreateDTO => ({
  budgetId: budgetId,
  name: income.name,
  amount: income.amount,
  frequency: income.frequency,
  expectedDate: income.expectedDate ? new Date(income.expectedDate) : null
});

// Get budget by month and year
export const getBudgetByMonthAndYear = async (month: number, year: number, userId: string): Promise<Budget | null> => {
  const { data, error } = await supabase
    .from('budgets')
    .select(`
      *,
      categories:budget_categories(
        *,
        category:expense_categories!inner(*)
      ),
      expenses:budget_expenses(
        *,
        transactions(*)
      ),
      incomes:budget_incomes(
        *,
        transactions(*)
      )
    `)
    .eq('month', month)
    .eq('year', year)
    .eq('user_id', userId)
    .single();

  if (error?.details?.includes('The result contains 0 rows')) return null;
  if (error) throw error;

  return data ? mapBudget(data) : null;
};

// Get the most recent budget before the given month/year
export const getMostRecentBudget = async (month: number, year: number, userId: string): Promise<Budget | null> => {
  const { data, error } = await supabase
    .from('budgets')
    .select(`
      *,
      categories:budget_categories(
        *,
        category:expense_categories!inner(*)
      ),
      expenses:budget_expenses(
        *,
        transactions(*)
      ),
      incomes:budget_incomes(
        *,
        transactions(*)
      )
    `)
    .eq('user_id', userId)
    .or(`year.lt.${year},and(year.eq.${year},month.lt.${month})`)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(1)
    .single();

  if (error?.details?.includes('The result contains 0 rows')) {
    return null;
  }
  if (error) throw error;

  return data ? mapBudget(data) : null;
};

// Create a new budget
export const createBudget = async (budget: BudgetCreateDTO): Promise<Budget> => {
  const { data: newBudget, error: budgetError } = await supabase
    .from('budgets')
    .insert([{
      month: budget.month,
      year: budget.year,
      user_id: budget.userId,
      created_at: new Date(),
      updated_at: new Date()
    }])
    .select('*')
    .single();

  if (budgetError) throw budgetError;

  const recentBudget = await getMostRecentBudget(budget.month, budget.year, budget.userId);
  // If we have a recent budget and it has data, copy it
  if (recentBudget?.categories?.length || recentBudget?.expenses?.length || recentBudget?.incomes?.length) {
    try {
      // Copy categories if they exist
      if (recentBudget.categories && recentBudget.categories.length > 0) {
        const categoryAssociations = recentBudget.categories.map(budgetCategory => ({
          budget_id: newBudget.id,
          category_id: budgetCategory.category.id,
          created_at: new Date()
        }));
        const { error: categoriesError } = await supabase
          .from('budget_categories')
          .insert(categoryAssociations);

        if (categoriesError) throw categoriesError;
      }

      // Copy expenses if they exist
      if (recentBudget.expenses && recentBudget.expenses.length > 0) {
        const expenseCreateList = recentBudget.expenses.map(expense => mapCopiedExpenseToCreateDTO(newBudget.id, expense));
        await createExpenses(expenseCreateList);
      }

      // Copy incomes if they exist
      if (recentBudget.incomes && recentBudget.incomes.length > 0) {
        const incomeCreateList = recentBudget.incomes.map(income => mapCopiedIncomeToCreateDTO(newBudget.id, income));
        await createIncomes(incomeCreateList);
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


// Get current budget for the selected month/year
export const getCurrentBudget = async (userId: string): Promise<Budget | null> => {
  const currentDate = new Date();
  return await getBudgetByMonthAndYear(getDatabaseMonth(currentDate.getMonth()), currentDate.getFullYear(), userId);
};

interface BudgetPeriod {
  month: number;
  year: number;
}

interface BudgetCheckResult {
  month: number;
  year: number;
  exists: boolean;
  budgetId?: string;
}

/**
 * Checks if budgets exist for the given months and years
 * @param periods Array of objects containing month and year to check
 * @param userId The user ID to check budgets for
 * @returns Array of results indicating if each budget exists
 */
export const checkBudgetsExist = async (
  periods: BudgetPeriod[],
  userId: string
): Promise<BudgetCheckResult[]> => {
  try {
    // Create a query that checks each period individually
    const { data, error } = await supabase
      .from('budgets')
      .select('id, month, year')
      .eq('user_id', userId)
      .in('month', periods.map(p => p.month))
      .in('year', periods.map(p => p.year));

    if (error) throw error;

    // Map each period to a result, checking if it exists in the returned data
    return periods.map(period => {
      const existingBudget = data?.find(budget => 
        budget.month === period.month && 
        budget.year === period.year
      );

      return {
        month: period.month,
        year: period.year,
        exists: !!existingBudget,
        budgetId: existingBudget?.id
      };
    });
  } catch (error) {
    console.error('Error checking budgets:', error);
    throw error;
  }
};
