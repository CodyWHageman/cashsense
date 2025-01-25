// src/components/transactions/TransactionSplitDialog.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  TextField,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { Transaction, TransactionSplitDTO } from '../../models/Transaction';
import { BudgetExpense } from '../../models/Budget';
import { ExpenseSearchBox } from '../budget/ExpenseSearchBox';

interface TransactionSplitDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction;
  expenses: BudgetExpense[];
  onSplit: (splits: TransactionSplitDTO) => Promise<void>;
}

export function TransactionSplitDialog({
  open,
  onClose,
  transaction,
  expenses,
  onSplit
}: TransactionSplitDialogProps) {
  const [splits, setSplits] = useState([
    { amount: transaction.amount, expenseId: '' }
  ]);
  const [error, setError] = useState('');

  const totalSplit = splits.reduce((sum, split) => sum + (split.amount || 0), 0);
  const remainingAmount = transaction.amount - totalSplit;

  const handleAddSplit = () => {
    setSplits([...splits, { amount: 0, expenseId: '' }]);
  };

  const handleRemoveSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleSplitSubmit = async () => {
    if (Math.abs(remainingAmount) > 0.01) {
      setError('Split amounts must equal the total transaction amount');
      return;
    }

    if (splits.some(split => !split.expenseId)) {
      setError('All splits must be assigned to an expense');
      return;
    }

    await onSplit({
      parentTransactionId: transaction.id,
      splits
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Split Transaction</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          Total Amount: ${transaction.amount.toFixed(2)}
        </Typography>
        <Typography variant="caption" color={remainingAmount !== 0 ? 'error' : 'success'}>
          Remaining: ${remainingAmount.toFixed(2)}
        </Typography>

        <List>
          {splits.map((split, index) => (
            <ListItem key={index}>
              <ExpenseSearchBox
                expenses={expenses}
                onSelect={(expense) => {
                  const newSplits = [...splits];
                  newSplits[index].expenseId = expense.id;
                  setSplits(newSplits);
                }}
              />
              <TextField
                type="number"
                value={split.amount}
                onChange={(e) => {
                  const newSplits = [...splits];
                  newSplits[index].amount = parseFloat(e.target.value) || 0;
                  setSplits(newSplits);
                }}
                sx={{ width: 120, ml: 1 }}
              />
              <IconButton onClick={() => handleRemoveSplit(index)}>
                <Remove />
              </IconButton>
            </ListItem>
          ))}
        </List>

        <Button
          startIcon={<Add />}
          onClick={handleAddSplit}
          sx={{ mt: 1 }}
        >
          Add Split
        </Button>

        {error && (
          <Typography color="error" variant="caption" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSplitSubmit} variant="contained">
          Split Transaction
        </Button>
      </DialogActions>
    </Dialog>
  );
}