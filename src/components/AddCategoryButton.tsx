import React from 'react';
import { Tooltip, Fab } from '@mui/material';
import { Add } from '@mui/icons-material';

interface AddCategoryButtonProps {
  onClick: () => void;
}

export default function AddCategoryButton({ onClick }: AddCategoryButtonProps) {
  return (
    <Tooltip title="Add Expense Category" placement="left" arrow>
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 88,
          right: 16
        }}
        onClick={onClick}
      >
        <Add />
      </Fab>
    </Tooltip>
  );
} 