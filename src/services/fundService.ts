import { supabase } from './supabase';
import { Fund } from '../models/Budget';
import { Transaction, FundTransaction, FundTransactionCreateDTO } from '../models/Transaction';

// Helper functions to map database fields to camelCase
const mapTransaction = (data: any): Transaction => ({
  id: data.id,
  hashId: data.hash_id,
  amount: data.amount,
  date: data.date,
  description: data.description,
  expenseId: data.expense_id,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  isSplit: data.is_split
});

const mapFundTransaction = (data: any): FundTransaction => ({
  id: data.id,
  fundId: data.fund_id,
  transactionId: data.transaction_id,
  type: data.type,
  transferComplete: data.transfer_complete,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  transaction: data.transaction ? mapTransaction(data.transaction) : undefined,
  transferTransactionId: data.transfer_transaction_id
});

const mapFund = (data: any): Fund => ({
  id: data.id,
  name: data.name,
  description: data.description,
  targetAmount: data.target_amount,
  userId: data.user_id,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  fundTransactions: data.fund_transactions ? data.fund_transactions.map(mapFundTransaction) : []
});

// Create a new fund
export const createFund = async (fund: Omit<Fund, 'id'>): Promise<Fund> => {
  const { data, error } = await supabase
    .from('funds')
    .insert([{
        name: fund.name,
        description: fund.description,
        target_amount: fund.targetAmount,
        user_id: fund.userId,
        created_at: new Date(),
        updated_at: new Date()
    }])
    .select(`
      *,
      fund_transactions(
        *,
        transaction:transactions!fund_transactions_transaction_id_fkey(*),
        transfer_transaction:transactions!fund_transactions_transfer_transaction_id_fkey (*)
      )
    `)
    .single();

  if (error) throw error;
  return mapFund(data);
};

// Get all funds for a user
export const getUserFunds = async (userId: string): Promise<Fund[]> => {
  const { data, error } = await supabase
    .from('funds')
    .select(`
      *,
      fund_transactions(
        *,
        transaction:transactions!fund_transactions_transaction_id_fkey(*),
        transfer_transaction:transactions!fund_transactions_transfer_transaction_id_fkey (*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapFund);
};

// Get a single fund by ID
export const getFundById = async (id: string): Promise<Fund | null> => {
  const { data, error } = await supabase
    .from('funds')
    .select(`
      *,
      fund_transactions(
        *,
        transaction:transactions!fund_transactions_transaction_id_fkey(*),
        transfer_transaction:transactions!fund_transactions_transfer_transaction_id_fkey (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data ? mapFund(data) : null;
};

// Update a fund
export const updateFund = async (id: string, updates: Partial<Fund>): Promise<Fund> => {
  const { data, error } = await supabase
    .from('funds')
    .update({
        name: updates.name,
        description: updates.description,
        target_amount: updates.targetAmount,
        updated_at: new Date()
    })
    .eq('id', id)
    .select(`
      *,
      fund_transactions(
        *,
        transaction:transactions!fund_transactions_transaction_id_fkey(*),
        transfer_transaction:transactions!fund_transactions_transfer_transaction_id_fkey (*)
      )
    `)
    .single();

  if (error) throw error;
  return mapFund(data);
};

// Delete a fund
export const deleteFund = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('funds')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Create a fund transaction
export const createFundTransaction = async (
  fundId: string,
  transactionId: string,
  type: 'deposit' | 'withdrawal',
  transferComplete: boolean = false
): Promise<void> => {
  const { error } = await supabase
    .from('fund_transactions')
    .insert([{
      fund_id: fundId,
      transaction_id: transactionId,
      type,
      transfer_complete: transferComplete,
      created_at: new Date(),
      updated_at: new Date()
    }]);

  if (error) throw error;
};

export const createFundTransactions = async (fundTransactions: FundTransactionCreateDTO[]): Promise<void> => {
  const { error } = await supabase
    .from('fund_transactions')
    .insert(fundTransactions.map(mapFundTransaction));

  if (error) throw error;
};  

// Update fund transaction transfer status
export const updateFundTransactionStatus = async (
  id: string,
  transferComplete: boolean
): Promise<void> => {
  const { error } = await supabase
    .from('fund_transactions')
    .update({ transfer_complete: transferComplete, updated_at: new Date() })
    .eq('id', id);

  if (error) throw error;
};

// Get fund balance
export const getFundBalance = async (fundId: string): Promise<number> => {
  const { data: transactions, error } = await supabase
    .from('fund_transactions')
    .select(`
      type,
      transaction:transactions!fund_transactions_transaction_id_fkey(amount)
    `)
    .eq('fund_id', fundId);

  if (error) throw error;

  return transactions.reduce((balance, ft) => {
    const amount = ft.transaction[0].amount;
    return ft.type === 'deposit' ? balance + amount : balance - amount;
  }, 0);
};

export const getPendingFundTransactions = async (fundId: string): Promise<FundTransaction[]> => {
  const { data, error } = await supabase
    .from('fund_transactions')
    .select(`
      *,
        transaction:transactions!fund_transactions_transaction_id_fkey(*),
        transfer_transaction:transactions!fund_transactions_transfer_transaction_id_fkey (*)
    `)
    .eq('fund_id', fundId)
    .eq('transfer_complete', false)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapFundTransaction);
};

export const markFundTransferComplete = async (
  fundId: string,
  fundTransactionId: string,
  transferTransactionId: string
): Promise<void> => {
  const { error } = await supabase
    .from('fund_transactions')
    .update({ 
      transfer_complete: true,
      transfer_transaction_id: transferTransactionId 
    })
    .eq('id', fundTransactionId)
    .eq('fund_id', fundId);

  if (error) throw error;
};

export const updateFundTransaction = async (
  fundTransactionId: string,
  updates: {
    transferTransactionId?: string;
    transferComplete?: boolean;
  }
): Promise<void> => {
  const { error } = await supabase
    .from('fund_transactions')
    .update({
      transfer_transaction_id: updates.transferTransactionId,
      transfer_complete: updates.transferComplete,
      updated_at: new Date()
    })
    .eq('id', fundTransactionId);

  if (error) throw error;
};

// Delete a fund transaction by deleting its related transactions
export const deleteFundTransaction = async (fundTransaction: FundTransaction): Promise<void> => {
  // Collect all transaction IDs to delete
  const transactionIds: string[] = [];
  
  // Add the main transaction ID if it exists
  if (fundTransaction.transactionId) {
    transactionIds.push(fundTransaction.transactionId);
  }
  
  // Add the transfer transaction ID if it exists
  if (fundTransaction.transferTransactionId) {
    transactionIds.push(fundTransaction.transferTransactionId);
  }
  
  // If we have transactions to delete
  if (transactionIds.length > 0) {
    // Delete all related transactions in a single call
    // This will cascade to delete the fund_transaction record
    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', transactionIds);
    
    if (error) throw error;
  } else {
    // Fallback: If no transaction IDs (unusual case), delete the fund_transaction directly
    const { error } = await supabase
      .from('fund_transactions')
      .delete()
      .eq('id', fundTransaction.id);
      
    if (error) throw error;
  }
}; 