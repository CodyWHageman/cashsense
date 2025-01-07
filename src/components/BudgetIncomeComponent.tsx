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
  Collapse
} from '@mui/material';
import { Add, MoreVert, Edit, Delete, ExpandMore } from '@mui/icons-material';
import { Transaction } from '../models/Transaction';
import { BudgetIncome, Budget } from '../models/Budget';
import { createIncome, updateIncome, deleteIncome } from '../services/incomeService';
import { updateBudget } from '../services/budgetService';
import { getJavaScriptMonth, getMonthName } from '../utils/dateUtils';

interface BudgetIncomeProps {
  incomes: BudgetIncome[];
  transactions: Transaction[];
  updateIncomes: (incomes: BudgetIncome[]) => void;
  currentBudget: Budget;
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
  incomes = [], 
  transactions = [],
  updateIncomes,
  currentBudget
}: BudgetIncomeProps) {
  const [editDialog, setEditDialog] = useState<EditDialogState>({ 
    open: false, 
    income: null 
  });
  const [menuAnchor, setMenuAnchor] = useState<MenuState>({ 
    element: null, 
    incomeId: null 
  });
  const [expanded, setExpanded] = useState(false);

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
      const updatedIncomes = incomes.filter(income => income.id !== incomeId);
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
        ? incomes.map(i => i.id === updatedIncome.id ? updatedIncome : i)
        : [...incomes, updatedIncome];

      updateIncomes(updatedIncomes);
      setEditDialog({ open: false, income: null });
    } catch (error) {
      console.error('Error saving income:', error);
    }
  };

  const getIncomeReceived = (incomeId: string): number => {
    return transactions
      .filter(t => t.incomeId === incomeId)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const totalPlanned = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalReceived = incomes.reduce((sum, income) => sum + getIncomeReceived(income.id), 0);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        onClick={handleToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          mb: 2
        }}
      >
        <ExpandMore
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s'
          }}
        />
        <Typography variant="h6" sx={{ ml: 1 }}>
          Income for {getMonthName(getJavaScriptMonth(currentBudget.month))}
        </Typography>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ 
          backgroundColor: 'background.paper',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          mb: 2
        }}>
          <List sx={{ py: 0 }}>
            {incomes.map(income => {
              const received = getIncomeReceived(income.id);
              const remaining = income.amount - received;
              
              return (
                <ListItem
                  key={income.id}
                  sx={{
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'grid',
                    gridTemplateColumns: '1fr 200px 200px',
                    gap: 2,
                    alignItems: 'center'
                  }}
                >
                  <ListItemText primary={income.name} />
                  <Typography sx={{ textAlign: 'right' }}>
                    ${income.amount.toFixed(2)}
                  </Typography>
                  <Typography sx={{ 
                    textAlign: 'right',
                    color: remaining < 0 ? 'error.main' : 'text.primary'
                  }}>
                    ${received.toFixed(2)}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenMenu(e, income.id)}
                  >
                    <MoreVert />
                  </IconButton>
                </ListItem>
              );
            })}

            {/* Total row - only show if there are incomes */}
            {incomes.length > 0 && (
              <ListItem
                sx={{
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <ListItemText primary="Total" />
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  minWidth: 400,
                  justifyContent: 'space-between'
                }}>
                  <Typography sx={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>
                    ${totalPlanned.toFixed(2)}
                  </Typography>
                  <Typography sx={{ 
                    flex: 1, 
                    textAlign: 'right', 
                    fontWeight: 'bold',
                    color: (totalPlanned - totalReceived) < 0 ? 'error.main' : 'text.primary'
                  }}>
                    ${(totalPlanned - totalReceived).toFixed(2)}
                  </Typography>
                  <Box sx={{ width: 40 }} /> {/* Spacer for alignment */}
                </Box>
              </ListItem>
            )}

            {/* Add Income row */}
            <ListItem
              sx={{
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <ListItemText 
                primary={
                  <Button
                    startIcon={<Add />}
                    onClick={() => handleEditIncome()}
                    sx={{ ml: -1 }}
                  >
                    Add Income
                  </Button>
                }
              />
              <Box sx={{ width: 40 }} /> {/* Spacer for alignment with other rows */}
            </ListItem>
          </List>
        </Box>
      </Collapse>

      {/* Income Menu */}
      <Menu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={handleCloseMenu}
      >
        <MenuItem 
          onClick={() => {
            const income = incomes.find(i => i.id === menuAnchor.incomeId);
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