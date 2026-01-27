import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  CardActions,
  Drawer,
  Fab,
  Dialog,
  useTheme,
  Chip
} from '@mui/material';
import { Add, Edit, Delete, Savings, Bolt, PushPin, PushPinOutlined } from '@mui/icons-material';
import { Fund } from '../../models/Budget';
import { calculateFundBalance, FundWithBalance } from '../../utils/fundUtils';
import FundEditor from './FundEditor';
import FundTransactionDialog from './FundTransactionDialog';
import FundDetail from './FundDetail';
import { useFund } from '../../contexts/FundContext';
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
  const { isSmallScreen } = useResponsive();
  const theme = useTheme();
  
  const { 
    funds, 
    loading, 
    createNewFund,
    updateExistingFund,
    deleteExistingFund
  } = useFund();
  
  const [editDialog, setEditDialog] = useState<EditDialogState>({ open: false, fund: {} });
  const [transactionDialog, setTransactionDialog] = useState<TransactionDialogState>({
    open: false,
    fundId: '',
    fundName: ''
  });
  const [selectedFund, setSelectedFund] = useState<FundWithBalance | null>(null);

  const handleEditFund = (fund?: Fund) => {
    setEditDialog({
      open: true,
      fund: fund ? { ...fund } : { name: '', description: '', targetAmount: 0, userId },
    });
  };

  const handleSaveFund = async (fund: Fund) => {
    try {
      if (fund.id) {
        await updateExistingFund(fund.id, fund);
      } else if (fund.name && fund.targetAmount) {
        await createNewFund({ ...fund, userId } as Omit<Fund, 'id'>);
      }
      setEditDialog({ open: false, fund: {} });
    } catch (error) {
      console.error('Error saving fund:', error);
    }
  };

  const handleToggleFavorite = async (fund: Fund) => {
    try {
        await updateExistingFund(fund.id, { isFavorite: !fund.isFavorite });
    } catch (error) {
        console.error('Error toggling favorite fund:', error);
    }
  };

  const handleDeleteFund = async (fundId: string) => {
    if (window.confirm('Are you sure you want to delete this fund?')) {
      try {
        await deleteExistingFund(fundId);
        if (selectedFund?.id === fundId) {
          setSelectedFund(null);
        }
      } catch (error) {
        console.error('Error deleting fund:', error);
      }
    }
  };

  const renderFundCard = (fund: FundWithBalance) => {
    const { balance } = calculateFundBalance(fund);
    const progress = Math.min((balance / fund.targetAmount) * 100, 100);
    const isCompleted = balance >= fund.targetAmount;

    return (
      <Card 
        key={fund.id}
        variant="outlined"
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderColor: isCompleted ? 'success.light' : 'divider',
          bgcolor: isCompleted ? 'success.lighter' : 'background.paper',
          transition: 'transform 0.2s',
          '&:hover': {
             transform: 'translateY(-2px)',
             boxShadow: theme.shadows[4]
          }
        }}
      >
        <CardActionArea 
            onClick={() => setSelectedFund(fund)}
            sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', p: 0 }}
        >
            <CardContent sx={{ width: '100%', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Savings color={isCompleted ? "success" : "primary"} />
                    <Typography variant="h6" fontWeight={600} noWrap>
                        {fund.name}
                    </Typography>
                </Box>
                {isCompleted && (
                    <Chip label="GOAL MET" color="success" size="small" sx={{ fontWeight: 'bold', height: 20, fontSize: '0.65rem' }} />
                )}
            </Box>

            <Box sx={{ mb: 2 }}>
                <Typography variant="h4" fontWeight={700} color={balance >= fund.targetAmount ? 'success.main' : 'text.primary'}>
                    ${balance.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    of ${fund.targetAmount.toLocaleString()} target
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress 
                    variant="determinate" 
                    value={progress}
                    color={isCompleted ? "success" : "primary"}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" fontWeight="bold">
                    {Math.round(progress)}%
                </Typography>
            </Box>
            </CardContent>
        </CardActionArea>

        <CardActions sx={{ borderTop: 1, borderColor: 'divider', justifyContent: 'space-between', px: 2, py: 1 }}>
          {/* Quick Action: Add Transaction */}
          <Button 
            size="small" 
            startIcon={<Bolt />} 
            onClick={() => setTransactionDialog({ open: true, fundId: fund.id, fundName: fund.name })}
          >
            Add $
          </Button>

          <Box>
            <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); handleToggleFavorite(fund); }}
                sx={{ color: fund.isFavorite ? 'primary.main' : 'text.disabled' }}
            >
                {fund.isFavorite ? <PushPin fontSize="small" /> : <PushPinOutlined fontSize="small" />}
            </IconButton>
            <IconButton 
                size="small" 
                onClick={(e) => { e.stopPropagation(); handleEditFund(fund); }}
            >
                <Edit fontSize="small" />
            </IconButton>
            <IconButton 
                size="small"
                onClick={(e) => { e.stopPropagation(); handleDeleteFund(fund.id); }}
            >
                <Delete fontSize="small" />
            </IconButton>
          </Box>
        </CardActions>
      </Card>
    );
  };

  return (
    <Box>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Savings Funds</Typography>
        {!isSmallScreen && (
            <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setEditDialog({ open: true, fund: {} })}
            >
            New Fund
            </Button>
        )}
      </Box>

      {/* LIST CONTENT */}
      {loading ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={2} pb={isSmallScreen ? 10 : 0}>
          {funds.map(fund => (
            <Grid item xs={12} sm={6} md={4} key={fund.id}>
              {renderFundCard(fund)}
            </Grid>
          ))}
          {funds.length === 0 && (
              <Box sx={{ width: '100%', textAlign: 'center', mt: 4, opacity: 0.6 }}>
                  <Savings sx={{ fontSize: 60, mb: 2 }} />
                  <Typography>No funds created yet.</Typography>
              </Box>
          )}
        </Grid>
      )}

      {/* MOBILE FAB */}
      {isSmallScreen && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 80, right: 16, zIndex: 1000 }} // Bottom 80 to clear BottomNav
          onClick={() => setEditDialog({ open: true, fund: {} })}
        >
          <Add />
        </Fab>
      )}

      {/* DIALOGS */}
      <FundEditor
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, fund: {} })}
        onSave={handleSaveFund}
        fund={editDialog.fund}
        userId={userId}
      />
      
      {transactionDialog.open && (
        <FundTransactionDialog
            open={transactionDialog.open}
            onClose={() => setTransactionDialog({ open: false, fundId: '', fundName: '' })}
            fundId={transactionDialog.fundId}
            fundName={transactionDialog.fundName}
        />
      )}

      {/* DETAIL VIEW: Drawer (Mobile) vs Dialog (Desktop) */}
      {isSmallScreen ? (
        <Drawer
          anchor="bottom"
          open={Boolean(selectedFund)}
          onClose={() => setSelectedFund(null)}
          PaperProps={{
            sx: { height: '85vh', borderTopLeftRadius: 20, borderTopRightRadius: 20 }
          }}
        >
          {selectedFund && <FundDetail fund={selectedFund} />}
        </Drawer>
      ) : (
        <Dialog
            open={Boolean(selectedFund)}
            onClose={() => setSelectedFund(null)}
            maxWidth="sm"
            fullWidth
        >
             {selectedFund && <FundDetail fund={selectedFund} />}
        </Dialog>
      )}
    </Box>
  );
}