import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  CircularProgress,
  Divider
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSnackbar } from 'notistack';
import ImportTemplateManager from '../settings/ImportTemplateManager';

const SettingsPage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const { mode, toggleColorMode } = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Set display name directly from user metadata
    setDisplayName(user?.user_metadata?.display_name || '');
    setLoading(false);
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile({ display_name: displayName });
      enqueueSnackbar('Settings saved successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error saving settings:', error);
      enqueueSnackbar('Error saving settings', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth={600} mx="auto">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Settings
        </Typography>

        <Box my={3}>
          <Typography variant="h6" gutterBottom>
            Profile
          </Typography>
          <TextField
            fullWidth
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            margin="normal"
            variant="outlined"
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box my={3}>
          <Typography variant="h6" gutterBottom>
            Appearance
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={mode === 'dark'}
                onChange={toggleColorMode}
                name="darkMode"
              />
            }
            label="Dark Mode"
          />
        </Box>

        <Box mt={4}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </Box>
      </Paper>

      <ImportTemplateManager />
    </Box>
  );
};

export default SettingsPage; 