import React, { useState } from 'react';
import { 
  List, 
  Divider, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import { Transaction, TransactionSplitDTO } from '../../models/Transaction';
import TransactionDialog from './TransactionDialog';
import TransactionListItem from './TransactionListItem';
import { deleteTransaction, splitTransaction } from '../../services/transactionService';
import { enqueueSnackbar } from 'notistack';
import { useBudget } from '../../contexts/BudgetContext';
import { TransactionSplitDialog } from './TransactionSplitDialog';

interface TransactionListProps {
  transactions: Transaction[];
  emptyMessage?: string;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  emptyMessage = "No transactions yet"
}) => {
  const { handleTransactionDeleted } = useBudget();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedTransactionToSplit, setSelectedTransactionToSplit] = useState<Transaction | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    transaction: Transaction | null;
  }>({
    open: false,
    transaction: null
  });
  
  const handleDeleteTransaction = (transaction: Transaction) => {
    setDeleteConfirmation({
      open: true,
      transaction
    });
  };

  const handleDeleteConfirmed = async () => {
    if (deleteConfirmation.transaction) {
      try {
        await deleteTransaction(deleteConfirmation.transaction.id);
        handleTransactionDeleted(deleteConfirmation.transaction.id);
        enqueueSnackbar('Transaction deleted successfully', { variant: 'success' });
      } catch (error) {
        console.error('Error deleting transaction:', error);
        enqueueSnackbar('Error deleting transaction', { variant: 'error' });
      }
    }

    setDeleteConfirmation({ open: false, transaction: null });
  };

  const onSplitTransactionClick = (transaction: Transaction) => {
    setSelectedTransactionToSplit(transaction);
  }

  const handleSplitTransaction = async (splits: TransactionSplitDTO) => {
    try {
      await splitTransaction(splits);
      handleTransactionDeleted(splits.parentTransactionId); // This will trigger a refresh
      setSelectedTransactionToSplit(null);
    } catch (error) {
      console.error('Error splitting transaction:', error);
    }
  };

  return (
    <>
      <List sx={{ py: 0 }}>
        {transactions.length > 0 ? (
          transactions.map((transaction, index) => (
            <React.Fragment key={transaction.id || index}>
              <TransactionListItem
                transaction={transaction}
                onDeleteClick={handleDeleteTransaction}
                onSplitClick={onSplitTransactionClick}
                onClick={() => setSelectedTransaction(transaction)}
              />
              {index < transactions.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">{emptyMessage}</Typography>
          </Box>
        )}
      </List>

      {selectedTransaction && (
        <TransactionDialog
          open={Boolean(selectedTransaction)}
          onClose={() => setSelectedTransaction(null)}
          transaction={selectedTransaction}
        />
      )}

      <Dialog
        open={deleteConfirmation.open}
        onClose={() => setDeleteConfirmation({ open: false, transaction: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this transaction?
          <Typography variant="body2" color="success.main" sx={{ mt: 1, textAlign: 'center' }}>
            {deleteConfirmation.transaction?.description}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmation({ open: false, transaction: null })}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirmed}
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {selectedTransactionToSplit && (
        <TransactionSplitDialog
          open={Boolean(selectedTransactionToSplit)}
          onClose={() => setSelectedTransactionToSplit(null)}
          transaction={selectedTransactionToSplit}
          onSubmit={handleSplitTransaction}
        />
      )}
    </>
  );
};

export default TransactionList;
