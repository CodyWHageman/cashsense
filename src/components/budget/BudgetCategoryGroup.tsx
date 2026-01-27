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
  DialogActions,
  SxProps,
  Theme
} from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { BudgetCategory, BudgetExpense, BudgetExpenseCreateDTO, BudgetExpenseUpdateDTO } from '../../models/Budget';
import { ExpandMore, Add, SavingsTwoTone, Delete, PushPin, PushPinOutlined } from '@mui/icons-material';
import { useResponsive } from '../../hooks/useResponsive';

interface BudgetCategoryGroupProps {
  budgetCategory: BudgetCategory;
  expenses: BudgetExpense[];
  onExpenseClick: (expense: BudgetExpense) => void;
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
  const { isSmallScreen } = useResponsive();
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

  const handleToggleFavorite = async (expense: BudgetExpense) => {
    try {
        await onExpenseUpdate(expense.id, { 
          isFavorite: !expense.isFavorite, 
          name: expense.name, 
          amount: expense.amount, 
          dueDate: expense.dueDate, 
          sequenceNumber: expense.sequenceNumber 
        });
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
  };

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

    const updatedExpenses = items.map((expense, index) => ({
      ...expense,
      sequenceNumber: index
    }));

    await onExpenseReorder(updatedExpenses);
  };

  const totalSpent = expenses.reduce((sum, expense) => {
    const transactionTotal = expense.transactions?.reduce((tSum, t) => tSum + t.amount, 0) || 0;
    const splitTotal = expense.splitTransactions?.reduce((tSum, t) => tSum + t.splitAmount, 0) || 0;
    return sum + transactionTotal + splitTotal;
  }, 0);

  const totalPlanned = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalRemaining = totalPlanned - totalSpent;

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

  const gridLayoutStyles: SxProps<Theme> = {
    display: isSmallScreen ? 'flex' : 'grid',
    flexDirection: isSmallScreen ? 'column' : 'row',
    gridTemplateColumns: isSmallScreen ? undefined : '1fr 120px 120px 40px',
    gap: 1,
    alignItems: 'center',
    p: isSmallScreen ? 2 : 1, 
  };

