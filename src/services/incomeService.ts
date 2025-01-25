import { supabase } from './supabase';
import { BudgetIncome, BudgetIncomeCreateDTO } from '../models/Budget';

// Helper function to map database fields to camelCase
const mapIncome = (data: any): BudgetIncome => ({
  id: data.id,
  name: data.name,
  amount: data.amount,
  frequency: data.frequency,
  expectedDate: data.expected_date,
  budgetId: data.budget_id,
  createdAt: data.created_at,
  updatedAt: data.updated_at
});

const mapCreateDTOToDBInsert = (income: BudgetIncomeCreateDTO): any => ({
  name: income.name,
  amount: income.amount,
  frequency: income.frequency,
  expected_date: income.expectedDate,
  budget_id: income.budgetId,
  created_at: new Date(),
  updated_at: new Date()
});

// Create a new income
export const createIncome = async (income: BudgetIncomeCreateDTO): Promise<BudgetIncome> => {
    console.log('Creating income:', income);
    const { data, error } = await supabase
    .from('budget_incomes')
    .insert([mapCreateDTOToDBInsert(income)])
    .select()
    .single();

  if (error) throw error;
  return mapIncome(data);
};

export const createIncomes = async (incomes: BudgetIncomeCreateDTO[]): Promise<BudgetIncome[]> => {
    console.log('Creating incomes:', incomes);
    const { data, error } = await supabase
    .from('budget_incomes')
    .insert(incomes.map(mapCreateDTOToDBInsert))
    .select();

  if (error) throw error;
  return data.map(mapIncome);
};  

// Get all incomes for a budget
export const getBudgetIncomes = async (budgetId: string): Promise<BudgetIncome[]> => {
  const { data, error } = await supabase
    .from('budget_incomes')
    .select('*')
    .eq('budget_id', budgetId);

  if (error) throw error;
  return (data || []).map(mapIncome);
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
        updated_at: new Date()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapIncome(data);
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
    .upsert(incomes.map(income => ({
      id: income.id,
      name: income.name,
      amount: income.amount,
      frequency: income.frequency,
      expected_date: income.expectedDate,
      budget_id: income.budgetId,
      updated_at: new Date()
    })))
    .select();

  if (error) throw error;
  return (data || []).map(mapIncome);
}; 