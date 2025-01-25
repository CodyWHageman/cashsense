import { supabase } from './supabase';
import { SplitTransaction, Transaction, TransactionCreateDTO, TransactionSplitDTO } from '../models/Transaction';
import { generateHashId } from '../utils/transactionUtils';

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

const mapCreateDTOToDB = (transaction: TransactionCreateDTO): any => ({
  amount: transaction.amount,
  date: transaction.date,
  description: transaction.description,
  expense_id: transaction.expenseId,
  income_id: transaction.incomeId,
  hash_id: transaction.hashId,
  created_at: new Date(),
  updated_at: new Date()
});

/**
 * Creates a new transaction with the amount as an absolute value.
 * Determines the transaction type based on associated expense or income.
 */
export const createTransaction = async (transaction: TransactionCreateDTO): Promise<Transaction> => {
  // Ensure the amount is absolute
  const absoluteTransaction = ensureAbsoluteAmount(transaction);

  const { data, error } = await supabase
    .from('transactions')
    .insert([mapCreateDTOToDB(absoluteTransaction)])
    .select()
    .single();

  if (error) throw error;
  return mapTransaction(data);
};

export const createTransactions = async (transactions: TransactionCreateDTO[]): Promise<Transaction[]> => {
  // Ensure the amount is absolute
  const absoluteTransactions = transactions.map(transaction => ensureAbsoluteAmount(transaction));

  const { data, error } = await supabase
    .from('transactions')
    .insert(transactions.map(mapCreateDTOToDB))
    .select();

  if (error) throw error;
  return (data || []).map(mapTransaction);
};

const ensureAbsoluteAmount = (transaction: TransactionCreateDTO): TransactionCreateDTO => {
  const absoluteAmount = Math.abs(transaction.amount);  
  const hashId = generateHashId(absoluteAmount, transaction.date, transaction.description);
  return {
    ...transaction,
    amount: absoluteAmount,
    hashId
  };
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

export const checkExistingHashIds = async (hashIds: string[]): Promise<string[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('hash_id')
    .in('hash_id', hashIds);

  if (error) throw error;
  return (data || []).map(t => t.hash_id);
};

// Add to src/services/transactionService.ts
export const splitTransaction = async (transactionSplit: TransactionSplitDTO): Promise<Transaction> => {
  // Start a Supabase transaction
  const { data: { user } } = await supabase.auth.getUser();
  
  try {
    // 1. Get the original transaction
    const { data: parentTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionSplit.parentTransactionId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Create split transaction records
    const { data: splits, error: splitError } = await supabase
      .from('split_transactions')
      .insert(
        transactionSplit.splits.map(split => ({
          parent_transaction_id: transactionSplit.parentTransactionId,
          split_amount: split.amount,
          expense_id: split.expenseId
        }))
      )
      .select();

    if (splitError) throw splitError;

    // 3. Update the parent transaction to mark it as split
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update({ is_split: true })
      .eq('id', transactionSplit.parentTransactionId)
      .select()
      .single();

    if (updateError) throw updateError;

    return mapTransaction({
      ...updatedTransaction,
      splits: splits.map(mapDBDataToSplitTransaction)
    });
  } catch (error) {
    throw error;
  }
};

export const mapDBDataToSplitTransaction = (data: any): SplitTransaction => ({
  id: data.id,
  parentTransactionId: data.parent_transaction_id,
  splitAmount: data.split_amount,
  expenseId: data.expense_id,
  createdAt: new Date(data.created_at),
  updatedAt: data.updated_at
});
