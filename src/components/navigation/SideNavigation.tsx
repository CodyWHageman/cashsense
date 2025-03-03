import React from 'react';
import {
  Box,
  Button,
  Avatar,
  styled
} from '@mui/material';
import {
  CalculateTwoTone,
  AccountBalanceTwoTone,
  SettingsTwoTone,
  InfoTwoTone
} from '@mui/icons-material';
import cashSenseLogo from '../../../images/cashsense-small.png';

const StyledSideNav = styled(Box)(({ theme }) => ({
  width: '250px',
  height: '100vh',
  borderRight: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
  position: 'fixed',
  left: 0,
  top: 0,
  backgroundColor: theme.palette.background.paper,
  zIndex: 1200
}));

interface SideNavigationProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  userEmail?: string | null;
  onUserMenuClick: (event: React.MouseEvent<HTMLElement>) => void;
}

export function SideNavigation({ 
  currentView, 
  setCurrentView, 
  userEmail,
  onUserMenuClick 
}: SideNavigationProps) {
  return (
    <StyledSideNav>
      <Box sx={{ p: 2, mb: 2 }}>
        <Box
          component="img"
          src={cashSenseLogo}
          alt="CashSense Logo"
          sx={{ 
            width: '100%',
            height: 'auto'
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}>
        <Button
          startIcon={<CalculateTwoTone />}
          onClick={() => setCurrentView('budget')}
          variant={currentView === 'budget' ? 'contained' : 'text'}
          sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
        >
          Budget
        </Button>
        <Button
          startIcon={<AccountBalanceTwoTone />}
          onClick={() => setCurrentView('funds')}
          variant={currentView === 'funds' ? 'contained' : 'text'}
          sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
        >
          Funds
        </Button>
        <Button
          startIcon={<InfoTwoTone />}
          onClick={() => setCurrentView('help')}
          variant={currentView === 'help' ? 'contained' : 'text'}
          sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
        >
          Help
        </Button>
        <Button
          startIcon={<SettingsTwoTone />}
          onClick={() => setCurrentView('settings')}
          variant={currentView === 'settings' ? 'contained' : 'text'}
          sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
        >
          Settings
        </Button>
      </Box>

      <Box sx={{ mt: 'auto', p: 2 }}>
        <Button
          onClick={onUserMenuClick}
          sx={{ 
            width: '100%', 
            justifyContent: 'flex-start',
            textTransform: 'none'
          }}
          startIcon={
            <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem' }}>
              {userEmail?.substring(0, 2).toUpperCase() || 'U'}
            </Avatar>
          }
        >
          {userEmail}
        </Button>
      </Box>
    </StyledSideNav>
  );
} 