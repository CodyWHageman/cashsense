import { supabase } from './supabase';
import { Fund } from '../models/Budget';

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
        transaction:transactions(*)
      )
    `)
    .single();

  if (error) throw error;
  return data;
};

// Get all funds for a user
export const getUserFunds = async (userId: string): Promise<Fund[]> => {
  const { data, error } = await supabase
    .from('funds')
    .select(`
      *,
      fund_transactions(
        *,
        transaction:transactions(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get a single fund by ID
export const getFundById = async (id: string): Promise<Fund | null> => {
  const { data, error } = await supabase
    .from('funds')
    .select(`
      *,
      fund_transactions(
        *,
        transaction:transactions(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
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
        transaction:transactions(*)
      )
    `)
    .single();

  if (error) throw error;
  return data;
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
      transaction:transactions!inner(amount)
    `)
    .eq('fund_id', fundId);

  if (error) throw error;

  return transactions.reduce((balance, ft) => {
    const amount = ft.transaction[0].amount;
    return ft.type === 'deposit' ? balance + amount : balance - amount;
  }, 0);
}; 