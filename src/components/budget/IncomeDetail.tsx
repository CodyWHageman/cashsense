import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText,
  Button,
  Divider,
  SwipeableDrawer,
  styled,
  ListItemSecondaryAction
} from '@mui/material';
import { Delete, Close } from '@mui/icons-material';
import { TransactionCreateDTO } from '../../models/Transaction';
import { BudgetIncome } from '../../models/Budget';
import { createTransaction, deleteTransaction } from '../../services/transactionService';
import TransactionDialog from '../transactions/TransactionDialog';
import { useResponsive } from '../../hooks/useResponsive';
import { format } from 'date-fns';
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

interface IncomeDetailProps {
  income: BudgetIncome;
  onClose: () => void;
  open: boolean;
}

export function IncomeDetail({
  income,
  onClose,
  open
}: IncomeDetailProps) {
  const { isMobile } = useResponsive();
  const { handleIncomeUpdated, handleTransactionDeleted } = useBudget();
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);

  const totalReceived = (income.transactions || []).reduce((sum, t) => sum + t.amount, 0);
  const remaining = income.amount - totalReceived;
  const percentageReceived = income.amount > 0 ? (totalReceived / income.amount) * 100 : 0;

  const handleAddTransaction = async (transaction: TransactionCreateDTO) => {
    try {
      const newTransaction = await createTransaction({
        ...transaction,
        incomeId: income.id
      });

      handleIncomeUpdated({...income, transactions: [...(income.transactions || []), newTransaction]}); // This will trigger a refresh
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
        <Typography variant="h6">Income Details</Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      <Box sx={{ p: 2 }}>
        <Typography variant="h5" color="success.main" gutterBottom>
          ${income.amount.toFixed(2)}
        </Typography>
        <Typography variant="body1" gutterBottom>
          {income.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Expected {format(income.expectedDate || new Date(), 'MMM d, yyyy')}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List>
          {income.transactions?.map((transaction) => (
            <React.Fragment key={transaction.id}>
              <ListItem>
                <ListItemText
                  primary={transaction.description}
                  secondary={format(new Date(transaction.date), 'MMM d, yyyy')}
                />
                <ListItemSecondaryAction>
                  <Typography color="success.main">
                    ${transaction.amount.toFixed(2)}
                  </Typography>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Transactions</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setTransactionDialogOpen(true)}
        >
          Add Transaction
        </Button>
      </Box>

      <List>
        {(income.transactions || []).map((transaction) => (
          <React.Fragment key={transaction.id}>
            <ListItem
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => transaction.id && handleDeleteTransaction(transaction.id)}
                >
                  <Delete />
                </IconButton>
              }
            >
              <ListItemText
                primary={transaction.description}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      ${transaction.amount.toFixed(2)}
                    </Typography>
                    {' — '}
                    {new Date(transaction.date).toLocaleDateString()}
                  </>
                }
              />
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>

      <TransactionDialog
        open={transactionDialogOpen}
        onClose={() => setTransactionDialogOpen(false)}
        transaction={{
          date: new Date(),
          description: '',
          amount: 0,
          categoryName: 'Income',
          sourceName: income.name,
          type: 'income'
        }}
      />
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

export default IncomeDetail; 