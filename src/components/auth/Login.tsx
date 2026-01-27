import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Link,
  Paper,
  CircularProgress
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import logo from '../../../images/cashsense-small.png';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const { signIn, user, loading, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (user && !loading) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
    } catch (error) {
      enqueueSnackbar('Failed to sign in. Please check your credentials.', { 
        variant: 'error' 
      });
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      enqueueSnackbar('Please enter your email address', { variant: 'warning' });
      return;
    }

    try {
      setIsResetting(true);
      await resetPassword(email);
      enqueueSnackbar(
        'Password reset link has been sent to your email',
        { variant: 'success' }
      );
    } catch (error) {
      enqueueSnackbar(
        'Failed to send reset link. Please try again.',
        { variant: 'error' }
      );
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          // FIX: Reduce top margin on mobile (approx 16px vs 64px)
          marginTop: { xs: 2, md: 8 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          sx={{ 
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box 
            sx={{ 
              width: '100%',
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'center',
              backgroundColor: 'background.paper',
            }}
          >
            <img 
              src={logo} 
              alt="CashSense Logo" 
              style={{ 
                // FIX: Constrain width to prevent "Hero Image" effect on mobile
                maxWidth: '280px',
                width: '100%',
                height: 'auto',
                objectFit: 'contain'
              }} 
            />
          </Box>
          <Box 
            sx={{ 
              // FIX: Reduce padding on mobile to save width
              p: { xs: 2, md: 4 }, 
              width: '100%' 
            }}
          >
            <Typography component="h1" variant="h5" align="center" gutterBottom>
              Sign In
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.2 }} // Increased touch target height slightly
              >
                Sign In
              </Button>
              <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={handleForgotPassword}
                  disabled={isResetting}
                  sx={{ py: 1 }} // Add padding for easier touching
                >
                  {isResetting ? 'Sending reset link...' : 'Forgot your password?'}
                </Link>
                <Link component={RouterLink} to="/signup" variant="body2" sx={{ py: 1 }}>
                  Don't have an account? Sign Up
                </Link>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;