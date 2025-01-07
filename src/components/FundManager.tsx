import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { Fund } from '../models/Budget';
import {
  createFund,
  updateFund,
  getUserFunds,
  getFundBalance,
  updateFundTransactionStatus,
} from '../services/fundService';

interface EditDialogState {
  open: boolean;
  fund: Partial<Fund>;
}

interface FundManagerProps {
  userId: string;
}

export const FundManager: React.FC<FundManagerProps> = ({ userId }) => {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [editDialog, setEditDialog] = useState<EditDialogState>({
    open: false,
    fund: {},
  });
  const [fundBalances, setFundBalances] = useState<Record<string, number>>({});

  const loadFunds = async () => {
    const userFunds = await getUserFunds(userId);
    setFunds(userFunds);
    
    // Load balances for each fund
    const balances: Record<string, number> = {};
    for (const fund of userFunds) {
      balances[fund.id] = await getFundBalance(fund.id);
    }
    setFundBalances(balances);
  };

  useEffect(() => {
    loadFunds();
  }, [userId]);

  const handleEditFund = (fund?: Fund) => {
    setEditDialog({
      open: true,
      fund: fund || { name: '', description: '', targetAmount: 0, userId: userId },
    });
  };

  const handleSave = async () => {
    try {
      if (editDialog.fund.id) {
        await updateFund(editDialog.fund.id, editDialog.fund);
      } else {
        await createFund(editDialog.fund as Omit<Fund, 'id'>);
      }
      setEditDialog({ open: false, fund: {} });
      loadFunds();
    } catch (error) {
      console.error('Error saving fund:', error);
    }
  };

  const handleTransferStatusChange = async (fundTransactionId: string, newStatus: boolean) => {
    try {
      await updateFundTransactionStatus(fundTransactionId, newStatus);
      loadFunds();
    } catch (error) {
      console.error('Error updating transfer status:', error);
    }
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
              const balance = fundBalances[fund.id] || 0;
              const progress = (balance / fund.targetAmount) * 100;
              
              return (
                <TableRow key={fund.id}>
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
                    <IconButton
                      size="small"
                      onClick={() => handleEditFund(fund)}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, fund: {} })}>
        <DialogTitle>
          {editDialog.fund.id ? 'Edit Fund' : 'Add Fund'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Name"
              value={editDialog.fund.name || ''}
              onChange={(e) =>
                setEditDialog({
                  ...editDialog,
                  fund: { ...editDialog.fund, name: e.target.value },
                })
              }
            />
            <TextField
              label="Description"
              value={editDialog.fund.description || ''}
              onChange={(e) =>
                setEditDialog({
                  ...editDialog,
                  fund: { ...editDialog.fund, description: e.target.value },
                })
              }
            />
            <TextField
              label="Target Amount"
              type="number"
              value={editDialog.fund.targetAmount || ''}
              onChange={(e) =>
                setEditDialog({
                  ...editDialog,
                  fund: { ...editDialog.fund, targetAmount: parseFloat(e.target.value) },
                })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, fund: {} })}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 