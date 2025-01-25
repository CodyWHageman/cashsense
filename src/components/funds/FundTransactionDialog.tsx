import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Transaction } from '../../models/Transaction';
import { createTransaction } from '../../services/transactionService';
import { createFundTransaction } from '../../services/fundService';

interface FundTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  fundId: string;
  fundName: string;
}

function FundTransactionDialog({ 
  open, 
  onClose, 
  fundId,
  fundName 
}: FundTransactionDialogProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'deposit' as 'deposit' | 'withdrawal'
  });

  const [error, setError] = useState<{
    description?: string;
    amount?: string;
  }>({});

  const validate = () => {
    const newError: typeof error = {};
    
    if (!formData.description?.trim()) {
      newError.description = 'Description is required';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newError.amount = 'Amount must be greater than 0';
    }

    setError(newError);
    return Object.keys(newError).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      // Create the transaction
      const transaction = await createTransaction({
        date: new Date(formData.date),
        description: formData.description,
        amount: parseFloat(formData.amount),
        createdAt: new Date()
      });

      // Create the fund transaction
      await createFundTransaction(
        fundId,
        transaction.id!,
        formData.type,
        false
      );

      onClose();
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'deposit'
      });
    } catch (error) {
      console.error('Error creating fund transaction:', error);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Add Transaction to {fundName}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            error={!!error.description}
            helperText={error.description}
            fullWidth
          />

          <TextField
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={!!error.amount}
            helperText={error.amount}
            fullWidth
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={formData.type}
              exclusive
              onChange={(_, newValue) => {
                if (newValue !== null) {
                  setFormData({ ...formData, type: newValue });
                }
              }}
              aria-label="transaction type"
            >
              <ToggleButton value="deposit" aria-label="deposit">
                Deposit
              </ToggleButton>
              <ToggleButton value="withdrawal" aria-label="withdrawal">
                Withdrawal
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Add Transaction
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FundTransactionDialog; 