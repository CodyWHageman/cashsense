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

const StyledListItem = styled(ListItem)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  cursor: 'pointer',
}));

interface TransactionHistoryProps {
  currentBudget: Budget;
  onDeleteTransaction: (transactionId: string) => void;
}

function TransactionHistory({ 
  currentBudget,
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
    splitAmount?: number;
    isSplit?: boolean;
  }>(null);
  
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    transaction: Transaction | null;
  }>({
    open: false,
    transaction: null
  });

  const theme = useTheme();
  const { isMobile } = useResponsive();

  // Get all transactions from both expenses and incomes
  const allTransactions = [
    ...(currentBudget.expenses || []).flatMap(expense => 
      [
        ...(expense.transactions || []).map(t => ({
          ...t,
          categoryName: currentBudget.categories?.find(c => c.category.id === expense.categoryId)?.category.name || 'Unknown',
          categoryColor: currentBudget.categories?.find(c => c.category.id === expense.categoryId)?.category.color,
          sourceName: expense.name,
          type: 'expense' as const
        })),
        ...(expense.splitTransactions || []).map(split => ({
          ...split.parentTransaction,
          splitAmount: split.splitAmount,
          categoryName: currentBudget.categories?.find(c => c.category.id === expense.categoryId)?.category.name || 'Unknown',
          categoryColor: currentBudget.categories?.find(c => c.category.id === expense.categoryId)?.category.color,
          sourceName: expense.name,
          type: 'expense' as const,
          isSplit: true
        }))
      ]
    ),
    ...(currentBudget.incomes || []).flatMap(income => 
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

  const handleConfirmDelete = () => {
    if (deleteConfirmation.transaction) {
      onDeleteTransaction(deleteConfirmation.transaction.id);
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
        <List sx={{ py: 0 }}>
          {allTransactions.map((transaction) => (
            <React.Fragment key={transaction.id}>
              <StyledListItem
                onClick={() => setSelectedTransaction(transaction)}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    onClick={(e) => handleDeleteClick(e, transaction)}
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                }
              >
                {renderTransaction(transaction)}
              </StyledListItem>
              <Divider component="li" />
            </React.Fragment>
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