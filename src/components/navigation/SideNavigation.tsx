// src/components/navigation/SideNavigation.tsx
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Box, 
  Typography, 
  Avatar, 
  Divider,
  useTheme
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  AccountBalanceWallet as WalletIcon, 
  Settings as SettingsIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
  Savings as SavingsIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 240;

export default function SideNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const theme = useTheme();

  const menuItems = [
    { text: 'Budget', icon: <WalletIcon />, path: '/' },
    { text: 'Funds', icon: <SavingsIcon />, path: '/funds' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Help', icon: <HelpIcon />, path: '/help' },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <img src="/images/cashsense-icon.png" alt="CashSense" style={{ width: 32, height: 32 }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
          CashSense
        </Typography>
      </Box>

      <Box sx={{ px: 2, py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar 
          src={user?.photoURL || undefined}
          alt={user?.displayName || 'User'}
          sx={{ width: 64, height: 64, mb: 1.5, bgcolor: theme.palette.primary.main }}
        >
          {user?.email?.charAt(0).toUpperCase()}
        </Avatar>
        <Typography variant="subtitle1" noWrap sx={{ maxWidth: '100%' }}>
          {user?.displayName || user?.email?.split('@')[0]}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '100%' }}>
          {user?.email}
        </Typography>
      </Box>

      <Divider />

      <List sx={{ mt: 2 }}>
        {menuItems.map((item) => (
          <ListItem 
            key={item.text} 
            button // Use button prop for clickable behavior
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
            sx={{
              mx: 1,
              width: 'auto',
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: `${theme.palette.primary.main}15`,
                '&:hover': {
                  backgroundColor: `${theme.palette.primary.main}25`,
                },
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main,
                },
                '& .MuiListItemText-primary': {
                  color: theme.palette.primary.main,
                  fontWeight: 'bold',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <List sx={{ mb: 1 }}>
        <ListItem button onClick={handleLogout} sx={{ mx: 1, borderRadius: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Drawer>
  );
}