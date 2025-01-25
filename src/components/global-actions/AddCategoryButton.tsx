import React from 'react';
import { Tooltip, Fab } from '@mui/material';
import { Add } from '@mui/icons-material';
import { BudgetCategory } from '../../models/Budget';

interface AddCategoryButtonProps {
  categoryAdded: (budgetCategory: BudgetCategory) => void;
}

const AddCategoryButton = ({ categoryAdded }: AddCategoryButtonProps) => {

  const handleClick = () => {
    
  };

  return (
    <>
    <Tooltip title="Add Expense Category" placement="left" arrow>
      <Fab
        color="primary"
        onClick={handleClick}
      >
        <Add />
      </Fab>
    </Tooltip>
    </>
  );
} 

export default AddCategoryButton;