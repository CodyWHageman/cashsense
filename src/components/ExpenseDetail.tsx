import React from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText,
  Button,
  LinearProgress
} from '@mui/material';
import { ArrowBack, Delete } from '@mui/icons-material';
import { Transaction } from '../models/Transaction';
import { BudgetExpense, ExpenseCategory } from '../models/Budget';
import { createTransaction, deleteTransaction } from '../services/transactionService';

interface ExpenseDetailProps {
  expense: BudgetExpense;
  transactions: Transaction[];
  category?: ExpenseCategory;
  onClose: () => void;
  onDeleteTransaction: (transactionId: string) => void;
}

function ExpenseDetail({ 
  expense, 
  transactions = [], 
  category,
  onClose,
  onDeleteTransaction
}: ExpenseDetailProps) {
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const remaining = expense.amount - totalSpent;
  const percentageSpent = expense.amount > 0 ? (totalSpent / expense.amount) * 100 : 0;

  const handleAddTransaction = async () => {
    try {
      const transaction = await createTransaction({
        date: new Date(),
        description: expense.name,
        amount: remaining > 0 ? remaining : 0,
        account: category?.name || 'default',
        expenseId: expense.id,
        createdAt: new Date()
      });
      
      // Refresh the transactions list
      window.location.reload();
    } catch (error) {
      console.error('Error creating transaction:', error);
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        mb: 3
      }}>
        <IconButton onClick={onClose} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h6">
          {expense.name}
        </Typography>
      </Box>

      {/* Progress */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          mb: 1
        }}>
          <Typography variant="body2" color="text.secondary">
            Spent: ${totalSpent.toFixed(2)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Remaining: ${remaining.toFixed(2)}
          </Typography>
        </Box>
        <Box sx={{ position: 'relative', height: 8, bgcolor: 'background.default' }}>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(percentageSpent, 100)}
            sx={{ 
              height: '100%',
              bgcolor: 'background.default',
              '& .MuiLinearProgress-bar': {
                bgcolor: category?.color || 'primary.main'
              }
            }}
          />
        </Box>
      </Box>

      {/* Transactions */}
      <Box>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="subtitle1">
            Transactions
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={handleAddTransaction}
          >
            Add Transaction
          </Button>
        </Box>

        <List>
          {transactions.map(transaction => (
            <ListItem
              key={transaction.id}
              secondaryAction={
                <IconButton 
                  edge="end" 
                  aria-label="delete"
                  onClick={() => transaction.id && handleDeleteTransaction(transaction.id)}
                >
                  <Delete />
                </IconButton>
              }
              sx={{
                bgcolor: 'background.paper',
                mb: 1,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <ListItemText
                primary={transaction.description}
                secondary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {transaction.date.toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      ${transaction.amount.toFixed(2)}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
          {transactions.length === 0 && (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No transactions yet
            </Typography>
          )}
        </List>
      </Box>
    </Box>
  );
}

export default ExpenseDetail; 