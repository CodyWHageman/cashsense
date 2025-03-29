import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Transaction, SplitTransaction } from '../../models/Transaction';
import { useBudget } from '../../contexts/BudgetContext';
import { Budget, BudgetCategory, BudgetExpense } from '../../models/Budget';

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction;
}

const getExpense = (expenseId: string, currentBudget: Budget): BudgetExpense | undefined => {
  return currentBudget?.expenses?.find(e => e.id === expenseId);
}

const getCategory = (categoryId: string, currentBudget: Budget): BudgetCategory | undefined => {
  return currentBudget?.categories?.find(c => c.category.id === categoryId);
} 

function TransactionDialog({ open, onClose, transaction }: TransactionDialogProps) {
  const { currentBudget } = useBudget();
  let transactionSource = "";
  let transactionSourceName = "";
  let budgetCategory: BudgetCategory | null = null;

  if (transaction.incomeId) {
    transactionSource = "Income";
    transactionSourceName = currentBudget?.incomes?.find(i => i.id === transaction.incomeId)?.name || "";
  } else if (transaction.expenseId) { 
    if(currentBudget){
      const transactionExpense = getExpense(transaction.expenseId, currentBudget);
      if(transactionExpense){
        transactionSource = "Expense";
        transactionSourceName = transactionExpense?.name || "";
        budgetCategory = getCategory(transactionExpense.categoryId, currentBudget) || null;
      }
    }
  }

  const generateSplitDetails = (split: SplitTransaction) => {
    if(!currentBudget) return null;

    const expense = getExpense(split.expenseId, currentBudget);

    if(!expense) return null;
    const category = getCategory(expense.categoryId, currentBudget);
    
    return (
      <Box 
        key={split.id} 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          pl: 2,
          py: 0.5
        }}
      >
        <Typography color={category?.category.color} variant="caption">
          {expense.name} ({category?.category.name})
        </Typography>
        <Typography variant="caption" color="error.main">
          ${split.splitAmount.toFixed(2)}
        </Typography>
      </Box>
    )
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ m: 0, p: 2, pb: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Transaction Details</Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ color: 'text.secondary' }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <Box sx={{ mt: 1 }}>
          <Box sx={{ mb: 2 }}>
            <Typography color="text.secondary" variant="body2">Date</Typography>
            <Typography>
              {transaction.date.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography color="text.secondary" variant="body2">Description</Typography>
            <Typography>{transaction.description}</Typography>
          </Box>

          {budgetCategory && (
            <Box sx={{ mb: 2 }}>
              <Typography color="text.secondary" variant="body2">Category</Typography>
              <Typography sx={{ color: budgetCategory?.category.color }}>
                {budgetCategory?.category.name}
              </Typography>
            </Box>
          )}

          {!transaction.isSplit && (
            <Box sx={{ mb: 2 }}>
              <Typography color="text.secondary" variant="body2">Source</Typography>
              <Typography>{ transactionSource + ": " + transactionSourceName}</Typography>
            </Box>
          )}

          <Box>
            <Typography color="text.secondary" variant="body2">Amount</Typography>
            <Typography 
              sx={{ 
                color: transaction.incomeId ? 'success.main' : 'text.primary',
                fontWeight: 500
              }}
            >
              {transaction.incomeId ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
            </Typography>
          </Box>

          {transaction.splits && transaction.splits.length > 0 && (
          <Box sx={{ pl: 4, pr: 2, pb: 1, pt: 0 }}>
            <Typography variant="caption" color="text.secondary">
              Split between:
            </Typography>
            {transaction.splits.map(generateSplitDetails)}
          </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default TransactionDialog; 