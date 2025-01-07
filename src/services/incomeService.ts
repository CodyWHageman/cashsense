import { supabase } from './supabase';
import { BudgetIncome } from '../models/Budget';

// Create a new income
export const createIncome = async (income: Omit<BudgetIncome, 'id'>): Promise<BudgetIncome> => {
    console.log('Creating income:', income);
    const { data, error } = await supabase
    .from('budget_incomes')
    .insert([{
      name: income.name,
      amount: income.amount,
      frequency: income.frequency,
      expected_date: income.expectedDate,
      budget_id: income.budgetId,
      created_at: new Date(),
      updated_at: new Date()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get all incomes for a budget
export const getBudgetIncomes = async (budgetId: string): Promise<BudgetIncome[]> => {
  const { data, error } = await supabase
    .from('budget_incomes')
    .select('*')
    .eq('budget_id', budgetId);

  if (error) throw error;
  return data || [];
};

// Update an income
export const updateIncome = async (id: string, updates: Partial<BudgetIncome>): Promise<BudgetIncome> => {
  const { data, error } = await supabase
    .from('budget_incomes')
    .update({
        name: updates.name,
        amount: updates.amount,
        frequency: updates.frequency,
        expected_date: updates.expectedDate,
        created_at: updates.createdAt,
        updated_at: new Date()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete an income
export const deleteIncome = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('budget_incomes')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Batch update incomes
export const updateIncomes = async (incomes: BudgetIncome[]): Promise<BudgetIncome[]> => {
  const { data, error } = await supabase
    .from('budget_incomes')
    .upsert(incomes)
    .select();

  if (error) throw error;
  return data || [];
}; 