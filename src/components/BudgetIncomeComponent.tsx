import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
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
  Paper
} from '@mui/material';
import { Add, MoreVert, Edit, Delete, ExpandMore, LocalAtmTwoTone } from '@mui/icons-material';
import { Transaction } from '../models/Transaction';
import { BudgetIncome, Budget } from '../models/Budget';
import { createIncome, updateIncome, deleteIncome } from '../services/incomeService';
import { updateBudget } from '../services/budgetService';
import { getJavaScriptMonth, getMonthName } from '../utils/dateUtils';

interface BudgetIncomeProps {
  updateIncomes: (incomes: BudgetIncome[]) => void;
  currentBudget: Budget;
  addTransaction: (transaction: Transaction, importedId?: string) => Promise<void>;
}

interface EditDialogState {
  open: boolean;
  income: Partial<BudgetIncome> | null;
}

interface MenuState {
  element: HTMLElement | null;
  incomeId: string | null;
}

function BudgetIncomeComponent({
  updateIncomes,
  currentBudget,
  addTransaction
}: BudgetIncomeProps) {
  const [editDialog, setEditDialog] = useState<EditDialogState>({ 
    open: false, 
    income: null 
  });
  const [menuAnchor, setMenuAnchor] = useState<MenuState>({ 
    element: null, 
    incomeId: null 
  });
  const [expanded, setExpanded] = useState(true);

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
        budgetId: currentBudget.id,
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
      const updatedIncomes = currentBudget.incomes?.filter(income => income.id !== incomeId) || [];
      updateIncomes(updatedIncomes);
    } catch (error) {
      console.error('Error deleting income:', error);
    }
  };

  const handleSave = async () => {
    if (!editDialog.income?.name) return;

    try {
      let updatedIncome;
      if ('id' in editDialog.income && editDialog.income.id) {
        // Update existing income
        console.log('Updating income:', editDialog.income);
        updatedIncome = await updateIncome(editDialog.income.id, {
          ...editDialog.income,
          updatedAt: new Date()
        });
      } else {
        // Create new income
        console.log('Creating income:', editDialog.income);
        const newIncome = {
          name: editDialog.income.name,
          amount: editDialog.income.amount || 0,
          frequency: editDialog.income.frequency || 'monthly',
          expectedDate: editDialog.income.expectedDate || new Date(),
          budgetId: currentBudget.id,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        updatedIncome = await createIncome(newIncome);
      }

      const updatedIncomes = 'id' in editDialog.income && editDialog.income.id
        ? currentBudget.incomes?.map(i => i.id === updatedIncome.id ? updatedIncome : i) || []
        : [...(currentBudget.incomes || []), updatedIncome];

      updateIncomes(updatedIncomes);
      setEditDialog({ open: false, income: null });
    } catch (error) {
      console.error('Error saving income:', error);
    }
  };

  const getIncomeReceived = (incomeId: string): number => {
    return currentBudget.incomes
      ?.filter(t => t.id === incomeId)[0]
      ?.transactions
      ?.reduce((sum, t) => sum + t.amount, 0) || 0;
  };

  const totalPlanned = currentBudget.incomes?.reduce((sum, income) => sum + income.amount, 0) || 0;
  const totalReceived = currentBudget.incomes?.reduce((sum, income) => sum + getIncomeReceived(income.id), 0) || 0;

  const handleToggle = () => {
    setExpanded(!expanded);
  };
  
  return (
    <Box className="category-section" sx={{ mb: 4 }}>
      {/* Header Row */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 120px 120px 40px',
        gap: 1,
        alignItems: 'center',
        p: 1,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        {/* Title and Expand Icon */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ExpandMore
            onClick={handleToggle}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
              cursor: 'pointer',
              mr: 1
            }}
          />
          <LocalAtmTwoTone sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="subtitle1">
            Income for {getMonthName(currentBudget.month)}
          </Typography>
        </Box>

        {/* Column Headers */}
        <Typography variant="body2" sx={{ textAlign: 'right', color: 'text.secondary' }}>
          Planned
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'right', color: 'text.secondary' }}>
          Received
        </Typography>
        <Box /> {/* Spacer for menu button column */}
      </Box>

      <Collapse in={expanded}>
        <List sx={{ py: 0 }}>
          {currentBudget.incomes?.map(income => (
            <ListItem
              key={income.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 120px 40px',
                gap: 1,
                alignItems: 'center',
                py: 0.5,
                px: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
            >
              <Typography variant="body2" noWrap>
                {income.name}
              </Typography>
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
                onClick={(e) => handleOpenMenu(e, income.id)}
                sx={{ 
                  color: 'text.secondary',
                  p: 0.5
                }}
              >
                <MoreVert fontSize="small" />
              </IconButton>
            </ListItem>
          ))}

          {/* Combined Total and Add Income row */}
          <ListItem
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 120px 40px',
              gap: 1,
              py: 0.5,
              px: 1,
              borderTop: 1,
              borderColor: 'divider'
            }}
          >
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
            <Box /> {/* Spacer for alignment */}
          </ListItem>
        </List>
      </Collapse>

      {/* Income Menu */}
      <Menu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={handleCloseMenu}
      >
        <MenuItem 
          onClick={() => {
            const income = currentBudget.incomes?.find(i => i.id === menuAnchor.incomeId);
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
              handleDeleteIncome(menuAnchor.incomeId);
            }
          }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
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
    </Box>
  );
}

export default BudgetIncomeComponent; 