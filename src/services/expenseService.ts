import { supabase } from './supabase';
import { BudgetExpense } from '../models/Budget';
import { createFundTransaction } from './fundService';

// Create a new expense
export const createExpense = async (expense: Omit<BudgetExpense, 'id'>): Promise<BudgetExpense> => {
  console.log('createExpense', expense);
  const { data, error } = await supabase
    .from('budget_expenses')
    .insert([{
        name: expense.name,
        amount: expense.amount,
        due_date: expense.dueDate,
        category_id: expense.categoryId,
        fund_id: expense.fundId,
        budget_id: expense.budgetId,
        created_at: new Date(),
        updated_at: new Date(),
        sequence_number: expense.sequenceNumber
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get all expenses for a budget
export const getBudgetExpenses = async (budgetId: string): Promise<BudgetExpense[]> => {
  const { data, error } = await supabase
    .from('budget_expenses')
    .select(`
      *,
      transactions(*)
    `)
    .eq('budget_id', budgetId);

  if (error) throw error;
  return data || [];
};

// Update an expense
export const updateExpense = async (id: string, updates: Partial<BudgetExpense>): Promise<BudgetExpense> => {
  const { data, error } = await supabase
    .from('budget_expenses')
    .update({
        name: updates.name,
        amount: updates.amount,
        due_date: updates.dueDate,
        fund_id: updates.fundId,
        updated_at: new Date(),
        sequence_number: updates.sequenceNumber
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete an expense
export const deleteExpense = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('budget_expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Add a transaction to an expense
export const addTransactionToExpense = async (
  expenseId: string, 
  transactionId: string
): Promise<void> => {
  // First get the expense to check if it's linked to a fund
  const { data: expense, error: expenseError } = await supabase
    .from('budget_expenses')
    .select('*')
    .eq('id', expenseId)
    .single();

  if (expenseError) throw expenseError;

  // Update the transaction with the expense ID
  const { error: updateError } = await supabase
    .from('transactions')
    .update({ expense_id: expenseId })
    .eq('id', transactionId);

  if (updateError) throw updateError;

  // If the expense is linked to a fund, create a fund transaction
  if (expense.fund_id) {
    await createFundTransaction(expense.fund_id, transactionId, 'deposit');
  }
};

// Batch update expenses
export const updateExpenses = async (expenses: BudgetExpense[]): Promise<BudgetExpense[]> => {
    const upsertData = expenses.map(expense => ({
        id: expense.id,
        name: expense.name,
        amount: expense.amount,
        due_date: expense.dueDate,
        fund_id: expense.fundId,
        updated_at: new Date(),
        sequence_number: expense.sequenceNumber
    }));
    
    const { data, error } = await supabase
        .from('budget_expenses')
        .upsert(upsertData)
        .select();

  if (error) throw error;
  return data || [];
}; 