import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText,
  Button,
  LinearProgress,
  Paper,
  Divider,
  SwipeableDrawer,
  styled,
  useTheme,
  ListItemSecondaryAction,
  Chip,
  Icon
} from '@mui/material';
import { Close, Delete, AccountBalance, CallSplit, CallSplitTwoTone } from '@mui/icons-material';
import { Transaction, TransactionSplitDTO } from '../../models/Transaction';
import { Budget, BudgetExpense, ExpenseCategory } from '../../models/Budget';
import { createTransaction, deleteTransaction, splitTransaction } from '../../services/transactionService';
import { updateExpense } from '../../services/expenseService';
import { createFundTransaction } from '../../services/fundService';
import TransactionDialog from '../transactions/TransactionDialog';
import FundSelector from '../funds/FundSelector';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { format } from 'date-fns';
import { TransactionSplitDialog } from '../transactions/TransactionSplitDialog';
import { useBudget } from '../../contexts/BudgetContext';

const DesktopPanel = styled(Box)(({ theme }) => ({
  width: '400px',
  height: '100vh',
  position: 'fixed',
  right: 0,
  top: 0,
  borderLeft: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
}));

interface ExpenseDetailProps {
  expense: BudgetExpense;
  category?: ExpenseCategory;
  onClose: () => void;
  open: boolean;
}

function ExpenseDetail({
  expense,
  category,
  onClose,
  open
}: ExpenseDetailProps) {
  const { isMobile } = useResponsive();
  const { currentBudget, handleTransactionDeleted, handleExpenseUpdated } = useBudget();
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const { user } = useAuth();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // const totalSpent = (expense.transactions || []).reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = (expense.transactions || []).reduce((sum, t) => sum + t.amount, 0) +
  (expense.splitTransactions || []).reduce((sum, t) => sum + t.splitAmount, 0);
  const remaining = expense.amount - totalSpent;
  const percentageSpent = expense.amount > 0 ? (totalSpent / expense.amount) * 100 : 0;

  const handleAddTransaction = async (transaction: Transaction) => {
    try {
      const newTransaction = await createTransaction({
        ...transaction,
        expenseId: expense.id
      });

      // If the expense has a fund assigned, create a fund transaction as a deposit
      if (expense.fundId && newTransaction.id) {
        await createFundTransaction(
          expense.fundId,
          newTransaction.id,
          'deposit',
          false
        );
      }

      handleTransactionDeleted(newTransaction.id || ''); // This will trigger a refresh
      setTransactionDialogOpen(false);
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
      handleTransactionDeleted(transactionId);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleFundChange = async (fundId: string | null) => {
    try {
      const updatedExpense = await updateExpense(expense.id, { ...expense, fundId });
      handleExpenseUpdated(updatedExpense);
    } catch (error) {
      console.error('Error updating expense fund:', error);
    }
  };

  const handleSplitTransaction = async (splitDTO: TransactionSplitDTO) => {
    try {
      await splitTransaction(splitDTO);
      handleTransactionDeleted(splitDTO.parentTransactionId); // This will trigger a refresh
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Error splitting transaction:', error);
    }
  };

  const Content = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6">Expense Details</Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      <Box sx={{ p: 2 }}>
        <Typography variant="h5" color="error.main" gutterBottom>
          ${expense.amount.toFixed(2)}
        </Typography>
        <Typography variant="body1" gutterBottom>
          {expense.name}
        </Typography>
        {category && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: category.color,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: category.color
              }}
            />
            {category.name}
          </Typography>
        )}
      </Box>

      <Box sx={{ p: 2 }}>
        <Box mb={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Spent
          </Typography>
          <Typography variant="h6" color={totalSpent > expense.amount ? 'error.main' : 'success.main'}>
            ${totalSpent.toFixed(2)}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(percentageSpent, 100)}
            color={totalSpent > expense.amount ? 'error' : 'primary'}
            sx={{ mt: 1 }}
          />
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Remaining
          </Typography>
          <Typography variant="h6" color={remaining < 0 ? 'error.main' : 'success.main'}>
            ${remaining.toFixed(2)}
          </Typography>
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Fund
          </Typography>
          <FundSelector
            value={expense.fundId || null}
            onChange={handleFundChange}
            userId={user?.id || ''}
          />
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List>
          {expense.transactions?.map((transaction) => (
            <React.Fragment key={transaction.id}>
              <ListItem>
                <ListItemText
                  primary={transaction.description}
                  secondary={format(new Date(transaction.date), 'MMM d, yyyy')}
                />
                <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography color="error.main" sx={{ mr: 2 }}>
                    ${transaction.amount.toFixed(2)}
                  </Typography>
                  {!transaction.isSplit && (
                    <IconButton
                      edge="end"
                      onClick={() => setSelectedTransaction(transaction)}
                      sx={{ mr: 1 }}
                    >
                      <CallSplit />
                    </IconButton>
                  )}
                  <IconButton
                    edge="end"
                    onClick={() => transaction.id && handleDeleteTransaction(transaction.id)}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
          {expense.splitTransactions?.map((splitTransaction) => (
            <React.Fragment key={splitTransaction.id}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Icon>
                        <CallSplitTwoTone />
                      </Icon>
                      <Typography>{splitTransaction.parentTransaction.description}</Typography>
                    </Box>
                  }
                  secondary={format(new Date(splitTransaction.parentTransaction.date), 'MMM d, yyyy')}
                />
                <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography color="error.main" sx={{ mr: 2 }}>
                    ${splitTransaction.splitAmount.toFixed(2)}
                  </Typography>
                  <IconButton
                    edge="end"
                    onClick={() => splitTransaction.parentTransaction.id && handleDeleteTransaction(splitTransaction.parentTransaction.id)}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => setTransactionDialogOpen(true)}
          disabled={!expense.fundId}
        >
          Add Transaction
        </Button>
      </Box>

      {selectedTransaction && (
        <TransactionDialog
          open={transactionDialogOpen}
          onClose={() => setTransactionDialogOpen(false)}
          transaction={selectedTransaction}
        />
      )}

      {selectedTransaction && (
        <TransactionSplitDialog
          open={Boolean(selectedTransaction)}
          onClose={() => setSelectedTransaction(null)}
          transaction={selectedTransaction}
          onSubmit={handleSplitTransaction}
        />
      )}
    </Box>
  );

  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            height: '90vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16
          }
        }}
      >
        <Content />
      </SwipeableDrawer>
    );
  }

  return open ? (
    <DesktopPanel>
      <Content />
    </DesktopPanel>
  ) : null;
} 

export default ExpenseDetail;