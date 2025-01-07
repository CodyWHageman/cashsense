import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Paper,
  Menu,
  MenuItem
} from '@mui/material';
import { MoreVert, Delete } from '@mui/icons-material';
import { Transaction } from '../models/Transaction';
import { BudgetExpense } from '../models/Budget';

interface TransactionHistoryProps {
  transactions: Transaction[];
  categories: Array<{
    id: string;
    name: string;
  }>;
  expenses: BudgetExpense[];
  onDeleteTransaction: (transactionId: string) => void;
}

interface MenuState {
  element: HTMLElement | null;
  transactionId: string | null;
}

function TransactionHistory({ 
  transactions = [], 
  categories = [], 
  expenses = [],
  onDeleteTransaction
}: TransactionHistoryProps) {
  const [menuAnchor, setMenuAnchor] = useState<MenuState>({ 
    element: null, 
    transactionId: null 
  });

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>, transactionId: string) => {
    event.stopPropagation();
    setMenuAnchor({ element: event.currentTarget, transactionId });
  };

  const handleCloseMenu = () => {
    setMenuAnchor({ element: null, transactionId: null });
  };

  const getExpenseName = (transaction: Transaction): string => {
    const expense = expenses.find(e => e.id === transaction.expenseId);
    return expense?.name || 'Uncategorized';
  };

  const getCategoryName = (transaction: Transaction): string => {
    const expense = expenses.find(e => e.id === transaction.expenseId);
    if (!expense) return 'Uncategorized';
    const category = categories.find(c => c.id === expense.categoryId);
    return category?.name || 'Uncategorized';
  };

  const formatDate = (date: Date | string): string => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString();
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
        Recent Transactions
      </Typography>
      <TableContainer 
        component={Paper}
        sx={{ 
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          borderRadius: 1
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Expense</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>Amount</TableCell>
              <TableCell width={48}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    No transactions yet
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map(transaction => (
                <TableRow 
                  key={transaction.id}
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'background.default' 
                    }
                  }}
                >
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{getCategoryName(transaction)}</TableCell>
                  <TableCell>{getExpenseName(transaction)}</TableCell>
                  <TableCell align="right">${transaction.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => transaction.id && handleOpenMenu(e, transaction.id)}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={handleCloseMenu}
      >
        <MenuItem 
          onClick={() => {
            if (menuAnchor.transactionId) {
              onDeleteTransaction(menuAnchor.transactionId);
              handleCloseMenu();
            }
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default TransactionHistory; 