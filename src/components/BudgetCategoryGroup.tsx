import React from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
} from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { BudgetExpense, ExpenseCategory } from '../models/Budget';
import { Transaction } from '../models/Transaction';

interface BudgetCategoryGroupProps {
  category: ExpenseCategory;
  expenses: BudgetExpense[];
  transactions: Transaction[];
  onAddExpense: () => void;
  addTransaction: (transaction: Transaction, importedId?: string) => Promise<void>;
  onExpenseClick: (expense: BudgetExpense | null) => void;
  menuButton: React.ReactNode;
  onExpenseReorder?: (expenses: BudgetExpense[]) => Promise<void>;
}

const BudgetCategoryGroup: React.FC<BudgetCategoryGroupProps> = ({
  category,
  expenses,
  transactions,
  onAddExpense,
  addTransaction,
  onExpenseClick,
  menuButton,
  onExpenseReorder,
}) => {
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

  return (
    <Paper 
      elevation={2}
      sx={{ 
        p: 2,
        mb: 2,
        borderLeft: 4,
        borderColor: category.color
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">{category.name}</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Button
            size="small"
            onClick={onAddExpense}
            sx={{ minWidth: 'auto' }}
          >
            + Add Expense
          </Button>
          {menuButton}
        </Box>
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={`category-${category.id}`}>
          {(provided) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {expenses.map((expense, index) => (
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
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        },
                        p: 1,
                        mb: 1,
                        borderRadius: 1
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography>{expense.name}</Typography>
                        <Typography>${expense.amount.toFixed(2)}</Typography>
                      </Box>
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>
    </Paper>
  );
};

export default BudgetCategoryGroup; 