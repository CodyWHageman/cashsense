import { supabase } from './supabase';
import { Transaction } from '../models/Transaction';

// Helper function to map database fields to camelCase
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

// Create a new transaction
export const createTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      hash_id: transaction.hashId,
      amount: transaction.amount,
      date: transaction.date,
      description: transaction.description,
      expense_id: transaction.expenseId,
      income_id: transaction.incomeId,
      created_at: new Date(),
      updated_at: new Date()
    }])
    .select()
    .single();

  if (error) throw error;
  return mapTransaction(data);
};

// Get all transactions for a budget
export const getBudgetTransactions = async (budgetId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .or(`expense_id.in.(select id from budget_expenses where budget_id=eq.${budgetId}),income_id.in.(select id from budget_incomes where budget_id=eq.${budgetId})`);

  if (error) throw error;
  return (data || []).map(mapTransaction);
};

// Update a transaction
export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      hash_id: updates.hashId,
      amount: updates.amount,
      date: updates.date,
      description: updates.description,
      expense_id: updates.expenseId,
      income_id: updates.incomeId,
      updated_at: new Date()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapTransaction(data);
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
    .insert(transactions.map(t => ({
      hash_id: t.hashId,
      amount: t.amount,
      date: t.date,
      description: t.description,
      expense_id: t.expenseId,
      income_id: t.incomeId,
      created_at: new Date(),
      updated_at: new Date()
    })))
    .select();

  if (error) throw error;
  return (data || []).map(mapTransaction);
};

export const checkExistingHashIds = async (hashIds: string[]): Promise<string[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('hash_id')
    .in('hash_id', hashIds);

  if (error) throw error;
  return (data || []).map(t => t.hash_id);
};
