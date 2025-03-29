import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  IconButton,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { BudgetExpense } from '../../models/Budget';
import { ExpenseSearchBox } from '../budget/ExpenseSearchBox';
import { TransactionCreateDTO } from '../../models/Transaction';
import { createTransaction, splitTransaction } from '../../services/transactionService';
import { generateHashId } from '../../utils/transactionUtils';

interface AddTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  expenses: BudgetExpense[];
  onTransactionAdded: (transaction: any) => void;
}

export function AddTransactionDialog({
  open,
  onClose,
  expenses,
  onTransactionAdded
}: AddTransactionDialogProps) {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | string>('');
  const [isSplit, setIsSplit] = useState(false);
  const [error, setError] = useState('');

  // For single transaction
  const [selectedExpenseId, setSelectedExpenseId] = useState('');

  // For split transactions
  const [splits, setSplits] = useState([
    { amount: 0, expenseId: '' }
  ]);

  const handleAddSplit = () => {
    setSplits([...splits, { amount: 0, expenseId: '' }]);
  };

  const handleRemoveSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const totalSplit = splits.reduce((sum, split) => sum + (split.amount || 0), 0);
  const remainingAmount = Number(amount) - totalSplit;

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setAmount('');
    setSelectedExpenseId('');
    setIsSplit(false);
    setSplits([{ amount: 0, expenseId: '' }]);
    setError('');
  };

  const handleSubmit = async () => {
    if (!description) {
      setError('Description is required');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    try {
      if (isSplit) {
        // Validate split transaction
        if (Math.abs(remainingAmount) > 0.01) {
          setError('Split amounts must equal the total transaction amount');
          return;
        }

        if (splits.some(split => !split.expenseId)) {
          setError('All splits must be assigned to an expense');
          return;
        }

        // Create parent transaction first
        const newTransaction: TransactionCreateDTO = {
          date: new Date(date),
          description,
          amount: Number(amount),
          hashId: generateHashId(Number(amount), new Date(date), description)
        };

        const transaction = await createTransaction(newTransaction);

        // Create splits
        await splitTransaction({
          parentTransactionId: transaction.id,
          splits: splits.map(split => ({
            amount: split.amount,
            expenseId: split.expenseId
          }))
        });

        onTransactionAdded(transaction);
      } else {
        // Validate single transaction
        if (!selectedExpenseId) {
          setError('Please select an expense');
          return;
        }

        // Create single transaction
        const newTransaction: TransactionCreateDTO = {
          date: new Date(date),
          description,
          amount: Number(amount),
          expenseId: selectedExpenseId,
          hashId: generateHashId(Number(amount), new Date(date), description)
        };

        const transaction = await createTransaction(newTransaction);
        onTransactionAdded(transaction);
      }

      resetForm();
      onClose();
    } catch (err) {
      console.error('Error adding transaction:', err);
      setError('Failed to add transaction');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Transaction</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Transaction Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            required
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            required
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
            }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={isSplit}
                onChange={(e) => setIsSplit(e.target.checked)}
              />
            }
            label="Split Transaction"
          />

          {isSplit ? (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Split Transaction - Total Amount: ${Number(amount).toFixed(2)}
              </Typography>
              <Typography variant="caption" color={remainingAmount !== 0 ? 'error' : 'success'}>
                Remaining: ${remainingAmount.toFixed(2)}
              </Typography>

              <List>
                {splits.map((split, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ExpenseSearchBox
                      expenses={expenses}
                      onSelect={(expense) => {
                        const newSplits = [...splits];
                        newSplits[index].expenseId = expense?.id || '';
                        setSplits(newSplits);
                      }}
                      fullWidth={false}
                      size="small"
                    />
                    <TextField
                      type="number"
                      value={split.amount || ''}
                      onChange={(e) => {
                        const newSplits = [...splits];
                        newSplits[index].amount = parseFloat(e.target.value) || 0;
                        setSplits(newSplits);
                      }}
                      size="small"
                      sx={{ width: 120, ml: 1 }}
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>
                      }}
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
            </Box>
          ) : (
            <ExpenseSearchBox
              expenses={expenses}
              onSelect={(expense) => setSelectedExpenseId(expense?.id || '')}
              label="Select Expense"
            />
          )}

          {error && (
            <Typography color="error" variant="caption" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
          resetForm();
          onClose();
        }}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add Transaction
        </Button>
      </DialogActions>
    </Dialog>
  );
} 