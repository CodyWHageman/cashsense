import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Container
} from '@mui/material';
import { Transaction } from '../models/Transaction';
import { Budget, BudgetExpense, BudgetIncome } from '../models/Budget';
import BudgetCategories from './BudgetCategories';
import BudgetView from './BudgetView';
import BudgetIncomeComponent from './BudgetIncomeComponent';
import { createBudget, getCurrentBudget } from '../services/budgetService';
import { createTransaction, deleteTransaction } from '../services/transactionService';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { getDatabaseMonth, getJavaScriptMonth } from '../utils/dateUtils';

interface BudgetHomeProps {
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
}

function BudgetHome({ mode, toggleColorMode }: BudgetHomeProps) {
  const { user } = useAuth();
  const userId = user?.id;
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [importedTransactions, setImportedTransactions] = useState<Transaction[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<BudgetExpense | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const currentDate = new Date(selectedYear, selectedMonth);
  const monthYearDisplay = format(currentDate, 'MMMM yyyy');

  const loadBudget = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const budget = await getCurrentBudget(userId);
      if (budget) {
        setCurrentBudget({
          ...budget,
          month: getJavaScriptMonth(budget.month)
        });
      } else {
        setCurrentBudget(null);
      }
    } catch (error: any) {
      if (!error.message?.includes('no rows in result set')) {
        console.error('Error loading budget:', error);
        enqueueSnackbar('Error loading budget', { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudget();
  }, [userId, selectedMonth, selectedYear]);

  const handleGenerateBudget = async () => {
    if (!userId) return;

    try {
      const newBudget = await createBudget({
        month: getDatabaseMonth(selectedMonth),
        year: selectedYear,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        expenses: [],
        incomes: [],
        categories: []
      });

      setCurrentBudget({
        ...newBudget,
        month: getJavaScriptMonth(newBudget.month)
      });
      enqueueSnackbar('Budget created successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error creating budget:', error);
      enqueueSnackbar('Error creating budget', { variant: 'error' });
    }
  };

  const handleUpdateExpenses = async (expenses: BudgetExpense[]) => {
    if (!currentBudget) return;
    try {
      const updatedBudget = { ...currentBudget, expenses };
      setCurrentBudget(updatedBudget);
    } catch (error) {
      console.error('Error updating expenses:', error);
      enqueueSnackbar('Error updating expenses', { variant: 'error' });
    }
  };

  const handleUpdateIncomes = async (incomes: BudgetIncome[]) => {
    if (!currentBudget) return;
    try {
      const updatedBudget = { ...currentBudget, incomes };
      setCurrentBudget(updatedBudget);
    } catch (error) {
      console.error('Error updating incomes:', error);
      enqueueSnackbar('Error updating incomes', { variant: 'error' });
    }
  };

  const handleImportTransaction = async (transaction: Transaction, importedId?: string) => {
    try {
      const newTransaction = await createTransaction(transaction);
      setTransactions(prev => [...prev, newTransaction]);
      if (importedId) {
        setImportedTransactions(prev => prev.filter(t => t.id !== importedId));
      }
      enqueueSnackbar('Transaction imported successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error importing transaction:', error);
      enqueueSnackbar('Error importing transaction', { variant: 'error' });
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      enqueueSnackbar('Transaction deleted successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      enqueueSnackbar('Error deleting transaction', { variant: 'error' });
    }
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleTodayClick = () => {
    const today = new Date();
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const calculateLeftToBudget = (budget: Budget): number => {
    const totalIncome = budget.incomes?.reduce((sum, income) => sum + income.amount, 0) || 0;
    const totalExpenses = budget.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
    return totalIncome - totalExpenses;
  };

  return (
    <Container>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Header Section - Always visible */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
                    {monthYearDisplay}
                    <Box component="span" sx={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      color: 'text.secondary',
                      '&:hover': { color: 'primary.main' }
                    }}>
                      ▼
                    </Box>
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={handleTodayClick}
                  >
                    Today
                  </Button>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      size="small" 
                      sx={{ minWidth: 'auto', p: 0.5 }}
                      onClick={handlePreviousMonth}
                    >
                      &lt;
                    </Button>
                    <Button 
                      size="small" 
                      sx={{ minWidth: 'auto', p: 0.5 }}
                      onClick={handleNextMonth}
                    >
                      &gt;
                    </Button>
                  </Box>
                </Box>
              </Box>
              {currentBudget && (
                <Typography variant="subtitle1" sx={{ mt: 1, color: 'text.secondary' }}>
                  ${calculateLeftToBudget(currentBudget).toFixed(2)} left to budget
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Main Content Section */}
          {!currentBudget ? (
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 4, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                textAlign: 'center',
                minHeight: '300px',
                justifyContent: 'center'
              }}>
                <Typography variant="h5" gutterBottom>
                  No Budget Found
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                  There is no budget for {monthYearDisplay}. Would you like to create one?
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGenerateBudget}
                >
                  Generate Budget
                </Button>
              </Paper>
            </Grid>
          ) : (
            <>
              {/* Main content */}
              <Grid item xs={12} md={8}>
                <Box sx={{ pr: 2 }}>
                  <BudgetIncomeComponent
                    incomes={currentBudget.incomes || []}
                    transactions={transactions}
                    updateIncomes={handleUpdateIncomes}
                    currentBudget={currentBudget}
                  />
                  <BudgetCategories
                    expenses={currentBudget.expenses || []}
                    transactions={transactions}
                    updateExpenses={handleUpdateExpenses}
                    currentBudget={currentBudget}
                    setCurrentBudget={setCurrentBudget}
                    addTransaction={handleImportTransaction}
                    onExpenseClick={setSelectedExpense}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <BudgetView
                  expenses={currentBudget.expenses || []}
                  transactions={transactions}
                  importedTransactions={importedTransactions}
                  setImportedTransactions={setImportedTransactions}
                  categories={currentBudget.categories?.map(c => c.category) || []}
                  incomes={currentBudget.incomes || []}
                  onImportTransaction={handleImportTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  selectedExpense={selectedExpense}
                  onExpenseDetailClose={() => setSelectedExpense(null)}
                  onExpenseClick={setSelectedExpense}
                />
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </Container>
  );
}

export default BudgetHome;