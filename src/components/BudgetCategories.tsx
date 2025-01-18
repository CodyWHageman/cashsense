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
import { Budget, BudgetCategory, BudgetExpense, BudgetExpenseCreateDTO, BudgetExpenseUpdateDTO, ExpenseCategory } from '../models/Budget';
import { Transaction } from '../models/Transaction';
import { sequenceService } from '../services/sequenceService';
import { updateExpenseCategory } from '../services/categoryService';
import { createExpense, deleteExpense, updateExpense } from '../services/expenseService';
import CategoryDialog from './CategoryDialog';
import BudgetCategoryGroup from './BudgetCategoryGroup';

interface EditDialogState {
  open: boolean;
  category: ExpenseCategory | null;
}

interface MenuState {
  element: HTMLElement | null;
  categoryId: string | null;
}

interface DeleteConfirmationState {
  open: boolean;
  expense: BudgetExpense | null;
}

interface BudgetCategoriesProps {
  currentBudget: Budget | null;
  onExpensesChange: (expenses: BudgetExpense[]) => Promise<void>;
  onCategoriesChange: (categories: BudgetCategory[]) => Promise<void>;
  onExpenseClick: (expense: BudgetExpense | null) => void;
}

function BudgetCategories({ 
  currentBudget, 
  onExpensesChange, 
  onExpenseClick,
  onCategoriesChange
}: BudgetCategoriesProps) {
  const [editDialog, setEditDialog] = useState<EditDialogState>({ open: false, category: null });
  const [menuAnchor, setMenuAnchor] = useState<MenuState>({ element: null, categoryId: null });
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({
    open: false,
    expense: null
  });

  const handleSaveCategory = async (categoryData: { name: string; color: string }) => {
    if (!currentBudget || !editDialog.category) return;

    try {
      const updatedExpenseCategory = await updateExpenseCategory(editDialog.category.id, {
        name: categoryData.name,
        color: categoryData.color
      });

      const updatedCategories = (currentBudget.categories || []).map(c =>
        c.category.id === editDialog.category?.id ? {...c, category: updatedExpenseCategory} : c
      );

      await onCategoriesChange(updatedCategories);

      setEditDialog({ open: false, category: null });
    } catch (error) {
      console.error('Error saving category:', error);
      throw error;
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!currentBudget) return;

    const categories = currentBudget.categories || [];
    const updatedCategories = categories.filter(c => c.id !== categoryId);
    await onCategoriesChange(updatedCategories);
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
    await onCategoriesChange(updatedCategories);

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
      onExpensesChange(updatedExpenses || []);

      // Save to database
      await sequenceService.updateExpenseSequence(categoryId, reorderedExpenses);
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

  const handleOpenCategoryMenu = (event: React.MouseEvent<HTMLElement>, categoryId: string) => {
    event.stopPropagation(); // Prevent category collapse toggle
    setMenuAnchor({ element: event.currentTarget, categoryId });
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
                              onClick={(e) => handleOpenCategoryMenu(e, budgetCategory.category.id)}
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
            if (menuAnchor.categoryId && currentBudget?.categories) {
              const category = currentBudget.categories.find(c => c.category.id === menuAnchor.categoryId);
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
            if (menuAnchor.categoryId) {
              handleDeleteCategory(menuAnchor.categoryId);
            }
            resetMenuAnchor();
          }}
        >
          Delete
        </MenuItem>
      </Menu>

      {/* Category Edit Dialog */}
      <CategoryDialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, category: null })}
        onSave={handleSaveCategory}
        initialCategory={editDialog.category}
      />

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
    </Box>
  );
}

export default BudgetCategories; 