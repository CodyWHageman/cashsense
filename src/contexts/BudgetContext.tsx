import { createContext, ReactNode, useContext, useState, useEffect, useRef } from 'react';
import { Budget, BudgetIncome, BudgetExpense, BudgetCategory } from '../models/Budget';
import { getDatabaseMonth, getJavaScriptMonth } from '../utils/dateUtils';
import { 
  getBudgetByMonthAndYear,
  createBudget
} from '../services/budgetService';
import { useAuth } from './AuthContext';
import { enqueueSnackbar } from 'notistack';
import { Transaction } from '../models/Transaction';

interface BudgetContextType {
  // Budget state
  currentBudget: Budget | null;
  setCurrentBudget: (budget: Budget | null) => void;
  loading: boolean;
  error: Error | null;
  
  // Date selection
  selectedMonth: number;
  selectedYear: number;
  handleMonthChange: (month: number, year: number) => void;
  
  // Budget operations
  handleGenerateBudget: () => Promise<void>;
  
  // Income operations
  handleIncomeUpdated: (updatedIncome: BudgetIncome) => void;
  handleIncomeDeleted: (incomeId: string) => void;
  
  // Expense operations
  handleExpenseUpdated: (updatedExpense: BudgetExpense) => void;
  handleExpensesChange: (expenses: BudgetExpense[]) => void;
  
  // Category operations
  handleCategoriesChange: (categories: BudgetCategory[]) => void;
  handleCategoryAdded: (category: BudgetCategory) => void;
  
  // Transaction operations
  handleTransactionDeleted: (transactionId: string) => Promise<void>;
  handleTransactionsAdded: (transactions: Transaction[]) => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

interface BudgetProviderProps {
  children: ReactNode;
}

export function BudgetProvider({ children }: BudgetProviderProps) {
  // State for current budget
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Selection states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Add refs to track loading states
  const loadingBudgetRef = useRef(false);
  
  const { user } = useAuth();
  
  // Load budget when month/year/user changes
  useEffect(() => {
    if (!user?.id) return;
    
    const loadBudget = async () => {
      try {
        // Only load budget if not already loading
        if (!loadingBudgetRef.current) {
          loadingBudgetRef.current = true;
          setLoading(true);
          
          try {
            const budget = await getBudgetByMonthAndYear(
              getDatabaseMonth(selectedMonth), 
              selectedYear, 
              user.id
            );
            
            if (budget) {
              setCurrentBudget({
                ...budget,
                month: getJavaScriptMonth(budget.month)
              });
            } else {
              setCurrentBudget(null);
            }
            setError(null);
          } catch (error: any) {
            if (!error.message?.includes('no rows in result set')) {
              console.error('Error loading budget:', error);
              setError(error instanceof Error ? error : new Error('Unknown error loading budget'));
              enqueueSnackbar('Error loading budget', { variant: 'error' });
            }
          } finally {
            loadingBudgetRef.current = false;
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error in loadBudget:', err);
        setLoading(false);
      }
    };
    
    loadBudget();
  }, [user?.id, selectedMonth, selectedYear]);
  
  // Handler functions
  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const handleTransactionDeleted = async (transactionId: string) => {
    if (!currentBudget) return;

    const updatedIncomes = currentBudget?.incomes?.map(income => {
      return {
        ...income,
        transactions: income.transactions?.filter(transaction => transaction.id !== transactionId)
      };
    });

    const updatedExpenses = currentBudget?.expenses?.map(expense => {
      return {
        ...expense,
        transactions: expense.transactions?.filter(transaction => transaction.id !== transactionId)
      };
    });

    setCurrentBudget({
      ...currentBudget,
      incomes: updatedIncomes,
      expenses: updatedExpenses
    });
  };

  const handleIncomeUpdated = (updatedIncome: BudgetIncome) => {
    if (!currentBudget) return;

    const updatedIncomes = currentBudget?.incomes?.map(income => 
      income.id === updatedIncome.id ? updatedIncome : income); 
    
    setCurrentBudget({
      ...currentBudget,
      incomes: updatedIncomes
    });
  };

  const handleIncomeDeleted = (incomeId: string) => {
    if (!currentBudget) return;

    const remainingIncomes = currentBudget?.incomes?.filter(income => income.id !== incomeId); 

    setCurrentBudget({
      ...currentBudget,
      incomes: remainingIncomes
    }); 
  };

  const handleExpenseUpdated = (updatedExpense: BudgetExpense) => {
    if (!currentBudget) return;

    const updatedExpenses = currentBudget?.expenses?.map(expense => 
      expense.id === updatedExpense.id ? updatedExpense : expense);

    setCurrentBudget({
      ...currentBudget,
      expenses: updatedExpenses
    });
  };

  const handleExpensesChange = (expenses: BudgetExpense[]) => {
    if (!currentBudget) return;

    setCurrentBudget({
      ...currentBudget,
      expenses: expenses
    });
  };

  const handleCategoriesChange = (categories: BudgetCategory[]) => {
    if (!currentBudget) return;

    setCurrentBudget({
      ...currentBudget,
      categories: categories
    }); 
  };

  const handleCategoryAdded = (category: BudgetCategory) => {
    if (!currentBudget) return;

    setCurrentBudget({
      ...currentBudget,
      categories: [...(currentBudget.categories || []), category]
    });
  };

  const handleGenerateBudget = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const newBudget = await createBudget({
        month: getDatabaseMonth(selectedMonth),
        year: selectedYear,
        userId: user.id
      });

      setCurrentBudget({
        ...newBudget,
        month: getJavaScriptMonth(newBudget.month)
      });
      enqueueSnackbar('Budget created successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error creating budget:', error);
      setError(error instanceof Error ? error : new Error('Error creating budget'));
      enqueueSnackbar('Error creating budget', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionsAdded = (transactions: Transaction[]) => {
    if (!currentBudget) return;

    const updatedExpenses = currentBudget.expenses?.map(expense => {
      const newExpenseTransactions = transactions.filter(t => t.expenseId === expense.id);
      if (newExpenseTransactions.length > 0) {
        return {
          ...expense,
          transactions: [...(expense.transactions || []), ...newExpenseTransactions]
        };
      }
      return expense;
    });

    const updatedIncomes = currentBudget.incomes?.map(income => {
      const newIncomeTransactions = transactions.filter(t => t.incomeId === income.id);
      if (newIncomeTransactions.length > 0) {
        return {
          ...income,
          transactions: [...(income.transactions || []), ...newIncomeTransactions]
        };
      }
      return income;
    });

    setCurrentBudget({
      ...currentBudget,
      expenses: updatedExpenses,
      incomes: updatedIncomes
    });
  };

  const value = {
    currentBudget,
    setCurrentBudget,
    loading,
    error,
    selectedMonth,
    selectedYear,
    handleMonthChange,
    handleGenerateBudget,
    handleIncomeUpdated,
    handleIncomeDeleted,
    handleExpenseUpdated,
    handleExpensesChange,
    handleCategoriesChange,
    handleCategoryAdded,
    handleTransactionDeleted,
    handleTransactionsAdded
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  
  return context;
} 