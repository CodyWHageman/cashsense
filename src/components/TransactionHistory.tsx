import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton,
  Paper
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { Transaction } from '../models/Transaction';
import { BudgetExpense, ExpenseCategory, BudgetIncome } from '../models/Budget';
import TransactionDialog from './TransactionDialog';

interface TransactionHistoryProps {
  expenses: BudgetExpense[];
  incomes: BudgetIncome[];
  categories: ExpenseCategory[];
  onDeleteTransaction: (transactionId: string) => void;
}

function TransactionHistory({ 
  expenses = [], 
  incomes = [],
  categories = [], 
  onDeleteTransaction 
}: TransactionHistoryProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<null | {
    date: Date;
    description: string;
    amount: number;
    categoryName: string;
    sourceName: string;
    type: 'income' | 'expense';
    categoryColor?: string;
  }>(null);

  // Get all transactions from both expenses and incomes
  const allTransactions = [
    ...expenses.flatMap(expense => 
      (expense.transactions || []).map(t => ({
        ...t,
        categoryName: categories.find(c => c.id === expense.categoryId)?.name || 'Unknown',
        categoryColor: categories.find(c => c.id === expense.categoryId)?.color,
        sourceName: expense.name,
        type: 'expense' as const
      }))
    ),
    ...incomes.flatMap(income => 
      (income.transactions || []).map(t => ({
        ...t,
        categoryName: 'Income',
        categoryColor: '#4caf50', // Green color for income
        sourceName: income.name,
        type: 'income' as const
      }))
    )
  ].sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date, newest first

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Box>
      <Paper className="budget-list-container">
        <List sx={{ py: 0 }}>
          {allTransactions.map(transaction => (
            <ListItem
              key={transaction.id}
              onClick={() => setSelectedTransaction(transaction)}
              sx={{
                cursor: 'pointer',
                py: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                  '& .transaction-amount': {
                    display: 'none'
                  },
                  '& .delete-button': {
                    display: 'flex'
                  }
                }
              }}
            >
              <Box sx={{ minWidth: 50, mr: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(transaction.date)}
                </Typography>
              </Box>
              <ListItemText
                primary={
                  <Typography
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {transaction.description}
                  </Typography>
                }
              />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography 
                  className="transaction-amount"
                  sx={{ 
                    color: transaction.type === 'income' ? 'success.main' : 'text.primary',
                    fontWeight: 500
                  }}
                >
                  {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                </Typography>
                <IconButton 
                  className="delete-button"
                  edge="end" 
                  aria-label="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    transaction.id && onDeleteTransaction(transaction.id);
                  }}
                  sx={{ 
                    color: 'text.secondary',
                    display: 'none'
                  }}
                >
                  <Delete />
                </IconButton>
              </Box>
            </ListItem>
          ))}
          {allTransactions.length === 0 && (
            <ListItem>
              <Typography color="text.secondary" sx={{ width: '100%', textAlign: 'center', py: 2 }}>
                No transactions yet
              </Typography>
            </ListItem>
          )}
        </List>
      </Paper>

      {selectedTransaction && (
        <TransactionDialog
          open={Boolean(selectedTransaction)}
          onClose={() => setSelectedTransaction(null)}
          transaction={selectedTransaction}
        />
      )}
    </Box>
  );
}

export default TransactionHistory; 