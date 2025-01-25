import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Autocomplete
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Fund } from '../../models/Budget';
import { createFund, updateFund, getUserFunds } from '../../services/fundService';

interface FundEditorProps {
  open: boolean;
  onClose: () => void;
  fund?: Partial<Fund>;
  userId: string;
  onSave: (fund: Fund) => void;
}

function FundEditor({ open, onClose, fund, userId, onSave }: FundEditorProps) {
  const [formData, setFormData] = useState<Partial<Fund>>({
    name: '',
    description: '',
    targetAmount: 0,
    ...fund
  });

  const [error, setError] = useState<{
    name?: string;
    targetAmount?: string;
  }>({});

  useEffect(() => {
    setFormData({
      name: '',
      description: '',
      targetAmount: 0,
      ...fund
    });
  }, [fund]);

  const validate = () => {
    const newError: typeof error = {};
    
    if (!formData.name?.trim()) {
      newError.name = 'Name is required';
    }
    
    if (!formData.targetAmount || formData.targetAmount <= 0) {
      newError.targetAmount = 'Target amount must be greater than 0';
    }

    setError(newError);
    return Object.keys(newError).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      const savedFund = fund?.id
        ? await updateFund(fund.id, formData)
        : await createFund({
            ...formData,
            userId,
            createdAt: new Date(),
            updatedAt: new Date()
          } as Fund);

      onSave(savedFund);
      onClose();
    } catch (error) {
      console.error('Error saving fund:', error);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {fund?.id ? 'Edit Fund' : 'Create Fund'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!error.name}
            helperText={error.name}
            fullWidth
          />

          <TextField
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />

          <TextField
            label="Target Amount"
            type="number"
            value={formData.targetAmount || ''}
            onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) })}
            error={!!error.targetAmount}
            helperText={error.targetAmount}
            fullWidth
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          {fund?.id ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FundEditor; 