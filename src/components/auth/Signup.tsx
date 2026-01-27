import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Link,
  Paper
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import logo from '../../../images/cashsense-small.png';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      enqueueSnackbar('Passwords do not match', { variant: 'error' });
      return;
    }

    try {
      await signUp(email, password);
      navigate('/');
    } catch (error) {
      enqueueSnackbar('Failed to create account. Please try again.', { 
        variant: 'error' 
      });
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          // FIX: Responsive margin to pull content up on mobile
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
                // FIX: Constrain width so it doesn't dominate mobile screens
                maxWidth: '280px',
                width: '100%',
                height: 'auto',
                objectFit: 'contain'
              }} 
            />
          </Box>
          <Box 
            sx={{ 
              // FIX: Reduce padding on mobile (16px vs 32px)
              p: { xs: 2, md: 4 }, 
              width: '100%' 
            }}
          >
            <Typography component="h1" variant="h5" align="center" gutterBottom>
              Sign Up
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  mt: 3, 
                  mb: 2,
                  py: 1.2 // Increased touch target height
                }}
              >
                Sign Up
              </Button>
              <Box sx={{ textAlign: 'center' }}>
                <Link 
                  component={RouterLink} 
                  to="/login" 
                  variant="body2"
                  sx={{ py: 1, display: 'inline-block' }} // Easier to tap
                >
                  Already have an account? Sign In
                </Link>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Signup;