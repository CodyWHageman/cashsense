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
  Paper
} from '@mui/material';
import { Fund } from '../../models/Budget';
import { Transaction, FundTransaction } from '../../models/Transaction';
import { format } from 'date-fns';

interface FundTransferDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction;
  funds: Fund[];
  onMarkTransferComplete: (fundId: string, fundTransactionId: string, transferTransactionId: string) => Promise<void>;
  getPendingFundTransactions: (fundId: string) => Promise<FundTransaction[]>;
}

export const FundTransferDialog: React.FC<FundTransferDialogProps> = ({
  open,
  onClose,
  transaction,
  funds,
  onMarkTransferComplete,
  getPendingFundTransactions
}) => {
  const [selectedFundId, setSelectedFundId] = useState<string>('');
  const [pendingTransactions, setPendingTransactions] = useState<FundTransaction[]>([]);
  const [selectedFundTransactionId, setSelectedFundTransactionId] = useState<string>('');

  useEffect(() => {
    if (selectedFundId) {
      loadPendingTransactions();
    } else {
      setPendingTransactions([]);
      setSelectedFundTransactionId('');
    }
  }, [selectedFundId]);

  const loadPendingTransactions = async () => {
    try {
      const transactions = await getPendingFundTransactions(selectedFundId);
      setPendingTransactions(transactions);
      
      // Auto-select transaction with matching amount
      const matchingTransaction = transactions.find(
        ft => Math.abs(ft.transaction?.amount || 0) === Math.abs(transaction.amount)
      );
      if (matchingTransaction) {
        setSelectedFundTransactionId(matchingTransaction.id);
      } else {
        setSelectedFundTransactionId('');
      }
    } catch (error) {
      console.error('Error loading pending transactions:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFundId || !selectedFundTransactionId) return;
    await onMarkTransferComplete(selectedFundId, selectedFundTransactionId, transaction.id!);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Mark Fund Transfer Complete</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Transfer Transaction: {transaction.description}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Amount: ${Math.abs(transaction.amount).toFixed(2)}
          </Typography>
        </Box>
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select Fund</InputLabel>
          <Select
            value={selectedFundId}
            onChange={(e) => setSelectedFundId(e.target.value as string)}
            label="Select Fund"
          >
            {funds.map(fund => (
              <MenuItem key={fund.id} value={fund.id}>
                {fund.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {pendingTransactions.length > 0 ? (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Select Fund Transaction to Mark Complete:
            </Typography>
            <RadioGroup
              value={selectedFundTransactionId}
              onChange={(e) => setSelectedFundTransactionId(e.target.value)}
            >
              {pendingTransactions.map(ft => (
                <Paper 
                  key={ft.id} 
                  sx={{ 
                    mb: 1, 
                    p: 1,
                    bgcolor: Math.abs(ft.transaction?.amount || 0) === Math.abs(transaction.amount) 
                      ? 'success.light' 
                      : 'background.paper'
                  }}
                >
                  <FormControlLabel
                    value={ft.id}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2">
                          {ft.transaction?.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(ft.transaction?.date || ''), 'MMM d, yyyy')} - 
                          ${Math.abs(ft.transaction?.amount || 0).toFixed(2)} - 
                          {ft.type}
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
              ))}
            </RadioGroup>
          </Box>
        ) : selectedFundId ? (
          <Typography color="text.secondary">
            No pending fund transactions found.
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit}
          variant="contained" 
          color="primary"
          disabled={!selectedFundId || !selectedFundTransactionId}
        >
          Mark Transfer Complete
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 