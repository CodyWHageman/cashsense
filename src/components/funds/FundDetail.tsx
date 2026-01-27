import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Stack,
  alpha,
  useTheme
} from '@mui/material';
import { format } from 'date-fns';
import { Delete, ArrowUpward, ArrowDownward, SwapHoriz } from '@mui/icons-material';
import { FundTransaction } from '../../models/Transaction';
import { useFund } from '../../contexts/FundContext';
import { FundWithBalance } from '../../utils/fundUtils';

interface FundDetailProps {
  fund: FundWithBalance;
}

const FundDetail: React.FC<FundDetailProps> = ({ fund }) => {
  const { deleteFundTransactionAndRefresh } = useFund();
  const theme = useTheme();
  
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    transaction: FundTransaction | null;
  }>({
    open: false,
    transaction: null
  });

  const handleDeleteClick = (transaction: FundTransaction, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeleteConfirmation({ open: true, transaction });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.transaction) return;
    try {
      await deleteFundTransactionAndRefresh(deleteConfirmation.transaction);
    } catch (error) {
      console.error('Error deleting fund transaction:', error);
    } finally {
      setDeleteConfirmation({ open: false, transaction: null });
    }
  };

  return (
    <Box sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER / SUMMARY SECTION */}
      <Box sx={{ 
          p: 3, 
          bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'primary.main',
          color: theme.palette.mode === 'dark' ? 'text.primary' : 'primary.contrastText'
      }}>
        <Typography variant="overline" sx={{ opacity: 0.8 }}>Fund Details</Typography>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>{fund.name}</Typography>
        
        <Stack direction="row" spacing={4} sx={{ mt: 2 }}>
            <Box>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>CURRENT BALANCE</Typography>
                <Typography variant="h5" fontWeight={700}>${fund.balance.toFixed(2)}</Typography>
            </Box>
            <Box>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>GOAL</Typography>
                <Typography variant="h5" fontWeight={700}>${fund.targetAmount.toFixed(2)}</Typography>
            </Box>
        </Stack>
      </Box>

      {/* TRANSACTIONS LIST */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Activity History</Typography>
        
        {fund.fundTransactions && fund.fundTransactions.length > 0 ? (
          <List disablePadding>
            {fund.fundTransactions.map((ft) => {
                const isDeposit = ft.type === 'deposit';
                return (
                    <ListItem 
                        key={ft.id}
                        sx={{ 
                            mb: 1.5, 
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            // Ensure there is room for the secondary action
                            pr: 6 
                        }}
                        secondaryAction={
                            <IconButton 
                                edge="end" 
                                size="small"
                                onClick={(e) => handleDeleteClick(ft, e)}
                                sx={{ color: 'text.disabled' }}
                            >
                                <Delete fontSize="small" />
                            </IconButton>
                        }
                    >
                        {/* ICON BOX */}
                        <Box sx={{ 
                            mr: 2, 
                            p: 1, 
                            borderRadius: '50%', 
                            bgcolor: isDeposit ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                            color: isDeposit ? 'success.main' : 'error.main',
                            display: 'flex'
                        }}>
                            {isDeposit ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                        </Box>

                        {/* TEXT INFO */}
                        <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body1" fontWeight={600}>
                                    {isDeposit ? '+' : '-'}${ft.transaction?.amount.toFixed(2) || '0.00'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {format(new Date(ft.transaction?.date || ft.createdAt), 'MMM d, yyyy')}
                                </Typography>
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" noWrap>
                                {ft.transaction?.description || 'No description'}
                            </Typography>

                            {/* Status Chip */}
                            {!ft.transferComplete && (
                                <Chip 
                                    label="Pending Transfer" 
                                    size="small" 
                                    color="warning" 
                                    variant="outlined" 
                                    icon={<SwapHoriz />}
                                    sx={{ mt: 0.5, height: 20, fontSize: '0.65rem' }} 
                                />
                            )}
                        </Box>
                    </ListItem>
                );
            })}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4, opacity: 0.5 }}>
            <Typography>No transactions recorded yet.</Typography>
          </Box>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmation.open}
        onClose={() => setDeleteConfirmation({ open: false, transaction: null })}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
              Are you sure you want to remove this transaction?
          </Typography>
          {deleteConfirmation.transaction?.transaction && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                  {deleteConfirmation.transaction.transaction.description}
              </Typography>
              <Typography variant="h6" color="primary">
                  ${deleteConfirmation.transaction.transaction.amount.toFixed(2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmation({ open: false, transaction: null })}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FundDetail;