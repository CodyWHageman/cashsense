import React, { useState, Suspense } from 'react';
import { CssBaseline, ThemeProvider, CircularProgress, Box } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getDefaultTheme } from './theme';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { MainLayout } from './components/layout/MainLayout';

// Lazy load components
const BudgetPage = React.lazy(() => import('./components/pages/BudgetPage'));
const FundPage = React.lazy(() => import('./components/pages/FundPage'));
const Login = React.lazy(() => import('./components/auth/Login'));
const Signup = React.lazy(() => import('./components/auth/Signup'));
const SettingsPage = React.lazy(() => import('./components/pages/SettingsPage'));
const HelpPage = React.lazy(() => import('./components/pages/HelpPage'));

// Loading component
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
  </Box>
);

// Protected route wrapper
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const theme = getDefaultTheme(mode);
  
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                <Route path="/" element={
                  <PrivateRoute>
                    <BudgetPage />
                  </PrivateRoute>
                } />
                
                <Route path="/funds" element={
                  <PrivateRoute>
                    <FundPage />
                  </PrivateRoute>
                } />
                
                <Route path="/help" element={
                  <PrivateRoute>
                    <HelpPage />
                  </PrivateRoute>
                } />
                
                <Route path="/settings" element={
                  <PrivateRoute>
                    <SettingsPage mode={mode} toggleColorMode={toggleColorMode} />
                  </PrivateRoute>
                } />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App; 