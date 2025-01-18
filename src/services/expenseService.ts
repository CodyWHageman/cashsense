import { supabase } from './supabase';
import { BudgetExpense, BudgetExpenseCreateDTO, BudgetExpenseUpdateDTO } from '../models/Budget';
import { createFundTransaction } from './fundService';

// Helper function to map database fields to camelCase
const mapExpense = (data: any): BudgetExpense => ({
  id: data.id,
  name: data.name,
  amount: data.amount,
  dueDate: data.due_date,
  categoryId: data.category_id,
  fundId: data.fund_id,
  budgetId: data.budget_id,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  sequenceNumber: data.sequence_number
});

const mapCreateDTOToDBExpense = (expense: BudgetExpenseCreateDTO): any => ({
  name: expense.name,
  amount: expense.amount,
  due_date: expense.dueDate,
  category_id: expense.categoryId,
  fund_id: expense.fundId,
  budget_id: expense.budgetId,
  sequence_number: expense.sequenceNumber
});

const mapUpdateDTOToDBExpense = (expense: BudgetExpenseUpdateDTO): any => ({
  name: expense.name,
  amount: expense.amount,
  due_date: expense.dueDate,
  fund_id: expense.fundId,
  sequence_number: expense.sequenceNumber,
  created_at: new Date(),
  updated_at: new Date()
});

// Create a new expense
export const createExpense = async (expense: BudgetExpenseCreateDTO): Promise<BudgetExpense> => {
  const { data, error } = await supabase
    .from('budget_expenses')
    .insert([mapCreateDTOToDBExpense(expense)])
    .select()
    .single();

  if (error) throw error;
  return mapExpense(data);
};

export const createExpenses = async (expenses: BudgetExpenseCreateDTO[]): Promise<BudgetExpense[]> => {
    console.log('Creating expenses:', expenses);
    const { data, error } = await supabase
    .from('budget_expenses')
    .insert(expenses.map(mapCreateDTOToDBExpense))
    .select();

  if (error) throw error;
  return data.map(mapExpense);
};  

// Update an expense
export const updateExpense = async (id: string, updates: BudgetExpenseUpdateDTO): Promise<BudgetExpense> => {
  const expenseUpdates = mapUpdateDTOToDBExpense(updates);
  const { data, error } = await supabase
    .from('budget_expenses')
    .update({
        ...expenseUpdates,
        updated_at: new Date()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapExpense(data);
};

// Delete an expense
export const deleteExpense = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('budget_expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
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
  return (data || []).map(mapExpense);
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
  return (data || []).map(mapExpense);
}; 