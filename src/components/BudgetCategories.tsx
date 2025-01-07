import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Menu,
  MenuItem,
  Typography,
  Collapse,
} from '@mui/material';
import { MoreVert, ExpandMore, Add } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Budget, BudgetExpense, ExpenseCategory } from '../models/Budget';
import { Transaction } from '../models/Transaction';
import BudgetCategoryGroup from './BudgetCategoryGroup';
import { sequenceService } from '../services/sequenceService';
import { createCategory, updateExpenseCategory } from '../services/categoryService';
import { createExpense, updateExpense } from '../services/expenseService';

interface EditDialogState {
  open: boolean;
  data: Partial<ExpenseCategory> | null;
}

interface MenuAnchorState {
  element: HTMLElement | null;
  categoryId: string | null;
}

interface BudgetCategoriesProps {
  expenses: BudgetExpense[];
  transactions: Transaction[];
  updateExpenses: (expenses: BudgetExpense[]) => Promise<void>;
  currentBudget: Budget | null;
  setCurrentBudget: (budget: Budget | null) => void;
  addTransaction: (transaction: Transaction, importedId?: string) => Promise<void>;
  onExpenseClick: (expense: BudgetExpense | null) => void;
}

const BudgetCategories: React.FC<BudgetCategoriesProps> = ({
  expenses,
  transactions,
  updateExpenses,
  currentBudget,
  setCurrentBudget,
  addTransaction,
  onExpenseClick,
}) => {
  const [editDialog, setEditDialog] = useState<EditDialogState>({
    open: false,
    data: null
  });

  const [menuAnchor, setMenuAnchor] = useState<MenuAnchorState>({
    element: null,
    categoryId: null
  });

  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});

  const [editingExpense, setEditingExpense] = useState<{
    id?: string;
    name: string;
    amount: number;
    categoryId: string;
  } | null>(null);

  const handleEditCategory = (category?: ExpenseCategory) => {
    setEditDialog({
      open: true,
      data: category || { name: '', color: '#666666' }
    });
  };

  const handleSave = async () => {
    if (!currentBudget || !editDialog.data?.name || !editDialog.data?.color) return;

    try {
      const categories = currentBudget.categories || [];
      if (editDialog.data.id) {
        // Update existing category
        const updatedExpenseCategory = await updateExpenseCategory(editDialog.data.id, {
          name: editDialog.data.name,
          color: editDialog.data.color
        });

        const updatedCategories = categories.map(c =>
          c.category.id === editDialog.data?.id ? {...c, category: updatedExpenseCategory} : c
        );
        setCurrentBudget({
          ...currentBudget,
          categories: updatedCategories
        });
      } else {
        // Add new category
        const newBudgetCategory = await createCategory({
          name: editDialog.data.name,
          color: editDialog.data.color,
          userId: currentBudget.userId,
          createdAt: new Date()
        }, currentBudget.id, getNextCategorySequenceNumber());

        setCurrentBudget({
          ...currentBudget,
          categories: [...categories, newBudgetCategory]
        });
      }
      setEditDialog({ open: false, data: null });
    } catch (error) {
      console.error('Error saving category:', error);
      throw error;
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!currentBudget) return;

    const categories = currentBudget.categories || [];
    const updatedCategories = categories.filter(c => c.id !== categoryId);
    setCurrentBudget({
      ...currentBudget,
      categories: updatedCategories
    });
  };

  const resetMenuAnchor = () => setMenuAnchor({ element: null, categoryId: null });

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !currentBudget?.categories) return;

    const items = Array.from(currentBudget.categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sequence numbers
    const updatedCategories = items.map((category, index) => ({
      ...category,
      sequenceNumber: index
    }));

    // Update the local state
    setCurrentBudget({
      ...currentBudget,
      categories: updatedCategories
    });

    // Save to database
    try {
      await sequenceService.updateCategorySequence(
        currentBudget.id,
        updatedCategories.map(cat => ({
          budgetId: currentBudget.id,
          categoryId: cat.id,
          sequenceNumber: cat.sequenceNumber
        }))
      );
    } catch (error) {
      console.error('Error updating category sequence:', error);
      // Optionally revert the local state on error
    }
  };

  const handleExpenseReorder = async (categoryId: string, reorderedExpenses: BudgetExpense[]) => {
    try {
      // Update local state
      const updatedExpenses = currentBudget?.expenses?.map(exp => 
        reorderedExpenses.find(re => re.id === exp.id) || exp
      );
      updateExpenses(updatedExpenses || []);

      // Save to database
      await sequenceService.updateExpenseSequence(categoryId, reorderedExpenses);
    } catch (error) {
      console.error('Error updating expense sequence:', error);
      // Optionally revert the local state on error
    }
  };

  const handleToggleCategory = (categoryId: string) => {
    setExpanded(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleAddExpense = (categoryId: string) => {
    console.log('handleAddExpense', categoryId);
    setEditingExpense({
      name: '',
      amount: 0,
      categoryId
    });
  }

  const handleEditExpense = (expense: BudgetExpense) => {
    setEditingExpense(expense);
    onExpenseClick(expense);
  };

  const handleOpenCategoryMenu = (event: React.MouseEvent<HTMLElement>, categoryId: string) => {
    event.stopPropagation(); // Prevent category collapse toggle
    setMenuAnchor({ element: event.currentTarget, categoryId });
  };

  const handleInlineExpenseSave = async () => {
    if (!editingExpense || !currentBudget) return;
    console.log('editingExpense', editingExpense);
    try {
      if (!editingExpense.id) {
        // Call create expense service
        await createExpense({
          name: editingExpense.name,
          amount: editingExpense.amount,
          dueDate: new Date(),
          categoryId: editingExpense.categoryId,
          budgetId: currentBudget.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          sequenceNumber: getNextExpenseSequenceNumber(editingExpense.categoryId)
        });
      } else {
        // Update existing expense
        const existingExpense = currentBudget?.expenses?.find(e => e.id === editingExpense.id);
        if (!existingExpense) return;

        const updatedExpense = await updateExpense(editingExpense.id, {
          ...existingExpense,
          name: editingExpense.name,
          amount: editingExpense.amount,
          updatedAt: new Date()
        });

        // Update local state
        updateExpenses([...expenses, updatedExpense]);
      }
      setEditingExpense(null);
    } catch (error) {
      console.error('Error saving expense:', error);
      throw error;
    }
  };

  function getNextExpenseSequenceNumber(categoryId: string): number {
    return currentBudget && currentBudget.expenses 
      ? currentBudget.expenses.filter(e => e.categoryId === categoryId).length + 1 
      : 1;
  }

  function getNextCategorySequenceNumber(): number {
    return currentBudget && currentBudget.categories 
      ? currentBudget.categories.length + 1 
      : 1;
  }

  return (
    <Box sx={{ mt: 4 }}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="categories">
          {(provided) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {currentBudget?.categories?.map((budgetCategory, index) => {
                const category = budgetCategory.category;
                const categoryExpenses = currentBudget?.expenses?.filter(e => e.categoryId === category.id) || [];
                return (
                  <Draggable
                    key={category.id}
                    draggableId={category.id}
                    index={index}
                  >
                    {(provided) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        sx={{ mb: 2 }}
                      >
                        {/* Category Header */}
                        <Box
                          onClick={() => handleToggleCategory(category.id)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            mb: 1
                          }}
                        >
                          <ExpandMore
                            sx={{
                              transform: expanded[category.id] ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.2s'
                            }}
                          />
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              ml: 1,
                              color: category.color,
                              flex: 1
                            }}
                          >
                            {category.name}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenCategoryMenu(e, category.id)}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>

                        {/* Category Content */}
                        <Collapse in={expanded[category.id]}>
                          <Box
                            sx={{
                              backgroundColor: 'background.paper',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              mb: 2
                            }}
                          >
                            {/* Header Row */}
                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 200px 200px',
                                gap: 2,
                                p: 1,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                color: 'text.secondary'
                              }}
                            >
                              <Typography>Name</Typography>
                              <Typography sx={{ textAlign: 'right' }}>Planned</Typography>
                              <Typography sx={{ textAlign: 'right' }}>Remaining</Typography>
                            </Box>

                            {/* Expenses */}
                            {categoryExpenses.map((expense, index) => {
                              const spent = transactions
                                .filter(t => t.expenseId === expense.id)
                                .reduce((sum, t) => sum + t.amount, 0);
                              const remaining = expense.amount - spent;

                              return editingExpense === null ? (
                                <Box
                                  key={expense.id}
                                  onClick={() => editingExpense ? null : onExpenseClick(expense)}
                                  sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 200px 200px',
                                    gap: 2,
                                    p: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    cursor: editingExpense ? 'default' : 'pointer',
                                    '&:hover': {
                                      bgcolor: 'action.hover'
                                    }
                                  }}
                                >
                                  <Typography>{expense.name}</Typography>
                                  <Typography sx={{ textAlign: 'right' }}>
                                    ${expense.amount.toFixed(2)}
                                  </Typography>
                                  <Typography sx={{ 
                                    textAlign: 'right',
                                    color: remaining < 0 ? 'error.main' : 'text.primary'
                                  }}>
                                    ${remaining.toFixed(2)}
                                  </Typography>
                                </Box>
                              ) : (
                                <Box
                                  onBlur={handleInlineExpenseSave}
                                  sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 200px 200px',
                                    gap: 2,
                                    p: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider'
                                  }}
                                >
                                  <TextField
                                    autoFocus
                                    value={editingExpense.name}
                                    onChange={(e) => setEditingExpense({
                                      ...editingExpense,
                                      name: e.target.value
                                    })}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleInlineExpenseSave();
                                    }}
                                    size="small"
                                    placeholder="Item Name"
                                  />
                                  <TextField
                                    value={editingExpense.amount}
                                    onChange={(e) => setEditingExpense({
                                      ...editingExpense,
                                      amount: parseFloat(e.target.value) || 0
                                    })}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleInlineExpenseSave();
                                    }}
                                    size="small"
                                    type="number"
                                    sx={{ textAlign: 'right' }}
                                  />
                                  <Box />
                                </Box>
                              );
                            })}

                            {/* Add Item Link */}
                            <Box
                              sx={{
                                p: 1,
                                borderTop: categoryExpenses.length ? '1px solid' : 'none',
                                borderColor: 'divider'
                              }}
                            >
                              <Button
                                startIcon={<Add />}
                                onClick={() => handleAddExpense(category.id)}
                                sx={{ ml: -1 }}
                              >
                                Add Item
                              </Button>
                            </Box>
                          </Box>
                        </Collapse>
                      </Box>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Category Button */}
      <Button
        variant="outlined"
        color="primary"
        onClick={() => handleEditCategory()}
        sx={{ mt: 2 }}
      >
        Add Category
      </Button>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialog.open} 
        onClose={() => setEditDialog({ open: false, data: null })}
      >
        <DialogTitle>
          {editDialog.data?.id ? 'Edit Category' : 'Add Category'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Name"
              value={editDialog.data?.name || ''}
              onChange={(e) =>
                setEditDialog({
                  ...editDialog,
                  data: { ...editDialog.data, name: e.target.value }
                })
              }
            />
            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Color
              </Typography>
              <TextField
                fullWidth
                type="color"
                value={editDialog.data?.color || '#666666'}
                onChange={(e) =>
                  setEditDialog({
                    ...editDialog,
                    data: { ...editDialog.data, color: e.target.value }
                  })
                }
                sx={{
                  '& input': {
                    height: '50px',
                    padding: '4px',
                    cursor: 'pointer'
                  }
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, data: null })}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Menu */}
      <Menu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={resetMenuAnchor}
      >
        <MenuItem
          onClick={() => {
            if (menuAnchor.categoryId && currentBudget?.categories) {
              const category = currentBudget.categories.find(c => c.category.id === menuAnchor.categoryId);
              if (category) {
                handleEditCategory(category.category);
              }
            }
            resetMenuAnchor();
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuAnchor.categoryId) {
              handleDeleteCategory(menuAnchor.categoryId);
            }
            resetMenuAnchor();
          }}
        >
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default BudgetCategories; 