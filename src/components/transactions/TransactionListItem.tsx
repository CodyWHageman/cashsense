import React from 'react';
import { 
  ListItem, 
  ListItemText, 
  IconButton, 
  Typography, 
  Box, 
  Icon,
  Collapse
} from '@mui/material';
import { Delete, CallSplitTwoTone, CallSplit } from '@mui/icons-material';
import { Transaction } from '../../models/Transaction';
import { format } from 'date-fns';

interface TransactionListItemProps {
  transaction: Transaction;
  onDeleteClick: (transaction: Transaction) => void;
  onSplitClick?: (transaction: Transaction) => void;
  onClick: (transaction: Transaction) => void;
}

const TransactionListItem: React.FC<TransactionListItemProps> = ({
  transaction,
  onDeleteClick,
  onSplitClick,
  onClick
}) => {
  const isIncome = transaction.incomeId !== null;
  const amount = transaction.amount;
  const isSplit = transaction.isSplit;

  return (
    <>
      <ListItem
        onClick={() => {
          onClick(transaction);
        }}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover',
          }
        }}
        secondaryAction={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="body2"
              color={isIncome ? 'success.main' : 'error.main'}
              sx={{ mr: 2 }}
            >
              {isIncome ? '+' : '-'}${amount.toFixed(2)}
            </Typography>
            
            {!isSplit && onSplitClick && (
              <IconButton
                edge="end"
                onClick={(e) => {
                  e.stopPropagation();
                  onSplitClick(transaction);
                }}
                sx={{ mr: 1 }}
              >
                <CallSplit />
              </IconButton>
            )}
            
            <IconButton
              edge="end"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(transaction);  
              }}
              size="small"
            >
              <Delete />
            </IconButton>
          </Box>
        }
      >
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isSplit && (
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
            <Typography variant="caption" color="text.secondary">
              {format(new Date(transaction.date), 'MMM d, yyyy')}
            </Typography>
          }
        />
      </ListItem>
    </>
  );
};

export default TransactionListItem; 