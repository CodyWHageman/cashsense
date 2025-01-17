import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { Fund } from '../models/Budget';
import { Transaction, FundTransaction } from '../models/Transaction';
import { format } from 'date-fns';

interface FundTransactionOptionsDialogProps {
  open: boolean;
  onClose: () => void;
  fund: Fund;
  transaction: Transaction;
  onCreateWithdrawal: () => Promise<void>;
  onLinkToExisting: (fundTransactionId: string) => Promise<void>;
}

export default function FundTransactionOptionsDialog({
  open,
  onClose,
  fund,
  transaction,
  onCreateWithdrawal,
  onLinkToExisting,
}: FundTransactionOptionsDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'fund' | 'transaction'>('fund');
  const [selectedFundTransactionId, setSelectedFundTransactionId] = useState<string>('');
  const [pendingTransactions, setPendingTransactions] = useState<FundTransaction[]>([]);

  useEffect(() => {
    if (open && fund.fundTransactions) {
      // Filter for incomplete fund transactions
      const incomplete = fund.fundTransactions.filter(ft => !ft.transferComplete);
      setPendingTransactions(incomplete);
    }
  }, [open, fund]);

  const handleConfirm = async () => {
    if (selectedOption === 'fund') {
      await onCreateWithdrawal();
    } else {
      await onLinkToExisting(selectedFundTransactionId);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Fund Transaction Options</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Transaction Details:
          </Typography>
          <Typography variant="body2">
            Date: {format(new Date(transaction.date), 'MMM d, yyyy')}
          </Typography>
          <Typography variant="body2">
            Description: {transaction.description}
          </Typography>
          <Typography variant="body2">
            Amount: ${transaction.amount.toFixed(2)}
          </Typography>
        </Box>

        <RadioGroup
          value={selectedOption}
          onChange={(e) => {
            setSelectedOption(e.target.value as 'fund' | 'transaction');
            setSelectedFundTransactionId(''); // Reset selection when changing options
          }}
        >
          <FormControlLabel 
            value="fund" 
            control={<Radio />} 
            label={`Create new withdrawal transaction for ${fund.name}`}
          />
          <FormControlLabel 
            value="transaction" 
            control={<Radio />} 
            label="Link to existing incomplete fund transaction" 
          />
        </RadioGroup>

        {selectedOption === 'transaction' && (
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Fund Transaction</InputLabel>
            <Select
              value={selectedFundTransactionId}
              onChange={(e) => setSelectedFundTransactionId(e.target.value as string)}
              label="Select Fund Transaction"
            >
              {pendingTransactions.map((ft) => (
                <MenuItem key={ft.id} value={ft.id}>
                  {format(new Date(ft.transaction?.date || new Date()), 'MMM d, yyyy')} - ${ft.transaction?.amount.toFixed(2)} 
                  ({ft.type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleConfirm}
          disabled={selectedOption === 'transaction' && !selectedFundTransactionId}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
} 