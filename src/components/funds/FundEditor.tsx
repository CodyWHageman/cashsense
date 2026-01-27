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
  InputAdornment,
  Slide,
  AppBar,
  Toolbar
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { Close, Savings } from '@mui/icons-material';
import { Fund } from '../../models/Budget';
import { useResponsive } from '../../hooks/useResponsive';

// Transition for mobile full-screen effect
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface FundEditorProps {
  open: boolean;
  onClose: () => void;
  fund?: Partial<Fund>;
  userId: string;
  onSave: (fund: Fund) => void;
}

function FundEditor({ open, onClose, fund, userId, onSave }: FundEditorProps) {
  const { isSmallScreen } = useResponsive();

  const [formData, setFormData] = useState<Partial<Fund>>({
    name: '',
    description: '',
    targetAmount: 0,
    userId,
    ...fund
  });

  const [error, setError] = useState<{
    name?: string;
    targetAmount?: string;
  }>({});

  useEffect(() => {
    // Reset form when dialog opens or fund changes
    setFormData({
      name: '',
      description: '',
      targetAmount: 0,
      userId,
      ...fund
    });
    setError({});
  }, [fund, open, userId]);

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

  const handleSave = () => {
    if (!validate()) return;

    // Pass data back to parent - logic should live in the parent/context
    const fundToSave = {
      ...formData,
      userId, // Ensure userId is present
      updatedAt: new Date(),
      // If it's new, set createdAt
      createdAt: formData.createdAt || new Date()
    } as Fund;

    onSave(fundToSave);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isSmallScreen} // Mobile: Full screen
      TransitionComponent={isSmallScreen ? Transition : undefined} // Mobile: Slide up
      PaperProps={{
        sx: {
           // On desktop, round the corners nicely
           borderRadius: isSmallScreen ? 0 : 3 
        }
      }}
    >
      {/* HEADER */}
      {isSmallScreen ? (
        // Mobile Header (AppBar style)
        <AppBar sx={{ position: 'relative' }} elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
              <Close />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              {fund?.id ? 'Edit Fund' : 'New Savings Goal'}
            </Typography>
            <Button autoFocus color="inherit" onClick={handleSave}>
              Save
            </Button>
          </Toolbar>
        </AppBar>
      ) : (
        // Desktop Header
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Savings color="primary" />
            <Typography variant="h6" fontWeight={600}>
                {fund?.id ? 'Edit Fund' : 'New Savings Goal'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
      )}

      {/* CONTENT */}
      <DialogContent sx={{ pt: isSmallScreen ? 2 : 0 }}>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* 1. Name Input */}
          <TextField
            label="Fund Name"
            placeholder="e.g., Vacation, Emergency Fund"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!error.name}
            helperText={error.name}
            fullWidth
            autoFocus
            variant="outlined"
          />

          {/* 2. Target Amount Input */}
          <TextField
            label="Target Goal"
            type="number"
            value={formData.targetAmount || ''}
            onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) })}
            error={!!error.targetAmount}
            helperText={error.targetAmount || "How much do you want to save?"}
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              sx: { fontSize: '1.2rem', fontWeight: 500 }
            }}
          />

          {/* 3. Description Input */}
          <TextField
            label="Description (Optional)"
            placeholder="What is this fund for?"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={4}
            fullWidth
            variant="outlined"
          />
        </Box>
      </DialogContent>

      {/* DESKTOP ACTIONS (Mobile actions are in the AppBar) */}
      {!isSmallScreen && (
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary"
            disabled={!formData.name}
          >
            {fund?.id ? 'Save Changes' : 'Create Fund'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

export default FundEditor;