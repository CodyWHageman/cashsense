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
  useTheme
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { Budget } from '../../models/Budget';
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
  }>(null);

  const theme = useTheme();
  const { isMobile } = useResponsive();

  // Get all transactions from both expenses and incomes
  const allTransactions = [
    ...(currentBudget.expenses || []).flatMap(expense => 
      (expense.transactions || []).map(t => ({
        ...t,
        categoryName: currentBudget.categories?.find(c => c.category.id === expense.categoryId)?.category.name || 'Unknown',
        categoryColor: currentBudget.categories?.find(c => c.category.id === expense.categoryId)?.category.color,
        sourceName: expense.name,
        type: 'expense' as const
      }))
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

  const renderTransaction = (transaction: {
    date: Date;
    description: string;
    amount: number;
    categoryName: string;
    sourceName: string;
    type: 'income' | 'expense';
    categoryColor?: string;
  }) => (
    <Box sx={{ width: '100%' }}>
      <ListItemText
        primary={
          <Typography variant="body1">
            {transaction.description}
          </Typography>
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
              {transaction.type === 'expense' ? '-' : '+'}${transaction.amount.toFixed(2)}
            </Typography>
          </Box>
        }
      />
    </Box>
  );

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
              action: () => onDeleteTransaction(transaction.id)
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTransaction(transaction.id);
                    }}
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
    </Box>
  );
}

export default TransactionHistory; 