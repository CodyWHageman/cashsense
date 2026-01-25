import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Switch, 
  FormControlLabel,
  Avatar,
  Link,
  Button
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ImportTemplateManager from '../settings/ImportTemplateManager';

function SettingsPage() {
  const { user, updateUserThemePreference } = useAuth();
  const { mode, toggleColorMode } = useTheme();

  const handleThemeChange = async () => {
    toggleColorMode();
    const newTheme = mode === 'light' ? 'dark' : 'light';
    if (user) {
      await updateUserThemePreference(newTheme);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {/* Profile Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Profile
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar 
              src={user?.photoURL || undefined}
              alt={user?.displayName || 'User'} 
              sx={{ width: 80, height: 80, fontSize: '2rem' }}
            >
              {user?.email?.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {user?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Profile picture provided by Gravatar.
            </Typography>
            <Button 
              component={Link}
              href="https://gravatar.com" 
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined" 
              size="small"
              endIcon={<OpenInNewIcon />}
              sx={{ textTransform: 'none' }}
            >
              Change on Gravatar
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Theme Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Appearance
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <FormControlLabel
          control={<Switch checked={mode === 'dark'} onChange={handleThemeChange} />}
          label="Dark Mode"
        />
      </Paper>

      {/* Import Templates Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Import Templates
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Configure templates for importing CSV bank statements.
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {user?.uid && <ImportTemplateManager />}
      </Paper>
    </Box>
  );
}

export default SettingsPage;