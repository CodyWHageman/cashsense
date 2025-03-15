import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { Fund } from '../../models/Budget';
import { format } from 'date-fns';
import { Warning, CheckCircle, Delete } from '@mui/icons-material';
import { deleteFundTransaction } from '../../services/fundService';
import { FundTransaction } from '../../models/Transaction';

interface FundDetailProps {
  fund: Fund;
  balance: number;
  onTransactionDeleted?: () => void;
}

const FundDetail: React.FC<FundDetailProps> = ({ fund, balance, onTransactionDeleted }) => {
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    transaction: FundTransaction | null;
  }>({
    open: false,
    transaction: null
  });

  const handleDeleteClick = (transaction: FundTransaction, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeleteConfirmation({
      open: true,
      transaction
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.transaction) return;
    
    try {
      await deleteFundTransaction(deleteConfirmation.transaction);
      // Notify parent component that a transaction was deleted
      if (onTransactionDeleted) {
        onTransactionDeleted();
      }
    } catch (error) {
      console.error('Error deleting fund transaction:', error);
    } finally {
      setDeleteConfirmation({ open: false, transaction: null });
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {fund.name} Details
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Current Balance
        </Typography>
        <Typography variant="h4" color={balance >= 0 ? 'success.main' : 'error.main'}>
          ${balance.toFixed(2)}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Target Amount
        </Typography>
        <Typography variant="h5">
          ${fund.targetAmount.toFixed(2)}
        </Typography>
      </Box>

      <Typography variant="h6" gutterBottom>
        Recent Transactions
      </Typography>
      
      {fund.fundTransactions && fund.fundTransactions.length > 0 ? (
        <List>
          {fund.fundTransactions.map((ft) => (
            <React.Fragment key={ft.id}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {ft.transaction?.description}
                      <Chip
                        icon={ft.transferComplete ? <CheckCircle fontSize="small" /> : <Warning fontSize="small" />}
                        label={ft.transferComplete ? "Transfer Complete" : "Pending Transfer"}
                        size="small"
                        color={ft.transferComplete ? "success" : "warning"}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      {format(new Date(ft.transaction?.date || ft.createdAt), 'MMM d, yyyy')}
                      <Typography
                        component="span"
                        variant="body2"
                        color={ft.type === 'deposit' ? 'success.main' : 'error.main'}
                        sx={{ display: 'block' }}
                      >
                        {ft.type === 'deposit' ? '+' : '-'}${ft.transaction?.amount.toFixed(2)}
                      </Typography>
                    </>
                  }
                />
                <IconButton 
                  edge="end" 
                  size="small"
                  onClick={(e) => handleDeleteClick(ft, e)}
                >
                  <Delete />
                </IconButton>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography color="text.secondary">
          No transactions yet
        </Typography>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmation.open}
        onClose={() => setDeleteConfirmation({ open: false, transaction: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this transaction?
          {deleteConfirmation.transaction?.transaction && (
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {deleteConfirmation.transaction.transaction.description} - 
              ${deleteConfirmation.transaction.transaction.amount.toFixed(2)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmation({ open: false, transaction: null })}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default FundDetail; 