import React from 'react';
import { 
  BottomNavigation, 
  BottomNavigationAction, 
  Paper,
  Box,
  SwipeableDrawer,
  styled
} from '@mui/material';
import { 
  AccountBalanceTwoTone,
  CalculateTwoTone,
  SettingsTwoTone,
  InfoTwoTone
} from '@mui/icons-material';

const StyledBottomNavigation = styled(BottomNavigation)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.appBar,
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

interface MobileNavigationProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export function MobileNavigation({ currentView, setCurrentView }: MobileNavigationProps) {
  return (
    <StyledBottomNavigation
      value={currentView}
      onChange={(_, newValue) => setCurrentView(newValue)}
      showLabels
    >
      <BottomNavigationAction
        label="Budget"
        value="budget"
        icon={<CalculateTwoTone />}
      />
      <BottomNavigationAction
        label="Funds"
        value="funds"
        icon={<AccountBalanceTwoTone />}
      />
      <BottomNavigationAction
        label="Settings"
        value="settings"
        icon={<SettingsTwoTone />}
      />
      <BottomNavigationAction
        label="Help"
        value="help"
        icon={<InfoTwoTone />}
      />
    </StyledBottomNavigation>
  );
} 