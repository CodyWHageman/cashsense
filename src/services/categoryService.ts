import { supabase } from './supabase';
import { BudgetCategory, ExpenseCategory } from '../models/Budget';

// Create a new category and associate it with a budget
export const createCategory = async (
  category: Omit<ExpenseCategory, 'id'>,
  budgetId: string,
  sequenceNumber: number
): Promise<BudgetCategory> => {
  // Insert the category
  console.log('Creating category', category);
  const { data: categoryData, error: categoryError } = await supabase
    .from('expense_categories')
    .insert([{
      name: category.name,
      color: category.color,
      user_id: category.userId,
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
    `)
    .single();

  if (associationError) throw associationError;
  
  return {
    ...associationData,
    category: associationData.category[0] // Convert array to single object
  };
};

// Update a category
export const updateExpenseCategory = async (
  id: string,
  updates: Partial<ExpenseCategory>
): Promise<ExpenseCategory> => {
  const { data, error } = await supabase
    .from('expense_categories')
    .update({
      name: updates.name,
      color: updates.color,
      updated_at: new Date() 
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a category
export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('expense_categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}; 