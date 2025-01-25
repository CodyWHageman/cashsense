import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import { Circle as CircleIcon, ColorLens as ColorLensIcon } from '@mui/icons-material';
import { Budget, BudgetCategory } from '../../models/Budget';
import { createCategory } from '../../services/categoryService';

// Predefined color palette
const colorPalette = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
  '#ff5722', '#795548', '#607d8b'
];

interface CategoryDialogProps {
  open: boolean;
  onClose: () => void;
  onCategorySaved: (budgetCategory: BudgetCategory) => void;
  initialCategory?: { name: string; color: string } | null;
  currentBudget: Budget;
}

export default function CategoryDialog({ open, onClose, onCategorySaved, initialCategory, currentBudget }: CategoryDialogProps) {
  const [category, setCategory] = React.useState(initialCategory || { name: '', color: colorPalette[0] });
  const colorInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  const handleSave = async () => {
    const categoriesLength = currentBudget?.categories?.length || 0;
    const sequenceNumber = categoriesLength + 1;
    const newCategory = await createCategory({ name: category.name, color: category.color, userId: currentBudget.userId }, currentBudget.id, sequenceNumber);
    onCategorySaved(newCategory);
    setCategory({ name: '', color: colorPalette[0] });
  };

  const handleCustomColorClick = () => {
    colorInputRef.current?.click();
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategory(prev => ({ ...prev, color: e.target.value }));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      aria-labelledby="category-dialog-title"
    >
      <DialogTitle id="category-dialog-title">
        {initialCategory ? 'Edit' : 'Add'} Category
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Name"
          fullWidth
          value={category.name}
          onChange={(e) => setCategory(prev => ({
            ...prev,
            name: e.target.value
          }))}
        />
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={1}>
            {colorPalette.map((color) => (
              <Grid item key={color}>
                <IconButton
                  onClick={() => setCategory(prev => ({ ...prev, color }))}
                  sx={{
                    color,
                    border: category.color === color ? 2 : 0,
                    borderColor: 'primary.main',
                    p: 1
                  }}
                >
                  <CircleIcon />
                </IconButton>
              </Grid>
            ))}
            <Grid item>
              <Tooltip title="Custom color">
                <IconButton
                  onClick={handleCustomColorClick}
                  sx={{
                    border: !colorPalette.includes(category.color) ? 2 : 0,
                    borderColor: 'primary.main',
                    p: 1
                  }}
                >
                  <ColorLensIcon sx={{ color: category.color }} />
                </IconButton>
              </Tooltip>
              <input
                ref={colorInputRef}
                type="color"
                value={category.color}
                onChange={handleCustomColorChange}
                style={{ display: 'none' }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={!category.name?.trim()}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
} 