import { ThemeOptions, createTheme } from '@mui/material/styles';

export const getDefaultTheme = (mode: 'light' | 'dark') => {
  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: '#00a6e6',
        light: mode === 'dark' ? '#1a3f4d' : '#e6f6fc',
        dark: '#0077a7',
      },
      secondary: {
        main: '#37bb9b',
        light: mode === 'dark' ? '#1a3f35' : '#e8f7f3',
        dark: '#2d9d82',
      },
      error: {
        main: '#dc3545',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f8f9fa',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#ffffff' : '#212529',
        secondary: mode === 'dark' ? '#a0a0a0' : '#6c757d',
      },
      divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#e9ecef',
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      subtitle1: {
        fontSize: '0.9rem',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            border: '1px solid',
            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#e9ecef',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
            color: mode === 'dark' ? '#ffffff' : '#212529',
            borderBottom: '1px solid',
            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#e9ecef',
          },
        },
      },
    }
  };

  return createTheme(themeOptions);
}; 