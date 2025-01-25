import React from 'react';
import { Autocomplete, TextField, Box } from '@mui/material';
import { BudgetExpense } from '../models/Budget';

interface ExpenseSearchBoxProps {
  expenses: BudgetExpense[];
  onSelect: (expense: BudgetExpense | null) => void;
  label?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

export function ExpenseSearchBox({ 
  expenses, 
  onSelect, 
  label = 'Search expenses',
  size = 'small',
  fullWidth = true
}: ExpenseSearchBoxProps) {
  return (
    <Autocomplete
      options={expenses}
      getOptionLabel={(option) => `${option.name} ($${option.amount.toFixed(2)})`}
      onChange={(_, value) => onSelect(value)}
      renderInput={(params) => (
        <TextField 
          {...params} 
          label={label}
          size={size}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            width: '100%',
            alignItems: 'center'
          }}>
            <span>{option.name}</span>
            <span style={{ color: 'text.secondary' }}>
              ${option.amount.toFixed(2)}
            </span>
          </Box>
        </Box>
      )}
      fullWidth={fullWidth}
      blurOnSelect
    />
  );
} 