import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton,
  Paper,
  Divider,
  styled,
  useTheme,
  Chip,
  Icon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { CallSplitTwoTone, Delete } from '@mui/icons-material';
import { Budget } from '../../models/Budget';
import { Transaction } from '../../models/Transaction';
import TransactionDialog from '../transactions/TransactionDialog';
import { SwipeableList, SwipeableListItem } from '@sandstreamdev/react-swipeable-list';
import { useResponsive } from '../../hooks/useResponsive';
import { format } from 'date-fns';
import TransactionList from '../transactions/TransactionList';
import { useBudget } from '../../contexts/BudgetContext';
import { deleteTransaction } from '../../services/transactionService';
import { useSnackbar } from 'notistack';
const StyledListItem = styled(ListItem)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  cursor: 'pointer',
}));

function TransactionHistory() {
  const { currentBudget, handleTransactionDeleted } = useBudget();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    transaction: Transaction | null;
  }>({
    open: false,
    transaction: null
  });

  const { enqueueSnackbar } = useSnackbar();
  const { isMobile } = useResponsive();

  // Get all transactions from both expenses and incomes
  const allTransactions: Transaction[] = [
    ...(currentBudget?.incomes || []).flatMap(income => (income.transactions || [])),
    ...(currentBudget?.expenses || []).flatMap(expense => (expense.transactions || [])),
    // First, collect all transactions from incomes and expenses
  ];

  // Then, process split transactions to add distinct parent transactions or update existing ones
  (currentBudget?.expenses || []).flatMap(expense => 
    (expense.splitTransactions || []).flatMap(st => {
      const parentTransaction = st.parentTransaction;
      if (parentTransaction && !allTransactions.some(t => t.id === parentTransaction.id)) {
        const newParentTransaction: Transaction = {
          ...parentTransaction,
          splits: [st]          
        };
        allTransactions.push(newParentTransaction); // Add the new parent transaction to the list
      } else {
        const parentTransactionIndex = allTransactions.findIndex(t => t.id === parentTransaction?.id);
        if (parentTransactionIndex !== -1) {
          allTransactions[parentTransactionIndex].splits = allTransactions[parentTransactionIndex].splits || [];
          allTransactions[parentTransactionIndex].splits.push(st);
        }
      }
      return [];
    })
  );

  // Finally, sort the transactions by date, newest first
  allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderTransaction = (transaction: any) => (
    <Box sx={{ width: '100%' }}>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {transaction.isSplit && (
              <Icon color="primary">
                <CallSplitTwoTone />
              </Icon>
            )}
            <Typography variant="body1">
              {transaction.description}
            </Typography>
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {format(new Date(transaction.date), 'MMM d, yyyy')}
            </Typography>
            <Typography
              variant="body2"
              color={transaction.type === 'expense' ? 'error.main' : 'success.main'}
            >
              {transaction.type === 'expense' ? '-' : '+'}${(transaction.splitAmount || transaction.amount).toFixed(2)}
            </Typography>
          </Box>
        }
      />
    </Box>
  );

  const handleDeleteClick = (e: React.MouseEvent, transaction: Transaction) => {
    e.stopPropagation();
    setDeleteConfirmation({
      open: true,
      transaction
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmation.transaction) {
      try {
        await deleteTransaction(deleteConfirmation.transaction.id);
        handleTransactionDeleted(deleteConfirmation.transaction.id);
        enqueueSnackbar('Transaction deleted successfully', { variant: 'success' });
      } catch (error) {
        console.error('Error deleting transaction:', error);
        enqueueSnackbar('Error deleting transaction', { variant: 'error' });
      }
    }
    setDeleteConfirmation({ open: false, transaction: null });
  };

  if (isMobile) {
    return (
      <SwipeableList>
        {allTransactions.map((transaction) => (
          <SwipeableListItem
            key={transaction.id}
            swipeLeft={{
              content: (
                <Box sx={{ 
                  bgcolor: 'error.main',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  px: 2
                }}>
                  <Delete sx={{ color: 'white' }} />
                </Box>
              ),
              action: () => setDeleteConfirmation({ open: true, transaction: transaction })
            }}
          >
            <StyledListItem
              onClick={() => setSelectedTransaction(transaction)}
            >
              {renderTransaction(transaction)}
            </StyledListItem>
          </SwipeableListItem>
        ))}
      </SwipeableList>
    );
  }

  return (
    <Box>
      <Paper className="budget-list-container">
        <TransactionList transactions={allTransactions} />
      </Paper>

      {selectedTransaction && (
        <TransactionDialog
          open={Boolean(selectedTransaction)}
          onClose={() => setSelectedTransaction(null)}
          transaction={selectedTransaction}
        />
      )}

      <Dialog
        open={deleteConfirmation.open}
        onClose={() => setDeleteConfirmation({ open: false, transaction: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this transaction?
          <Typography variant="body2" color="success.main" sx={{ mt: 1, textAlign: 'center' }}>
            {deleteConfirmation.transaction?.description}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmation({ open: false, transaction: null })}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TransactionHistory; 