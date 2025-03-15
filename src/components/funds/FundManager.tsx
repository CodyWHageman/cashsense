import React, { useState, useEffect, useRef } from 'react';
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
  Grid,
  Card,
  CardContent,
  CardActions,
  Drawer,
  useTheme
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, AccountBalance as AccountBalanceIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Fund } from '../../models/Budget';
import { getUserFunds, getFundBalance, updateFund, createFund, deleteFund } from '../../services/fundService';
import { calculateFundBalance, FundWithBalance } from '../../utils/fundUtils';
import FundEditor from './FundEditor';
import FundTransactionDialog from './FundTransactionDialog';
import FundDetail from './FundDetail';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from 'material-ui-confirm';
import { useSnackbar } from 'notistack';
import { useResponsive } from '../../hooks/useResponsive';

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

export function FundManager({ userId }: FundManagerProps) {
  const { isMobile } = useResponsive();
  const theme = useTheme();
  const { user } = useAuth();
  const confirm = useConfirm();
  const { enqueueSnackbar } = useSnackbar();
  
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState<EditDialogState>({ open: false, fund: {} });
  const [transactionDialog, setTransactionDialog] = useState<TransactionDialogState>({
    open: false,
    fundId: '',
    fundName: ''
  });
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  
  // Add a ref to track loading state
  const loadingFundsRef = useRef(false);

  const loadFunds = async () => {
    if (!user?.id || loadingFundsRef.current) return;
    
    loadingFundsRef.current = true;
    try {
      const userFunds = await getUserFunds(user.id);
      const fundsWithBalances = userFunds.map(calculateFundBalance);
      setFunds(fundsWithBalances);
    } catch (error) {
      console.error('Error loading funds:', error);
      enqueueSnackbar('Error loading funds', { variant: 'error' });
    } finally {
      setLoading(false);
      loadingFundsRef.current = false;
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

  const handleSaveFund = async (fund: Fund) => {
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

  const handleTransactionDeleted = () => {
    loadFunds();
  };

  const renderFundCard = (fund: Fund) => {
    const { balance } = calculateFundBalance(fund);
    const progress = (balance / fund.targetAmount) * 100;

    return (
      <Card 
        key={fund.id}
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: theme.shadows[4]
          }
        }}
        onClick={() => setSelectedFund(fund)}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom>
            {fund.name}
          </Typography>
          <Typography variant="h5" color={balance >= 0 ? 'success.main' : 'error.main'}>
            ${balance.toFixed(2)}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Target: ${fund.targetAmount.toFixed(2)}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(progress, 100)}
            color={progress >= 100 ? "success" : "primary"}
            sx={{ mt: 1 }}
          />
        </CardContent>
        <CardActions>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              handleEditFund(fund);
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteFund(fund.id);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </CardActions>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h5">Funds</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setEditDialog({ open: true, fund: {} })}
        >
          Add Fund
        </Button>
      </Box>

      {loading ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={2}>
          {funds.map(fund => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={fund.id}>
              {renderFundCard(fund)}
            </Grid>
          ))}
        </Grid>
      )}

      <FundEditor
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, fund: {} })}
        onSave={handleSaveFund}
        fund={editDialog.fund}
        userId={userId}
      />

      {isMobile ? (
        <Drawer
          anchor="bottom"
          open={Boolean(selectedFund)}
          onClose={() => setSelectedFund(null)}
          PaperProps={{
            sx: {
              height: '90vh',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16
            }
          }}
        >
          {selectedFund && (
            <Box sx={{ p: 2 }}>
              <FundDetail
                fund={selectedFund}
                balance={calculateFundBalance(selectedFund).balance}
                onTransactionDeleted={handleTransactionDeleted}
              />
            </Box>
          )}
        </Drawer>
      ) : (
        selectedFund && (
          <Box sx={{ 
            position: 'fixed',
            right: 0,
            top: 0,
            width: '400px',
            height: '100vh',
            bgcolor: 'background.paper',
            borderLeft: `1px solid ${theme.palette.divider}`,
            overflowY: 'auto'
          }}>
            <FundDetail
              fund={selectedFund}
              balance={calculateFundBalance(selectedFund).balance}
              onTransactionDeleted={handleTransactionDeleted}
            />
          </Box>
        )
      )}
    </Box>
  );
} 