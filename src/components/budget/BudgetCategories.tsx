import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Typography,
  Collapse,
  ListItem,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { MoreVert, ExpandMore, Add } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Budget, BudgetCategory, BudgetExpense, BudgetExpenseCreateDTO, BudgetExpenseUpdateDTO, ExpenseCategory } from '../../models/Budget';
import { Transaction } from '../../models/Transaction';
import { sequenceService } from '../../services/sequenceService';
import { deleteCategory, updateExpenseCategory } from '../../services/categoryService';
import { createExpense, deleteExpense, updateExpense } from '../../services/expenseService';
import CategoryDialog from './CategoryDialog';
import BudgetCategoryGroup from './BudgetCategoryGroup';
import { enqueueSnackbar } from 'notistack';

interface EditDialogState {
  open: boolean;
  category: ExpenseCategory | null;
}

interface MenuState {
  element: HTMLElement | null;
  category: BudgetCategory | null;
}

interface DeleteConfirmationState {
  open: boolean;
  expense: BudgetExpense | null;
}

interface BudgetCategoriesProps {
  currentBudget: Budget;
  onExpensesChange: (expenses: BudgetExpense[]) => void;
  onCategoriesChange: (categories: BudgetCategory[]) => void;
  onExpenseClick: (expense: BudgetExpense) => void;
}

