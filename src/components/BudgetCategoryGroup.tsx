import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  Collapse,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { BudgetCategory, BudgetExpense, BudgetExpenseCreateDTO, BudgetExpenseUpdateDTO } from '../models/Budget';
import { ExpandMore, Add, SavingsTwoTone, Delete } from '@mui/icons-material';

interface BudgetCategoryGroupProps {
  budgetCategory: BudgetCategory;
  expenses: BudgetExpense[];
  onExpenseClick: (expense: BudgetExpense | null) => void;
  onExpenseAdd: (expense: BudgetExpenseCreateDTO) => Promise<void>;
  onExpenseUpdate: (expenseId: string, expense: BudgetExpenseUpdateDTO) => Promise<void>;
  onExpenseDelete: (expense: BudgetExpense) => Promise<void>;
  categoryMenuButton: React.ReactNode;
  onExpenseReorder: (expenses: BudgetExpense[]) => Promise<void>;
}

interface DeleteConfirmationState {
  open: boolean;
  expense: BudgetExpense | null;
}

const BudgetCategoryGroup: React.FC<BudgetCategoryGroupProps> = ({
  budgetCategory,
  expenses,
  onExpenseClick,
  onExpenseAdd,
  onExpenseUpdate,
  onExpenseDelete,
  onExpenseReorder,
  categoryMenuButton,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [tempAmount, setTempAmount] = useState<string>('');
  const [tempName, setTempName] = useState<string>('');
  const [isAddingNewExpense, setIsAddingNewExpense] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({
    open: false,
    expense: null
  });

  const handleToggle = () => setExpanded(!expanded);

  const handleStartEditing = (expense: BudgetExpense, field: 'name' | 'amount') => {
    setEditingExpenseId(expense.id);
    if (field === 'name') {
      setIsEditingName(true);
      setTempName(expense.name);
    } else {
      setIsEditingAmount(true);
      setTempAmount(expense.amount.toString());
    }
  };

  const handleSave = async () => {
    if (isAddingNewExpense) {
      if (!tempName.trim()) {
        // If no name provided for new expense, cancel the add
        cancelAdd();
        return;
      }
      
      try {
        await onExpenseAdd({
          name: tempName.trim(),
          amount: parseFloat(tempAmount) || 0,
          categoryId: budgetCategory.category.id,
          budgetId: budgetCategory.budgetId,
          dueDate: new Date(),
          sequenceNumber: 0
        });
        
        // Reset states after successful add
        setIsAddingNewExpense(false);
        setTempName('');
        setTempAmount('');
        setIsEditingName(false);
        setIsEditingAmount(false);
      } catch (error) {
        console.error('Error adding expense:', error);
      }
      return;
    }

    // Handle existing expense update
    if (!editingExpenseId || !onExpenseUpdate) return;
    
    const expense = expenses.find(e => e.id === editingExpenseId);
    if (!expense) return;

    try {
      await onExpenseUpdate(editingExpenseId, {
        name: isEditingName ? tempName : expense.name,
        amount: isEditingAmount ? (parseFloat(tempAmount) || 0) : expense.amount,
        dueDate: expense.dueDate,
        fundId: expense.fundId,
        sequenceNumber: expense.sequenceNumber
      });
      
      // Reset states
      setEditingExpenseId(null);
      setIsEditingName(false);
      setIsEditingAmount(false);
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      if (isAddingNewExpense) {
        cancelAdd();
      } else {
        setEditingExpenseId(null);
        setIsEditingName(false);
        setIsEditingAmount(false);
      }
    }
  };

  const handleDeleteClick = (expense: BudgetExpense, event: React.MouseEvent) => {
    event.stopPropagation();
    const hasTransactions = expense.transactions && expense.transactions.length > 0;
    
    if (hasTransactions) {
      setDeleteConfirmation({ open: true, expense });
    } else {
      handleConfirmDelete(expense);
    }
  };

  const handleConfirmDelete = async (expense: BudgetExpense) => {
    if (!onExpenseDelete) return;
    
    try {
      await onExpenseDelete(expense);
      setDeleteConfirmation({ open: false, expense: null });
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !onExpenseReorder) return;

    const items = Array.from(expenses);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sequence numbers
    const updatedExpenses = items.map((expense, index) => ({
      ...expense,
      sequenceNumber: index
    }));

    // Call the parent handler to update the database
    await onExpenseReorder(updatedExpenses);
  };

  const totalPlanned = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalRemaining = expenses.reduce((sum, expense) => {
    const spent = expense.transactions?.reduce((total, t) => total + t.amount, 0) || 0;
    return sum + (expense.amount - spent);
  }, 0);

  const handleAddExpense = () => {
    setIsAddingNewExpense(true);
    setIsEditingName(true);
    setTempName('');
    setTempAmount('0');
  };

  const cancelAdd = () => {
    setIsAddingNewExpense(false);
    setIsEditingName(false);
    setIsEditingAmount(false);
    setTempName('');
    setTempAmount('');
  };

  return (
    <Paper className="category-section" sx={{ mb: 1 }}>
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={handleToggle}
            size="small"
            sx={{ p: 0.5 }}
          >
            <ExpandMore
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </IconButton>
          <Typography variant="subtitle1" sx={{ color: budgetCategory.category.color }}>
            {budgetCategory.category.name}
          </Typography>
        </Box>

        {/* Column Headers */}
        <Typography variant="body2" sx={{ textAlign: 'right', color: 'text.secondary' }}>
          Planned
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'right', color: 'text.secondary' }}>
          Remaining
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          {categoryMenuButton}
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ py: 0 }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId={`category-${budgetCategory.category.id}`}>
              {(provided) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {expenses.map((expense, index) => {
                    const isEditing = editingExpenseId === expense.id;
                    const spent = expense.transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
                    const remaining = expense.amount - spent;

                    return (
                      <Draggable
                        key={expense.id}
                        draggableId={expense.id}
                        index={index}
                      >
                        {(provided) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 120px 120px 40px',
                              gap: 1,
                              alignItems: 'center',
                              py: 0.5,
                              px: 1,
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'action.hover',
                                '& .delete-icon': {
                                  opacity: 1,
                                },
                                '& .editable-field': {
                                  backgroundColor: 'action.selected'
                                }
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {expense.fundId && (
                                <SavingsTwoTone 
                                  fontSize="small" 
                                  sx={{ color: 'primary.main' }} 
                                />
                              )}
                              {isEditing && isEditingName ? (
                                <TextField
                                  value={tempName}
                                  onChange={(e) => setTempName(e.target.value)}
                                  onBlur={handleSave}
                                  onKeyDown={handleKeyPress}
                                  size="small"
                                  fullWidth
                                  autoFocus
                                  inputProps={{
                                    onFocus: (e) => e.target.select()
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <Typography 
                                  variant="body2" 
                                  noWrap 
                                  className="editable-field"
                                  onClick={() => handleStartEditing(expense, 'name')}
                                  sx={{ 
                                    px: 1, 
                                    py: 0.5, 
                                    borderRadius: 1,
                                    flexGrow: 1,
                                    cursor: 'text'
                                  }}
                                >
                                  {expense.name}
                                </Typography>
                              )}
                            </Box>
                            {isEditing && isEditingAmount ? (
                              <TextField
                                value={tempAmount}
                                onChange={(e) => setTempAmount(e.target.value)}
                                onBlur={handleSave}
                                onKeyDown={handleKeyPress}
                                size="small"
                                type="number"
                                inputProps={{
                                  onFocus: (e) => e.target.select()
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <Typography 
                                variant="body2" 
                                className="editable-field"
                                onClick={() => handleStartEditing(expense, 'amount')}
                                sx={{ 
                                  textAlign: 'right',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  cursor: 'text'
                                }}
                              >
                                ${expense.amount.toFixed(2)}
                              </Typography>
                            )}
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                textAlign: 'right',
                                color: remaining < 0 ? 'error.main' : 'primary.main'
                              }}
                            >
                              ${remaining.toFixed(2)}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <IconButton
                                size="small"
                                onClick={(e) => handleDeleteClick(expense, e)}
                                className="delete-icon"
                                sx={{ 
                                  opacity: 0,
                                  transition: 'opacity 0.2s',
                                  '&:hover': {
                                    color: 'error.main'
                                  }
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}

                  {/* New Expense Row */}
                  {isAddingNewExpense && (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 120px 120px 40px',
                        gap: 1,
                        alignItems: 'center',
                        py: 0.5,
                        px: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onBlur={handleSave}
                          onKeyDown={handleKeyPress}
                          size="small"
                          fullWidth
                          autoFocus
                          placeholder="Expense name"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Box>
                      <TextField
                        value={tempAmount}
                        onChange={(e) => setTempAmount(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyPress}
                        size="small"
                        type="number"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Typography variant="body2" sx={{ textAlign: 'right' }}>
                        ${(parseFloat(tempAmount) || 0).toFixed(2)}
                      </Typography>
                      <Box /> {/* Spacer for alignment */}
                    </Box>
                  )}

                  {/* Add Expense and Totals Row */}
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 120px 120px 40px',
                    gap: 1,
                    alignItems: 'center',
                    py: 0.5,
                    px: 1,
                    borderTop: 1,
                    borderColor: 'divider'
                  }}>
                    <Button
                      startIcon={<Add />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddExpense();
                      }}
                      size="small"
                      sx={{ ml: -1 }}
                      disabled={isAddingNewExpense}
                    >
                      Add Expense
                    </Button>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        textAlign: 'right',
                        fontWeight: 600
                      }}
                    >
                      ${totalPlanned.toFixed(2)}
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        textAlign: 'right',
                        fontWeight: 600,
                        color: totalRemaining < 0 ? 'error.main' : 'primary.main'
                      }}
                    >
                      ${totalRemaining.toFixed(2)}
                    </Typography>
                    <Box /> {/* Spacer for alignment */}
                  </Box>
                </Box>
              )}
            </Droppable>
          </DragDropContext>
        </Box>
      </Collapse>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmation.open}
        onClose={() => setDeleteConfirmation({ open: false, expense: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          This expense has transactions associated with it. Are you sure you want to delete it?
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmation({ open: false, expense: null })}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => deleteConfirmation.expense && handleConfirmDelete(deleteConfirmation.expense)}
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default BudgetCategoryGroup; 