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
} from '@mui/material';
import { MoreVert, ExpandMore, Add } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Budget, BudgetExpense, ExpenseCategory } from '../models/Budget';
import { Transaction } from '../models/Transaction';
import { sequenceService } from '../services/sequenceService';
import { updateExpenseCategory } from '../services/categoryService';
import { createExpense, updateExpense } from '../services/expenseService';
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

interface BudgetCategoriesProps {
  onExpensesChange: (expenses: BudgetExpense[]) => Promise<void>;
  currentBudget: Budget | null;
  setCurrentBudget: (budget: Budget | null) => void;
  addTransaction: (transaction: Transaction, importedId?: string) => Promise<void>;
  onExpenseClick: (expense: BudgetExpense | null) => void;
}

interface EditingExpense {
  id?: string;
  name: string;
  amount: number;
  categoryId: string;
}

function BudgetCategories({ 
  onExpensesChange, 
  currentBudget, 
  setCurrentBudget,
  addTransaction,
  onExpenseClick 
}: BudgetCategoriesProps) {
  const [editDialog, setEditDialog] = useState<EditDialogState>({ open: false, category: null });
  const [menuAnchor, setMenuAnchor] = useState<MenuState>({ element: null, categoryId: null });

  // Initialize expanded state with all categories expanded
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>(() => {
    const initialExpanded: { [key: string]: boolean } = {};
    currentBudget?.categories?.forEach(cat => {
      initialExpanded[cat.category.id] = true;
    });
    return initialExpanded;
  });

  const [editingExpense, setEditingExpense] = useState<EditingExpense | null>(null);
  const [originalExpense, setOriginalExpense] = useState<EditingExpense | null>(null);

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

      setCurrentBudget({
        ...currentBudget,
        categories: updatedCategories
      });

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
      onExpensesChange(updatedExpenses || []);

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
    const newExpense = {
      name: '',
      amount: 0,
      categoryId
    };
    setEditingExpense(newExpense);
    setOriginalExpense(null); // No original expense for new items
  };

  const handleOpenCategoryMenu = (event: React.MouseEvent<HTMLElement>, categoryId: string) => {
    event.stopPropagation(); // Prevent category collapse toggle
    setMenuAnchor({ element: event.currentTarget, categoryId });
  };

  const handleInlineExpenseSave = async (e: React.FocusEvent<HTMLDivElement>) => {
    // Don't save if clicking within the same form
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }

    if (!editingExpense || !currentBudget) {
      setEditingExpense(null);
      setOriginalExpense(null);
      return;
    }

    // Check if the expense has actually changed
    if (originalExpense && 
        editingExpense.name === originalExpense.name && 
        editingExpense.amount === originalExpense.amount) {
      setEditingExpense(null);
      setOriginalExpense(null);
      return;
    }

    try {
      let updatedExpenses: BudgetExpense[];
      
      if (!editingExpense.id) {
        // Create new expense
        if (editingExpense.name.trim() === '' || editingExpense.amount === 0) {
          setEditingExpense(null);
          setOriginalExpense(null);
          return;
        }

        const newExpense = await createExpense({
          name: editingExpense.name,
          amount: editingExpense.amount,
          dueDate: new Date(),
          categoryId: editingExpense.categoryId,
          budgetId: currentBudget.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          sequenceNumber: getNextExpenseSequenceNumber(editingExpense.categoryId)
        });

        updatedExpenses = [...(currentBudget.expenses || []), newExpense];
      } else {
        // Update existing expense
        const existingExpense = currentBudget.expenses?.find(e => e.id === editingExpense.id);
        if (!existingExpense) return;

        const updatedExpense = await updateExpense(editingExpense.id, {
          ...existingExpense,
          name: editingExpense.name,
          amount: editingExpense.amount,
          updatedAt: new Date()
        });

        updatedExpenses = (currentBudget.expenses || []).map(e => 
          e.id === updatedExpense.id ? updatedExpense : e
        );
      }

      // Update parent component state first
      await onExpensesChange(updatedExpenses);
      
      // Only clear editing state after successful update
      setEditingExpense(null);
      setOriginalExpense(null);
    } catch (error) {
      console.error('Error saving expense:', error);
      // Don't clear editing state on error
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

  const handleExpenseClick = (expense: BudgetExpense) => {
    onExpenseClick(expense);
  };

  const handleExpenseDoubleClick = (expense: BudgetExpense) => {
    const editExpense = {
      id: expense.id,
      name: expense.name,
      amount: expense.amount,
      categoryId: expense.categoryId
    };
    setEditingExpense(editExpense);
    setOriginalExpense(editExpense);
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
                          category={category}
                          expenses={categoryExpenses}
                          onAddExpense={() => handleAddExpense(category.id)}
                          onExpenseClick={onExpenseClick}
                          menuButton={
                            <IconButton
                              size="small"
                              onClick={(e) => handleOpenCategoryMenu(e, category.id)}
                              sx={{ 
                                color: 'text.secondary',
                                p: 0.5
                              }}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          }
                          onExpenseReorder={async (reorderedExpenses) => {
                            await onExpensesChange(
                              currentBudget.expenses?.map(e => 
                                e.categoryId === category.id 
                                  ? reorderedExpenses.find(re => re.id === e.id) || e
                                  : e
                              ) || []
                            );
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
        onClose={() => setMenuAnchor({ element: null, categoryId: null })}
      >
        <MenuItem
          onClick={() => {
            if (menuAnchor.categoryId && currentBudget?.categories) {
              const category = currentBudget.categories.find(c => c.category.id === menuAnchor.categoryId);
              if (category) {
                setEditDialog({ open: true, category: category.category });
              }
            }
            setMenuAnchor({ element: null, categoryId: null });
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuAnchor.categoryId) {
              handleDeleteCategory(menuAnchor.categoryId);
            }
            setMenuAnchor({ element: null, categoryId: null });
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
    </Box>
  );
}

export default BudgetCategories; 