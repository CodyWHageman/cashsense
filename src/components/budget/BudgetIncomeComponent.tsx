import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  IconButton, 
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Collapse,
  Paper,
  SxProps, 
  Theme
} from '@mui/material';
import { Add, MoreVert, Edit, Delete, ExpandMore, LocalAtmTwoTone, PushPin, PushPinOutlined } from '@mui/icons-material';
import { BudgetIncome } from '../../models/Budget';
import { createIncome, updateIncome, deleteIncome } from '../../services/incomeService';
import { getMonthName } from '../../utils/dateUtils';
import { useBudget } from '../../contexts/BudgetContext';
import { useResponsive } from '../../hooks/useResponsive';

interface BudgetIncomeProps {
  onIncomeClick: (income: BudgetIncome) => void;
}

interface EditDialogState {
  open: boolean;
  income: Partial<BudgetIncome> | null;
}

interface MenuState {
  element: HTMLElement | null;
  incomeId: string | null;
}

interface DeleteConfirmationState {
  open: boolean;
  income: BudgetIncome | null;
}

function BudgetIncomeComponent({
  onIncomeClick
}: BudgetIncomeProps) {
  const { currentBudget, handleIncomeUpdated, handleIncomeDeleted } = useBudget();
  const { isSmallScreen } = useResponsive();
  
  const [editDialog, setEditDialog] = useState<EditDialogState>({ 
    open: false, 
    income: null 
  });
  const [menuAnchor, setMenuAnchor] = useState<MenuState>({ 
    element: null, 
    incomeId: null 
  });
  const [expanded, setExpanded] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({
    open: false,
    income: null
  });

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>, incomeId: string) => {
    event.stopPropagation();
    setMenuAnchor({ element: event.currentTarget, incomeId });
  };

  const handleCloseMenu = () => {
    setMenuAnchor({ element: null, incomeId: null });
  };

  const handleEditIncome = (income: BudgetIncome | null = null) => {
    handleCloseMenu();
    setEditDialog({ 
      open: true, 
      income: income ? { ...income } : {
        name: '',
        amount: 0,
        budgetId: currentBudget?.id || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        frequency: 'monthly',
        expectedDate: new Date()
      }
    });
  };

  const handleDeleteIncome = async (incomeId: string) => {
    handleCloseMenu();
    try {
      await deleteIncome(incomeId);
      handleIncomeDeleted(incomeId);
    } catch (error) {
      console.error('Error deleting income:', error);
    }
  };

  const handleToggleFavorite = async (income: BudgetIncome) => {
    try {
        const updatedIncome = { 
            ...income, 
            isFavorite: !income.isFavorite,
            updatedAt: new Date()
        };
        // Optimistic update in UI
        handleIncomeUpdated(updatedIncome);
        // Persist
        await updateIncome(income.id, { isFavorite: !income.isFavorite });
    } catch (error) {
        console.error('Error toggling favorite:', error);
        // Revert on error would go here
    }
  };

  const handleSave = async () => {
    if (!editDialog.income?.name) return;
    if (!currentBudget) return;

    try {
      if ('id' in editDialog.income && editDialog.income.id) {
        const existingIncome = currentBudget.incomes?.find(i => i.id === editDialog.income!.id);
        if (!existingIncome) return;

        const partialUpdate = await updateIncome(editDialog.income.id, {
          ...editDialog.income,
          updatedAt: new Date()
        });

        const mergedIncome: BudgetIncome = {
          ...existingIncome,
          ...partialUpdate
        };

        handleIncomeUpdated(mergedIncome);
      } else {
        const newIncome = {
          name: editDialog.income.name,
          amount: editDialog.income.amount || 0,
          frequency: editDialog.income.frequency || 'monthly',
          expectedDate: editDialog.income.expectedDate || new Date(),
          budgetId: currentBudget?.id || '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const createdIncome = await createIncome(newIncome);
        handleIncomeUpdated(createdIncome);
      }

      setEditDialog({ open: false, income: null });
    } catch (error) {
      console.error('Error saving income:', error);
    }
  };

  const getIncomeReceived = (incomeId: string): number => {
    return currentBudget?.incomes
      ?.find(t => t.id === incomeId)
      ?.transactions
      ?.reduce((sum, t) => sum + t.amount, 0) || 0;
  };

  const totalPlanned = currentBudget?.incomes?.reduce((sum, income) => sum + income.amount, 0) || 0;
  const totalReceived = currentBudget?.incomes?.reduce((sum, income) => sum + getIncomeReceived(income.id), 0) || 0;

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const gridLayoutStyles: SxProps<Theme> = {
    display: isSmallScreen ? 'flex' : 'grid',
    flexDirection: isSmallScreen ? 'column' : 'row',
    gridTemplateColumns: isSmallScreen ? undefined : '1fr 120px 120px 40px',
    gap: 1,
    alignItems: 'center',
    px: isSmallScreen ? 2 : 1,
    py: isSmallScreen ? 1.5 : 0.5,
  };
  
  return (
    <Paper className="category-section">
      <Box sx={{
        ...gridLayoutStyles,
        py: 1, 
        borderBottom: 1,
        borderColor: 'divider',
        justifyContent: isSmallScreen ? 'space-between' : undefined
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ExpandMore
            onClick={handleToggle}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
              cursor: 'pointer',
              mr: 1,
              p: isSmallScreen ? 0.5 : 0
            }}
          />
          <LocalAtmTwoTone sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="subtitle1">
            {isSmallScreen ? 'Income' : `Income for ${getMonthName(currentBudget?.month || 0)}`}
          </Typography>
        </Box>

        {!isSmallScreen && (
          <>
            <Typography variant="body2" sx={{ textAlign: 'right', color: 'text.secondary' }}>
              Planned
            </Typography>
            <Typography variant="body2" sx={{ textAlign: 'right', color: 'text.secondary' }}>
              Received
            </Typography>
            <Box /> 
          </>
        )}
      </Box>

      <Collapse in={expanded}>
        <List sx={{ py: 0 }}>
          {currentBudget?.incomes?.map(income => (
            <ListItem
              key={income.id}
              sx={{
                ...gridLayoutStyles,
                cursor: 'pointer',
                borderBottom: isSmallScreen ? '1px solid' : 'none',
                borderColor: 'divider',
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
              onClick={() => onIncomeClick(income)}
            >
               {isSmallScreen ? (
                 // --- MOBILE CARD LAYOUT ---
                 <Box sx={{ width: '100%' }}>
                    {/* Row 1: Name & Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {income.name}
                        </Typography>
                        <Box>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFavorite(income);
                                }}
                                sx={{ color: income.isFavorite ? 'primary.main' : 'text.disabled' }}
                            >
                                {income.isFavorite ? <PushPin fontSize="small" /> : <PushPinOutlined fontSize="small" />}
                            </IconButton>
                            <IconButton
                                size="medium"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenMenu(e, income.id);
                                }}
                                sx={{ color: 'text.secondary', mr: -1 }}
                            >
                                <MoreVert />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Row 2: Planned */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Planned</Typography>
                        <Typography variant="body2">${income.amount.toFixed(2)}</Typography>
                    </Box>

                    {/* Row 3: Received */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Received</Typography>
                        <Typography 
                          variant="body2"
                          sx={{ 
                            color: income.amount - getIncomeReceived(income.id) < 0 ? 'error.main' : 'primary.main'
                          }}
                        >
                          ${getIncomeReceived(income.id).toFixed(2)}
                        </Typography>
                    </Box>
                 </Box>
               ) : (
                 // --- DESKTOP GRID LAYOUT ---
                 <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(income);
                            }}
                            sx={{ 
                                color: income.isFavorite ? 'primary.main' : 'text.disabled',
                                p: 0.5
                            }}
                        >
                            {income.isFavorite ? <PushPin fontSize="small" /> : <PushPinOutlined fontSize="small" />}
                        </IconButton>
                        <Typography variant="body2" noWrap>
                            {income.name}
                        </Typography>
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      className="MuiTypography-amount" 
                      sx={{ textAlign: 'right' }}
                    >
                      ${income.amount.toFixed(2)}
                    </Typography>
                    <Typography 
                      variant="body2"
                      className="MuiTypography-remaining"
                      sx={{ 
                        textAlign: 'right',
                        color: income.amount - getIncomeReceived(income.id) < 0 ? 'error.main' : 'primary.main'
                      }}
                    >
                      ${getIncomeReceived(income.id).toFixed(2)}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenMenu(e, income.id);
                      }}
                      sx={{ 
                        color: 'text.secondary',
                        p: 0.5
                      }}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                 </>
               )}
            </ListItem>
          ))}

          {/* TOTALS / ADD BUTTON ROW */}
          <ListItem
            sx={{
              ...gridLayoutStyles,
              borderTop: isSmallScreen ? 'none' : '1px solid',
              borderColor: 'divider',
              mt: isSmallScreen ? 1 : 0
            }}
          >
            {isSmallScreen ? (
                // --- MOBILE TOTALS LAYOUT ---
                <Box sx={{ width: '100%' }}>
                    <Button
                        startIcon={<Add />}
                        onClick={() => handleEditIncome()}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 2, justifyContent: 'flex-start' }}
                    >
                        Add Income
                    </Button>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight="bold">Total Planned</Typography>
                        <Typography variant="body2" fontWeight="bold">${totalPlanned.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight="bold">Total Received</Typography>
                        <Typography 
                            variant="body2" 
                            fontWeight="bold"
                            sx={{ color: (totalPlanned - totalReceived) < 0 ? 'error.main' : 'primary.main' }}
                        >
                            ${totalReceived.toFixed(2)}
                        </Typography>
                    </Box>
                </Box>
            ) : (
                // --- DESKTOP TOTALS LAYOUT ---
                <>
                    <Button
                      startIcon={<Add />}
                      onClick={() => handleEditIncome()}
                      size="small"
                      sx={{ ml: -1 }}
                    >
                      Add Income
                    </Button>
                    <Typography 
                      variant="body2" 
                      className="MuiTypography-amount" 
                      sx={{ 
                        textAlign: 'right',
                        fontWeight: 600
                      }}
                    >
                      ${totalPlanned.toFixed(2)}
                    </Typography>
                    <Typography 
                      variant="body2"
                      className="MuiTypography-remaining"
                      sx={{ 
                        textAlign: 'right',
                        fontWeight: 600,
                        color: (totalPlanned - totalReceived) < 0 ? 'error.main' : 'primary.main'
                      }}
                    >
                      ${totalReceived.toFixed(2)}
                    </Typography>
                    <Box /> 
                </>
            )}
          </ListItem>
        </List>
      </Collapse>

      <Menu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={handleCloseMenu}
      >
        <MenuItem 
          onClick={() => {
            const income = currentBudget?.incomes?.find(i => i.id === menuAnchor.incomeId);
            if (income) {
              handleEditIncome(income);
            }
          }}
        >
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (menuAnchor.incomeId) {
              setDeleteConfirmation({
                open: true,
                income: currentBudget?.incomes?.find(i => i.id === menuAnchor.incomeId) || null
              });
            }
            handleCloseMenu();
          }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <Dialog 
        open={editDialog.open} 
        onClose={() => setEditDialog({ open: false, income: null })}
        aria-labelledby="edit-dialog-title"
        disableRestoreFocus
      >
        <DialogTitle id="edit-dialog-title">
          {editDialog.income?.name ? 'Edit' : 'Add'} Income
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={editDialog.income?.name || ''}
            onChange={(e) => setEditDialog(prev => ({
              ...prev,
              income: prev.income ? { ...prev.income, name: e.target.value } : null
            }))}
          />
          <TextField
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            value={editDialog.income?.amount || 0}
            onChange={(e) => setEditDialog(prev => ({
              ...prev,
              income: prev.income ? { 
                ...prev.income, 
                amount: parseFloat(e.target.value) || 0 
              } : null
            }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, income: null })}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            variant="contained"
            disabled={!editDialog.income?.name?.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirmation.open}
        onClose={() => setDeleteConfirmation({ open: false, income: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete income {deleteConfirmation.income?.name}?
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Note: This will also delete all associated transactions.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmation({ open: false, income: null })}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (deleteConfirmation.income) {
                handleDeleteIncome(deleteConfirmation.income.id);
              }
              setDeleteConfirmation({ open: false, income: null });
            }}
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default BudgetIncomeComponent;