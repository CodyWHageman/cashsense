import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  LinearProgress,
  Grid
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, AccountBalance as AccountBalanceIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Fund } from '../models/Budget';
import { getUserFunds, getFundBalance, updateFund, createFund, deleteFund } from '../services/fundService';
import { calculateFundBalance, FundWithBalance } from '../utils/fundUtils';
import FundEditor from './FundEditor';
import FundTransactionDialog from './FundTransactionDialog';
import FundDetail from './FundDetail';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from 'material-ui-confirm';
import { useSnackbar } from 'notistack';

interface FundManagerProps {
  userId: string;
}

interface EditDialogState {
  open: boolean;
  fund: Partial<Fund>;
}

interface TransactionDialogState {
  open: boolean;
  fundId: string;
  fundName: string;
}

export const FundManager: React.FC<FundManagerProps> = ({ userId }) => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const { enqueueSnackbar } = useSnackbar();
  const [funds, setFunds] = useState<FundWithBalance[]>([]);
  const [editDialog, setEditDialog] = useState<EditDialogState>({
    open: false,
    fund: {},
  });
  const [transactionDialog, setTransactionDialog] = useState<TransactionDialogState>({
    open: false,
    fundId: '',
    fundName: ''
  });
  const [selectedFund, setSelectedFund] = useState<FundWithBalance | null>(null);

  const loadFunds = async () => {
    if (!user?.id) return;
    try {
      const userFunds = await getUserFunds(user.id);
      const fundsWithBalances = userFunds.map(calculateFundBalance);
      setFunds(fundsWithBalances);
    } catch (error) {
      console.error('Error loading funds:', error);
      enqueueSnackbar('Error loading funds', { variant: 'error' });
    }
  };

  useEffect(() => {
    loadFunds();
  }, [userId]);

  const handleEditFund = (fund?: Fund) => {
    setEditDialog({
      open: true,
      fund: fund ? { ...fund } : { name: '', description: '', targetAmount: 0, userId },
    });
  };

  const handleSave = async (fund: Fund) => {
    try {
      if (fund.id) {
        await updateFund(fund.id, fund);
      } else if (fund.name && fund.targetAmount) {
        await createFund({ ...fund, userId } as Omit<Fund, 'id'>);
      }
      setEditDialog({ open: false, fund: {} });
      loadFunds();
    } catch (error) {
      console.error('Error saving fund:', error);
    }
  };

  const handleDeleteFund = async (fundId: string) => {
    if (window.confirm('Are you sure you want to delete this fund?')) {
      try {
        await deleteFund(fundId);
        if (selectedFund?.id === fundId) {
          setSelectedFund(null);
        }
        loadFunds();
      } catch (error) {
        console.error('Error deleting fund:', error);
      }
    }
  };

  const handleAddTransaction = (fund: Fund) => {
    setTransactionDialog({
      open: true,
      fundId: fund.id,
      fundName: fund.name
    });
  };

  const handleTransactionDialogClose = () => {
    setTransactionDialog({
      open: false,
      fundId: '',
      fundName: ''
    });
    loadFunds();
  };

  const handleFundClick = (fund: Fund) => {
    setSelectedFund(selectedFund?.id === fund.id ? null : calculateFundBalance(fund));
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Funds</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleEditFund()}
        >
          Add Fund
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={selectedFund ? 8 : 12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Target Amount</TableCell>
                  <TableCell align="right">Current Balance</TableCell>
                  <TableCell align="right">Progress</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {funds.map((fund) => {
                  const balance = fund.balance || 0;
                  const progress = (balance / fund.targetAmount) * 100;
                  
                  return (
                    <TableRow 
                      key={fund.id}
                      onClick={() => handleFundClick(fund)}
                      sx={{ 
                        cursor: 'pointer',
                        bgcolor: selectedFund?.id === fund.id ? 'action.selected' : 'inherit',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <TableCell>{fund.name}</TableCell>
                      <TableCell>{fund.description}</TableCell>
                      <TableCell align="right">
                        ${fund.targetAmount.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">${balance.toFixed(2)}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Box width="100%" mr={1}>
                            <LinearProgress variant="determinate" value={progress} />
                          </Box>
                          <Box minWidth={35}>
                            <Typography variant="body2" color="textSecondary">
                              {Math.round(progress)}%
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditFund(fund);
                            }}
                            title="Edit Fund"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddTransaction(fund);
                            }}
                            title="Add Transaction"
                          >
                            <AccountBalanceIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFund(fund.id);
                            }}
                            title="Delete Fund"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {selectedFund && (
          <Grid item xs={12} md={4}>
            <FundDetail fund={selectedFund} balance={selectedFund.balance || 0} />
          </Grid>
        )}
      </Grid>

      <FundEditor
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, fund: {} })}
        fund={editDialog.fund}
        userId={userId}
        onSave={handleSave}
      />

      <FundTransactionDialog
        open={transactionDialog.open}
        onClose={handleTransactionDialogClose}
        fundId={transactionDialog.fundId}
        fundName={transactionDialog.fundName}
      />
    </Box>
  );
} 