function BudgetCategories({ 
  currentBudget, 
  onExpensesChange, 
  onExpenseClick,
  onCategoriesChange
}: BudgetCategoriesProps) {
  const [editDialog, setEditDialog] = useState<EditDialogState>({ open: false, category: null });
  const [menuAnchor, setMenuAnchor] = useState<MenuState>({ element: null, category: null });
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({
    open: false,
    expense: null
  });
  const [categoryDeleteConfirmation, setCategoryDeleteConfirmation] = useState<{
    open: boolean;
    category: BudgetCategory | null;
  }>({
    open: false,
    category: null
  });

  const handleCategorySaved = (budgetCategory: BudgetCategory) => {
    if (!currentBudget) return;

      const updatedCategories = currentBudget.categories?.map(c =>
        c.category.id === budgetCategory.category.id ? budgetCategory : c
      );  

      onCategoriesChange(updatedCategories || []);

      setEditDialog({ open: false, category: null });
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!currentBudget) return;

    try {
      await deleteCategory(categoryId, currentBudget.id);
    } catch (error) {
      console.error('Error deleting category:', error);
      enqueueSnackbar(error instanceof Error ? error.message : 'Error while deleting category.', { variant: 'error' });
      return;
    }
    enqueueSnackbar('Category deleted successfully.', { variant: 'success' });  
    const updatedCategories = currentBudget.categories?.filter(c => c.category.id !== categoryId) || [];

    onCategoriesChange(updatedCategories);
  };

  const resetMenuAnchor = () => setMenuAnchor({ element: null, category: null });

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
    await onCategoriesChange(updatedCategories);

    // Save to database
    try {
      await sequenceService.updateCategorySequence(
        currentBudget.id,
        updatedCategories.map(cat => ({
          budgetId: currentBudget.id,
          categoryId: cat.category.id,
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
      onExpensesChange(updatedExpenses || []);

      // Save to database
      await sequenceService.updateExpenseSequence(reorderedExpenses);
    } catch (error) {
      console.error('Error updating expense sequence:', error);
      // Optionally revert the local state on error
    }
  };

  const handleAddExpense = async (expense: BudgetExpenseCreateDTO) => {
    if (!expense || !currentBudget) return;
    const newExpense = await createExpense(expense);
    await onExpensesChange([...(currentBudget?.expenses || []), newExpense]);
  };

  const handleOpenCategoryMenu = (event: React.MouseEvent<HTMLElement>, category: BudgetCategory) => {
    event.stopPropagation(); // Prevent category collapse toggle
    setMenuAnchor({ element: event.currentTarget, category });
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

  const handleExpenseUpdate = async (expenseId: string, updates: BudgetExpenseUpdateDTO) => {
    if (!currentBudget) return;

    try {
      const existingExpense = currentBudget.expenses?.find(e => e.id === expenseId);
      if (!existingExpense) return;

      const updated = await updateExpense(expenseId, updates);

      const updatedExpenses = currentBudget.expenses?.map(e => 
        e.id === updated.id ? updated : e
      ) || [];

      await onExpensesChange(updatedExpenses);
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleExpenseDelete = async (expense: BudgetExpense) => {
    // Show confirmation dialog
    setDeleteConfirmation({
      open: true,
      expense
    });
  };

  const handleConfirmDelete = async () => {
    if (!currentBudget || !deleteConfirmation.expense) return;

    try {
      // Filter out the deleted expense
      await deleteExpense(deleteConfirmation.expense.id);
      const updatedExpenses = currentBudget.expenses?.filter(e => e.id !== deleteConfirmation.expense?.id) || [];
      await onExpensesChange(updatedExpenses);
      
      // Close the dialog
      setDeleteConfirmation({
        open: false,
        expense: null
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

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
                const categoryExpenses = currentBudget.expenses?.filter(e => e.categoryId === category.id) || [];
                
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
                      >
                        <BudgetCategoryGroup
                          budgetCategory={budgetCategory}
                          expenses={categoryExpenses}
                          onExpenseClick={onExpenseClick}
                          onExpenseUpdate={handleExpenseUpdate}
                          onExpenseDelete={handleExpenseDelete}
                          onExpenseAdd={handleAddExpense}
                          categoryMenuButton={
                            <IconButton
                              size="small"
                              onClick={(e) => handleOpenCategoryMenu(e, budgetCategory)}
                              sx={{ 
                                color: 'text.secondary',
                                p: 0.5
                              }}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          }
                          onExpenseReorder={async (reorderedExpenses) => {
                            await handleExpenseReorder(category.id, reorderedExpenses);
                          }}
                        />
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

      {/* Category Menu */}
      <Menu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={resetMenuAnchor}
      >
        <MenuItem
          onClick={() => {
            if (menuAnchor.category && currentBudget?.categories) {
              const category = currentBudget.categories.find(c => c.category.id === menuAnchor.category?.id);
              if (category) {
                setEditDialog({ open: true, category: category.category });
              }
            }
            resetMenuAnchor();
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuAnchor.category) {
              setCategoryDeleteConfirmation({
                open: true,
                category: menuAnchor.category
              });
            }
            resetMenuAnchor();
          }}
        >
          Delete
        </MenuItem>
      </Menu>

      {/* Category Edit Dialog */}
      {currentBudget && (
        <CategoryDialog
          open={editDialog.open}
          onClose={() => setEditDialog({ open: false, category: null })}
          onCategorySaved={handleCategorySaved}
          initialCategory={editDialog.category}
          currentBudget={currentBudget}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmation.open}
        onClose={() => setDeleteConfirmation({ open: false, expense: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          {deleteConfirmation.expense?.transactions && deleteConfirmation.expense.transactions.length > 0 ? (
            <>
              This expense has transactions associated with it. Are you sure you want to delete it?
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                Note: This will also delete all associated transactions.
              </Typography>
            </>
          ) : (
            'Are you sure you want to delete this expense?'
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmation({ open: false, expense: null })}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Delete Confirmation Dialog */}
      <Dialog
        open={categoryDeleteConfirmation.open}
        onClose={() => setCategoryDeleteConfirmation({ open: false, category: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete category {categoryDeleteConfirmation.category?.category.name}?
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCategoryDeleteConfirmation({ open: false, category: null })}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (categoryDeleteConfirmation.category) {
                handleDeleteCategory(categoryDeleteConfirmation.category.id);
              }
              setCategoryDeleteConfirmation({ open: false, category: null });
            }}
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BudgetCategories; 