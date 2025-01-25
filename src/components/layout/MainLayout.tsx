import { useState } from 'react';
import { Box, Button, Menu, MenuItem, Tooltip, Zoom } from '@mui/material';
import { SideNavigation } from '../navigation/SideNavigation';
import { useResponsive } from '../../hooks/useResponsive';
import { MobileNavigation } from '../navigation/MobileNavigation';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { KeyboardArrowUp } from '@mui/icons-material';
import ScrollToTopButton from '../common/ScrollToTopButton';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isMobile } = useResponsive();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Map routes to view names
  const routeToView: { [key: string]: string } = {
    '/': 'budget',
    '/funds': 'funds',
    '/help': 'help',
    '/settings': 'settings'
  };

  const [currentView, setCurrentView] = useState(routeToView[location.pathname] || 'budget');

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    // Map view names to routes
    const viewToRoute: { [key: string]: string } = {
      'budget': '/',
      'funds': '/funds',
      'help': '/help',
      'settings': '/settings'
    };
    navigate(viewToRoute[view]);
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleSignOut = async () => {
    handleUserMenuClose();
    await signOut();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && (
        <Box sx={{ width: '250px', flexShrink: 0 }}>
          <SideNavigation 
            currentView={currentView}
            setCurrentView={handleViewChange}
            userEmail={user?.email}
            onUserMenuClick={handleUserMenuClick}
          />
        </Box>
      )}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          pt: isMobile ? 2 : 3,
          pb: isMobile ? 7 : 3,
          px: 3,
          position: 'relative'
        }}
      >
        {children}
        {isMobile && (
          <MobileNavigation 
            currentView={currentView}
            setCurrentView={handleViewChange}
          />
        )}
      </Box>

      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        onClick={handleUserMenuClose}
      >
        <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
      </Menu>
      <ScrollToTopButton />
    </Box>
  );
} 