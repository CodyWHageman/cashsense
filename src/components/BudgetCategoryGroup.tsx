import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  Collapse,
} from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { BudgetExpense, ExpenseCategory } from '../models/Budget';
import { Transaction } from '../models/Transaction';
import { ExpandMore, Add, SavingsTwoTone } from '@mui/icons-material';

interface BudgetCategoryGroupProps {
  category: ExpenseCategory;
  expenses: BudgetExpense[];
  onAddExpense: () => void;
  onExpenseClick: (expense: BudgetExpense | null) => void;
  menuButton: React.ReactNode;
  onExpenseReorder?: (expenses: BudgetExpense[]) => Promise<void>;
}

const BudgetCategoryGroup: React.FC<BudgetCategoryGroupProps> = ({
  category,
  expenses,
  onAddExpense,
  onExpenseClick,
  menuButton,
  onExpenseReorder,
}) => {
  const [expanded, setExpanded] = useState(true);
  const handleToggle = () => setExpanded(!expanded);

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
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ color: category.color }}>
            {category.name}
          </Typography>
          <ExpandMore
            onClick={handleToggle}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
              cursor: 'pointer',
              mr: 1
            }}
          />
        </Box>

        {/* Column Headers */}
        <Typography variant="body2" sx={{ textAlign: 'right', color: 'text.secondary' }}>
          Planned
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'right', color: 'text.secondary' }}>
          Remaining
        </Typography>
        <Box /> {/* Spacer for menu button column */}
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ py: 0 }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId={`category-${category.id}`}>
              {(provided) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {expenses.map((expense, index) => {
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
                            onClick={() => onExpenseClick(expense)}
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
                              <Typography variant="body2" noWrap>
                                {expense.name}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ textAlign: 'right' }}>
                              ${expense.amount.toFixed(2)}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                textAlign: 'right',
                                color: remaining < 0 ? 'error.main' : 'primary.main'
                              }}
                            >
                              ${remaining.toFixed(2)}
                            </Typography>
                            {menuButton}
                          </Box>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}

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
                      onClick={onAddExpense}
                      size="small"
                      sx={{ ml: -1 }}
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
    </Paper>
  );
};

export default BudgetCategoryGroup; 