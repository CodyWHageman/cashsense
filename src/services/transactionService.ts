import { supabase } from './supabase';
import { Transaction } from '../models/Transaction';

// Create a new transaction
export const createTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get all transactions for a budget
export const getBudgetTransactions = async (budgetId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('budget_id', budgetId);

  if (error) throw error;
  return data || [];
};

// Update a transaction
export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a transaction
export const deleteTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Batch create transactions
export const createTransactions = async (transactions: Omit<Transaction, 'id'>[]): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactions)
    .select();

  if (error) throw error;
  return data || [];
};
