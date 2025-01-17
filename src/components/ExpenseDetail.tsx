import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText,
  Button,
  LinearProgress,
  Paper,
  Divider
} from '@mui/material';
import { ArrowBack, Delete, AccountBalance } from '@mui/icons-material';
import { Transaction } from '../models/Transaction';
import { BudgetExpense, ExpenseCategory } from '../models/Budget';
import { createTransaction, deleteTransaction } from '../services/transactionService';
import { updateExpense } from '../services/expenseService';
import { createFundTransaction } from '../services/fundService';
import TransactionDialog from './TransactionDialog';
import FundSelector from './FundSelector';
import { useAuth } from '../contexts/AuthContext';

interface ExpenseDetailProps {
  expense: BudgetExpense;
  category?: ExpenseCategory;
  onClose: () => void;
  onDeleteTransaction: (transactionId: string) => void;
  onExpenseUpdate: (updatedExpense: BudgetExpense) => void;
}

const ExpenseDetail: React.FC<ExpenseDetailProps> = ({ 
  expense, 
  category,
  onClose,
  onDeleteTransaction,
  onExpenseUpdate
}) => {
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const { user } = useAuth();

  const totalSpent = (expense.transactions || []).reduce((sum, t) => sum + t.amount, 0);
  const remaining = expense.amount - totalSpent;
  const percentageSpent = expense.amount > 0 ? (totalSpent / expense.amount) * 100 : 0;

  const handleAddTransaction = async (transaction: Transaction) => {
    try {
      const newTransaction = await createTransaction({
        ...transaction,
        expenseId: expense.id,
        createdAt: new Date()
      });

      // If the expense has a fund assigned, create a fund transaction as a deposit
      if (expense.fundId && newTransaction.id) {
        await createFundTransaction(
          expense.fundId,
          newTransaction.id,
          'deposit',
          false
        );
      }

      onDeleteTransaction(newTransaction.id || ''); // This will trigger a refresh
      setTransactionDialogOpen(false);
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
      onDeleteTransaction(transactionId);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleFundChange = async (fundId: string | null) => {
    try {
      const updatedExpense = await updateExpense(expense.id, { ...expense, fundId });
      onExpenseUpdate(updatedExpense);
    } catch (error) {
      console.error('Error updating expense fund:', error);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={onClose}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" ml={1}>
          {expense.name}
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box mb={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Amount
          </Typography>
          <Typography variant="h4">
            ${expense.amount.toFixed(2)}
          </Typography>
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Spent
          </Typography>
          <Typography variant="h5" color={totalSpent > expense.amount ? 'error.main' : 'success.main'}>
            ${totalSpent.toFixed(2)}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(percentageSpent, 100)}
            color={totalSpent > expense.amount ? 'error' : 'primary'}
            sx={{ mt: 1 }}
          />
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Remaining
          </Typography>
          <Typography variant="h5" color={remaining < 0 ? 'error.main' : 'success.main'}>
            ${remaining.toFixed(2)}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box mb={2}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Fund
          </Typography>
          <FundSelector
            value={expense.fundId || null}
            onChange={handleFundChange}
            userId={user?.id || ''}
          />
        </Box>
      </Paper>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Transactions</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setTransactionDialogOpen(true)}
          disabled={!expense.fundId}
        >
          Add Transaction
        </Button>
      </Box>

      <List>
        {(expense.transactions || []).map((transaction) => (
          <React.Fragment key={transaction.id}>
            <ListItem
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => transaction.id && handleDeleteTransaction(transaction.id)}
                >
                  <Delete />
                </IconButton>
              }
            >
              <ListItemText
                primary={transaction.description}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      ${transaction.amount.toFixed(2)}
                    </Typography>
                    {' — '}
                    {new Date(transaction.date).toLocaleDateString()}
                  </>
                }
              />
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>

      <TransactionDialog
        open={transactionDialogOpen}
        onClose={() => setTransactionDialogOpen(false)}
        transaction={{
          date: new Date(),
          description: '',
          amount: 0,
          categoryName: 'Expense',
          sourceName: expense.name,
          type: 'expense'
        }}
      />
    </Box>
  );
};

export default ExpenseDetail; 