import { supabase } from './supabase';
import { BudgetCategory, ExpenseCategory, ExpenseCategoryCreateDTO, ExpenseCategoryUpdateDTO } from '../models/Budget';

// Helper functions to map database fields to camelCase
const mapExpenseCategory = (data: any): ExpenseCategory => ({
  id: data.id,
  name: data.name,
  color: data.color,
  userId: data.user_id,
  createdAt: data.created_at
});

const mapBudgetCategory = (data: any): BudgetCategory => ({
  id: data.id,
  budgetId: data.budget_id,
  category: mapExpenseCategory(data.expense_category),
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  sequenceNumber: data.sequence_number
});

// Create a new category and associate it with a budget
export const createCategory = async (
  newCategory: ExpenseCategoryCreateDTO,
  budgetId: string,
  sequenceNumber: number
): Promise<BudgetCategory> => {
  // Insert the category
  const { data: categoryData, error: categoryError } = await supabase
    .from('expense_categories')
    .insert([{
      name: newCategory.name,
      color: newCategory.color,
      user_id: newCategory.userId,
      created_at: new Date()
    }])
    .select()
    .single();

  if (categoryError) throw categoryError;

  // Create budget-category association
  const { data: associationData, error: associationError } = await supabase
    .from('budget_categories')
    .insert([{
      budget_id: budgetId,
      category_id: categoryData.id,
      created_at: new Date(),
      sequence_number: sequenceNumber
    }])
    .select(`
      *,
      expense_category: expense_categories!inner(*)
    `)
    .single();

  if (associationError) throw associationError;

  return mapBudgetCategory(associationData);
};

// Update a category
export const updateExpenseCategory = async (
  id: string,
  { name, color }: ExpenseCategoryUpdateDTO
): Promise<ExpenseCategory> => {
  const { data, error } = await supabase
    .from('expense_categories')
    .update({
      name,
      color,
      updated_at: new Date()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapExpenseCategory(data);
};

// Delete a category
export const deleteCategory = async (budgetCategory: BudgetCategory): Promise<void> => {
  console.log('Deleting budget category', budgetCategory.id, 'for budget', budgetCategory.budgetId);
  // Check if expenses exist for this category and budget
  const { data: expenses, error: expensesError } = await supabase
    .from('budget_expenses')
    .select('id')
    .eq('category_id', budgetCategory.category.id)
    .eq('budget_id', budgetCategory.budgetId);

  if (expensesError) throw expensesError;

  if (expenses.length > 0) {
    throw new Error('Cannot delete category with associated expenses');
  }

  const { error: budgetCategoryError } = await supabase
    .from('budget_categories')
    .delete()
    .eq('category_id', budgetCategory.category.id)
    .eq('budget_id', budgetCategory.budgetId);

  if (budgetCategoryError) throw budgetCategoryError;

  //Check if category exists in other budgets
  deleteExpenseCategoryIfNotInOtherBudgets(budgetCategory.category.id);
};

const deleteExpenseCategoryIfNotInOtherBudgets = async (expenseCategoryId: string) => {
  const { data: otherBudgets, error: otherBudgetsError } = await supabase
    .from('budget_categories')
    .select('id')
    .eq('category_id', expenseCategoryId);

  if (otherBudgetsError) throw otherBudgetsError;

  if (otherBudgets.length < 1) {
    //Delete category
    const { error: categoryError } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', expenseCategoryId);

    if (categoryError) throw categoryError;
  }
}
