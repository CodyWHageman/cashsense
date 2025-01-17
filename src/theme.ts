import { ThemeOptions, createTheme } from '@mui/material/styles';

export const getDefaultTheme = (mode: 'light' | 'dark') => {
  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: '#62d2a2',
        light: mode === 'dark' ? '#1a3f4d' : '#8addb9',
        dark: '#3ac78b',
      },
      secondary: {
        main: '#6c757d',
        light: mode === 'dark' ? '#1a3f35' : '#b1e9d1',
        dark: '#2d9d82',
      },
      error: {
        main: '#dc3545',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#e6e6e6',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#ffffff' : '#212529',
        secondary: mode === 'dark' ? '#a0a0a0' : '#6c757d',
      },
      divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#3ac78b',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
      },
    },
    components: {
        MuiCssBaseline: {
          styleOverrides: {
            '*::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '*::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '*::-webkit-scrollbar-thumb': {
              background: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              '&:hover': {
                background: mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              },
            },
            '*': {
              scrollbarWidth: 'thin',
              scrollbarColor: `${mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'} transparent`,
            },
          },
        },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'dark' ? '0 2px 4px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
            '&.budget-section': {
              backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#e6e6e6',
              padding: '10px',
              marginBottom: '0px',
            },
            '&.budget-list-container': {
              backgroundColor: mode === 'dark' ? '#252525' : '#ffffff',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#e6e6e6',
              boxShadow: mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '16px',
            },
            '&.budget-list-header': {
              borderBottom: '1px solid',
              borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#e6e6e6',
              backgroundColor: mode === 'dark' ? '#1e1e1e' : '#f8f9fa',
              padding: '12px 16px',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
            },
            '&.category-section': {
              backgroundColor: mode === 'dark' ? '#252525' : '#ffffff',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#e6e6e6',
              padding: '16px'
            },
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            borderBottom: '1px solid',
            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#e6e6e6',
            '&:last-child': {
              borderBottom: 'none',
            },
            padding: '12px 16px',
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#f8f9fa',
            },
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          root: {
            margin: 0,
          },
          primary: {
            fontWeight: 500,
            color: mode === 'dark' ? '#ffffff' : '#212529',
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            '&.MuiTypography-amount': {
              fontWeight: 600,
              color: mode === 'dark' ? '#ffffff' : '#212529',
            },
            '&.MuiTypography-remaining': {
              fontWeight: 600,
              color: mode === 'dark' ? '#4dabf5' : '#62d2a2',
            },
          },
        },
      },
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
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            backgroundColor: '#e6e6e6',
          },
          bar: {
            backgroundColor: '#62d2a2',
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
}; 