  return (
    <Paper className="category-section" sx={{ mb: 1 }}>
      {/* HEADER ROW */}
      <Box sx={{
        ...gridLayoutStyles,
        flexDirection: isSmallScreen ? 'row' : undefined,
        justifyContent: isSmallScreen ? 'space-between' : undefined,
        borderBottom: 1,
        borderColor: 'divider',
        py: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={handleToggle}
            size={isSmallScreen ? "medium" : "small"} 
            sx={{ p: isSmallScreen ? 1 : 0.5 }}
          >
            <ExpandMore
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </IconButton>
          <Typography variant="subtitle1" sx={{ color: budgetCategory.category.color, fontWeight: 600 }}>
            {budgetCategory.category.name}
          </Typography>
        </Box>

        {!isSmallScreen && (
            <>
                <Typography variant="body2" sx={{ textAlign: 'right', color: 'text.secondary' }}>
                Planned
                </Typography>
                <Typography variant="body2" sx={{ textAlign: 'right', color: 'text.secondary' }}>
                Remaining
                </Typography>
            </>
        )}
        
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
                    const transactionsSpent = expense.transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
                    const splitSpent = expense.splitTransactions?.reduce((sum, t) => sum + t.splitAmount, 0) || 0;
                    const spent = transactionsSpent + splitSpent;
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
                            onClick={() => !isEditing && onExpenseClick(expense)}
                            sx={{
                              ...gridLayoutStyles,
                              cursor: 'pointer',
                              borderBottom: isSmallScreen ? '1px solid' : 'none',
                              borderColor: 'divider',
                              '&:hover': {
                                backgroundColor: 'action.hover',
                                '& .delete-icon': { opacity: 1 },
                                '& .editable-field': { backgroundColor: 'action.selected' }
                              }
                            }}
                          >
                            {isSmallScreen ? (
                                // --- MOBILE CARD LAYOUT ---
                                <Box sx={{ width: '100%' }}>
                                    {/* Row 1: Icon, Name, and Actions */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                            {expense.fundId && (
                                                <SavingsTwoTone fontSize="small" sx={{ color: 'primary.main' }} />
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
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <Typography 
                                                    variant="body1" 
                                                    fontWeight={500}
                                                    className="editable-field"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStartEditing(expense, 'name');
                                                    }}
                                                >
                                                    {expense.name}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Box>
                                            <IconButton
                                                size="medium"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleFavorite(expense);
                                                }}
                                                sx={{ color: expense.isFavorite ? 'primary.main' : 'text.disabled', mr: -1 }}
                                            >
                                                {expense.isFavorite ? <PushPin fontSize="small" /> : <PushPinOutlined fontSize="small" />}
                                            </IconButton>
                                            <IconButton
                                                size="medium"
                                                onClick={(e) => handleDeleteClick(expense, e)}
                                                color="default"
                                                sx={{ mr: -1.5 }}
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {/* Row 2: Planned */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">Planned</Typography>
                                        {isEditing && isEditingAmount ? (
                                            <TextField
                                                value={tempAmount}
                                                onChange={(e) => setTempAmount(e.target.value)}
                                                onBlur={handleSave}
                                                onKeyDown={handleKeyPress}
                                                size="small"
                                                type="number"
                                                sx={{ maxWidth: 100 }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <Typography 
                                                variant="body2" 
                                                className="editable-field"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStartEditing(expense, 'amount');
                                                }}
                                            >
                                                ${expense.amount.toFixed(2)}
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* Row 3: Remaining */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="caption" color="text.secondary">Remaining</Typography>
                                        <Typography 
                                            variant="body2" 
                                            sx={{ color: remaining < 0 ? 'error.main' : 'primary.main' }}
                                        >
                                            ${remaining.toFixed(2)}
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
                                                handleToggleFavorite(expense);
                                            }}
                                            sx={{ 
                                                color: expense.isFavorite ? 'primary.main' : 'text.disabled',
                                                p: 0.5
                                            }}
                                        >
                                            {expense.isFavorite ? <PushPin fontSize="small" /> : <PushPinOutlined fontSize="small" />}
                                        </IconButton>

                                        {expense.fundId && (
                                            <SavingsTwoTone fontSize="small" sx={{ color: 'primary.main' }} />
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
                                            inputProps={{ onFocus: (e) => e.target.select() }}
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

                                    {/* Amount Column */}
                                    {isEditing && isEditingAmount ? (
                                        <TextField
                                            value={tempAmount}
                                            onChange={(e) => setTempAmount(e.target.value)}
                                            onBlur={handleSave}
                                            onKeyDown={handleKeyPress}
                                            size="small"
                                            type="number"
                                            inputProps={{ onFocus: (e) => e.target.select() }}
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

                                    {/* Remaining Column */}
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            textAlign: 'right',
                                            color: remaining < 0 ? 'error.main' : 'primary.main'
                                        }}
                                    >
                                        ${remaining.toFixed(2)}
                                    </Typography>

                                    {/* Delete Button Column */}
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleDeleteClick(expense, e)}
                                            className="delete-icon"
                                            sx={{ 
                                            opacity: 0,
                                            transition: 'opacity 0.2s',
                                            '&:hover': { color: 'error.main' }
                                            }}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </>
                            )}
                          </Box>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}

                  {isAddingNewExpense && (
                    <Box sx={{ ...gridLayoutStyles, py: isSmallScreen ? 2 : 0.5 }}>
                        {isSmallScreen ? (
                            // Mobile Add Input
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                                <TextField
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    onBlur={handleSave}
                                    onKeyDown={handleKeyPress}
                                    size="medium"
                                    fullWidth
                                    autoFocus
                                    placeholder="Expense name"
                                    label="Name"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        value={tempAmount}
                                        onChange={(e) => setTempAmount(e.target.value)}
                                        onBlur={handleSave}
                                        onKeyDown={handleKeyPress}
                                        size="medium"
                                        type="number"
                                        label="Amount"
                                        fullWidth
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </Box>
                            </Box>
                        ) : (
                            // Desktop Add Input
                            <>
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
                                    inputProps={{ onFocus: (e) => e.target.select() }}
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
                                    inputProps={{ onFocus: (e) => e.target.select() }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <Typography variant="body2" sx={{ textAlign: 'right' }}>
                                    ${parseFloat(tempAmount || '0').toFixed(2)}
                                </Typography>
                                <Box /> 
                            </>
                        )}
                    </Box>
                  )}

                  <Box sx={{
                    ...gridLayoutStyles,
                    borderTop: isSmallScreen ? 'none' : '1px solid',
                    borderColor: 'divider',
                    mt: isSmallScreen ? 1 : 0
                  }}>
                    {isSmallScreen ? (
                        // Mobile Totals
                        <Box sx={{ width: '100%' }}>
                            <Button
                                startIcon={<Add />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddExpense();
                                }}
                                fullWidth
                                variant="outlined"
                                disabled={isAddingNewExpense}
                                sx={{ mb: 2, justifyContent: 'flex-start' }}
                            >
                                Add Expense
                            </Button>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" fontWeight="bold">Total Planned</Typography>
                                <Typography variant="body2" fontWeight="bold">${totalPlanned.toFixed(2)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" fontWeight="bold">Total Remaining</Typography>
                                <Typography 
                                    variant="body2" 
                                    fontWeight="bold"
                                    sx={{ color: totalRemaining < 0 ? 'error.main' : 'primary.main' }}
                                >
                                    ${totalRemaining.toFixed(2)}
                                </Typography>
                            </Box>
                        </Box>
                    ) : (
                        // Desktop Totals
                        <>
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
                            <Box />
                        </>
                    )}
                  </Box>
                </Box>
              )}
            </Droppable>
          </DragDropContext>
        </Box>
      </Collapse>

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