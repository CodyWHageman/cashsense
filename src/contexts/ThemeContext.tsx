import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { getDefaultTheme } from '../theme';
import { useAuth } from './AuthContext';

interface ThemeContextType {
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, getUserThemePreference, updateUserThemePreference } = useAuth();
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  // Load theme preference when user changes
  useEffect(() => {
    if (user) {
      const savedTheme = getUserThemePreference();
      if (savedTheme) {
        setMode(savedTheme);
      }
    }
  }, [user, getUserThemePreference]);

  const toggleColorMode = async () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    
    // Save theme preference if user is logged in
    if (user) {
      try {
        await updateUserThemePreference(newMode);
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    }
  };

  const theme = React.useMemo(() => getDefaultTheme(mode), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleColorMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 