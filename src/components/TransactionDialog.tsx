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

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: {
    date: Date;
    description: string;
    amount: number;
    categoryName: string;
    sourceName: string;
    type: 'income' | 'expense';
    categoryColor?: string;
  };
}

function TransactionDialog({ open, onClose, transaction }: TransactionDialogProps) {
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

          <Box sx={{ mb: 2 }}>
            <Typography color="text.secondary" variant="body2">Category</Typography>
            <Typography sx={{ color: transaction.categoryColor }}>
              {transaction.categoryName}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography color="text.secondary" variant="body2">Source</Typography>
            <Typography>{transaction.sourceName}</Typography>
          </Box>

          <Box>
            <Typography color="text.secondary" variant="body2">Amount</Typography>
            <Typography 
              sx={{ 
                color: transaction.type === 'income' ? 'success.main' : 'text.primary',
                fontWeight: 500
              }}
            >
              {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default TransactionDialog; 