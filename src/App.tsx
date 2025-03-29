import React, { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { BudgetProvider } from './contexts/BudgetContext';
import { FundProvider } from './contexts/FundContext';
// Lazy load components
const Login = React.lazy(() => import('./components/auth/Login'));
const Signup = React.lazy(() => import('./components/auth/Signup'));
const ResetPassword = React.lazy(() => import('./components/auth/ResetPassword'));
const BudgetPage = React.lazy(() => import('./components/pages/BudgetPage'));
const FundPage = React.lazy(() => import('./components/pages/FundPage'));
const HelpPage = React.lazy(() => import('./components/pages/HelpPage'));
const SettingsPage = React.lazy(() => import('./components/pages/SettingsPage'));

// Loading component
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
  </Box>
);

// Protected route wrapper
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <SnackbarProvider maxSnack={3}>
        <AuthProvider>
          <ThemeProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                <Route 
                  path="/" 
                  element={
                    <PrivateRoute>
                      <MainLayout>
                        <BudgetProvider>
                          <FundProvider>
                            <BudgetPage />
                          </FundProvider>
                        </BudgetProvider>
                      </MainLayout>
                    </PrivateRoute>
                  } 
                />
                
                <Route 
                  path="/funds" 
                  element={
                    <PrivateRoute>
                      <MainLayout>  
                        <FundProvider>
                          <FundPage />
                        </FundProvider>
                      </MainLayout>
                    </PrivateRoute>
                  } 
                />
                
                <Route 
                  path="/help" 
                  element={
                    <PrivateRoute>
                      <MainLayout>
                        <HelpPage />
                      </MainLayout>
                    </PrivateRoute>
                  } 
                />
                
                <Route 
                  path="/settings" 
                  element={
                    <PrivateRoute>
                      <MainLayout>
                        <SettingsPage />
                      </MainLayout>
                    </PrivateRoute>
                  } 
                />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ThemeProvider>
        </AuthProvider>
      </SnackbarProvider>
    </BrowserRouter>
  );
}

export default App; 