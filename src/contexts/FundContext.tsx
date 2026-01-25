import { createContext, ReactNode, useContext, useState, useEffect, useRef } from 'react';
import { Fund } from '../models/Budget';
import { 
  createFund, 
  updateFund, 
  deleteFund, 
  getUserFunds,
  createFundTransaction,
  deleteFundTransaction
} from '../services/fundService';
import { useAuth } from './AuthContext';
import { enqueueSnackbar } from 'notistack';
import { Transaction, FundTransaction } from '../models/Transaction';
import { calculateFundBalance, FundWithBalance } from '../utils/fundUtils';

interface FundContextType {
  funds: FundWithBalance[];
  loading: boolean;
  error: Error | null;
  createNewFund: (fund: Omit<Fund, 'id'>) => Promise<Fund>;
  updateExistingFund: (fundId: string, fundData: Partial<Fund>) => Promise<Fund>;
  deleteExistingFund: (fundId: string) => Promise<void>;
  addFundTransaction: (
    fundId: string, 
    transactionId: string, 
    type: 'deposit' | 'withdrawal',
    transferComplete?: boolean
  ) => Promise<void>;
  deleteFundTransactionAndRefresh: (fundTransaction: FundTransaction) => Promise<void>;
}

const FundContext = createContext<FundContextType | undefined>(undefined);

interface FundProviderProps {
  children: ReactNode;
}

export function FundProvider({ children }: FundProviderProps) {
  const [funds, setFunds] = useState<FundWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const loadingFundsRef = useRef(false);
  const { user } = useAuth();
  
  const loadFunds = async () => {
    if (!user?.uid || loadingFundsRef.current) return;
    
    loadingFundsRef.current = true;
    setLoading(true);
    
    try {
      const userFunds = await getUserFunds(user.uid);
      const fundsWithBalances = userFunds.map(calculateFundBalance);
      setFunds(fundsWithBalances);
      setError(null);
    } catch (error) {
      // NOTE: If you see "The query requires an index" here, click the link in the console!
      console.error('Error loading funds:', error);
      setError(error instanceof Error ? error : new Error('Error loading funds'));
      enqueueSnackbar('Error loading funds', { variant: 'error' });
    } finally {
      setLoading(false);
      loadingFundsRef.current = false;
    }
  };
  
  useEffect(() => {
    if (user?.uid) {
      loadFunds();
    } else {
      setFunds([]);
      setLoading(false);
    }
  }, [user?.uid]);
  
  // Create a new fund
  const createNewFund = async (fundData: Omit<Fund, 'id'>): Promise<Fund> => {
    if (!user?.uid) throw new Error("User not authenticated");

    try {
      const fundWithUser = {
        ...fundData,
        userId: user.uid
      };

      const newFund = await createFund(fundWithUser);
      await loadFunds();
      enqueueSnackbar(`Fund "${newFund.name}" created successfully`, { variant: 'success' });
      return newFund;
    } catch (error) {
      console.error('Error creating fund:', error);
      throw error;
    }
  };
  
  const updateExistingFund = async (fundId: string, fundData: Partial<Fund>): Promise<Fund> => {
    try {
      const updatedFund = await updateFund(fundId, fundData);
      await loadFunds();
      enqueueSnackbar(`Fund "${updatedFund.name}" updated successfully`, { variant: 'success' });
      return updatedFund;
    } catch (error) {
      console.error('Error updating fund:', error);
      throw error;
    }
  };
  
  const deleteExistingFund = async (fundId: string): Promise<void> => {
    try {
      await deleteFund(fundId);
      await loadFunds();
      enqueueSnackbar('Fund deleted successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting fund:', error);
      throw error;
    }
  };
  
  const addFundTransaction = async (
    fundId: string, 
    transactionId: string, 
    type: 'deposit' | 'withdrawal',
    transferComplete: boolean = false
  ): Promise<void> => {
    try {
      await createFundTransaction(fundId, transactionId, type, transferComplete);
      await loadFunds();
    } catch (error) {
      console.error('Error adding transaction to fund:', error);
      throw error;
    }
  };
  
  const deleteFundTransactionAndRefresh = async (fundTransaction: FundTransaction): Promise<void> => {
    try {
      await deleteFundTransaction(fundTransaction);
      await loadFunds();
      enqueueSnackbar('Transaction deleted successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting fund transaction:', error);
      throw error;
    }
  };
  
  const value = {
    funds,
    loading,
    error,
    createNewFund,
    updateExistingFund,
    deleteExistingFund,
    addFundTransaction,
    deleteFundTransactionAndRefresh
  };
  
  return (
    <FundContext.Provider value={value}>
      {children}
    </FundContext.Provider>
  );
}

export function useFund() {
  const context = useContext(FundContext);
  if (context === undefined) {
    throw new Error('useFund must be used within a FundProvider');
  }
  return context;
}