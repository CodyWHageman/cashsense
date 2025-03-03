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
import { Fund } from '../../models/Budget';
import { Transaction, FundTransaction, TransactionCreateDTO } from '../../models/Transaction';
import { format } from 'date-fns';

interface FundTransactionOptionsDialogProps {
  open: boolean;
  onClose: () => void;
  fund: Fund;
  transaction: TransactionCreateDTO;
  onCreateWithdrawal: () => Promise<void>;
  onCreateDeposit: () => Promise<void>;
  onLinkToExisting: (fundTransactionId: string) => Promise<void>;
}

export default function FundTransactionOptionsDialog({
  open,
  onClose,
  fund,
  transaction,
  onCreateWithdrawal,
  onCreateDeposit,
  onLinkToExisting,
}: FundTransactionOptionsDialogProps) {
  if (!open || !fund || !transaction) {
    return null;
  }

  const [selectedOption, setSelectedOption] = useState<'fund-deposit' | 'fund-withdrawal' | 'transaction'>('fund-deposit');
  const [selectedFundTransactionId, setSelectedFundTransactionId] = useState<string>('');
  const [pendingTransactions, setPendingTransactions] = useState<FundTransaction[]>([]);

  useEffect(() => {
    if (open && fund.fundTransactions) {
      // Filter for incomplete fund transactions that have a valid transaction
      const incomplete = fund.fundTransactions.filter(ft => 
        !ft.transferComplete && 
        ft.transaction && 
        (!ft.transferTransactionId || ft.transferTransaction)
      );
      setPendingTransactions(incomplete);
    }
  }, [open, fund]);

  const handleConfirm = async () => {
    if (selectedOption === 'fund-deposit') {
      await onCreateDeposit();
    } else if (selectedOption === 'fund-withdrawal') {
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
            setSelectedOption(e.target.value as 'fund-deposit' | 'fund-withdrawal' | 'transaction');
            setSelectedFundTransactionId(''); // Reset selection when changing options
          }}
        >
          <FormControlLabel 
            value="fund-deposit" 
            control={<Radio />} 
            label={`Create new deposit transaction for ${fund.name}`}
          />
          <FormControlLabel 
            value="fund-withdrawal" 
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
              {pendingTransactions.map((ft) => {
                const transaction = ft.transaction;
                if (!transaction) return null;
                
                return (
                  <MenuItem key={ft.id} value={ft.id}>
                    {format(new Date(transaction.date), 'MMM d, yyyy')} - ${transaction.amount.toFixed(2)} 
                    ({ft.type})
                    {ft.transferTransaction && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        (Transfer pending)
                      </Typography>
                    )}
                  </MenuItem>
                );
              })}
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