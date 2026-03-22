import { useState, useEffect } from 'react';
import { Box, Menu, MenuItem } from '@mui/material';
import  SideNavigation from '../navigation/SideNavigation';
import { useResponsive } from '../../hooks/useResponsive';
import { MobileNavigation } from '../navigation/MobileNavigation';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
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

  // Map routes to view names
  const routeToView: { [key: string]: string } = {
    '/dashboard': 'dashboard',
    '/budget': 'budget', // Updated from '/'
    '/funds': 'funds',
    '/help': 'help',
    '/settings': 'settings'
  };

  // Determine current view, defaulting to budget if undefined (e.g. root)
  const initialView = routeToView[location.pathname] || 'budget';
  const [currentView, setCurrentView] = useState(initialView);

  // Sync state with location changes (important for redirects)
  useEffect(() => {
    const view = routeToView[location.pathname];
    if (view) setCurrentView(view);
  }, [location.pathname]);

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    // Map view names to routes
    const viewToRoute: { [key: string]: string } = {
      'dashboard': '/dashboard',
      'budget': '/budget', // Updated from '/'
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
          <SideNavigation />
        </Box>
      )}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          overflowX: "hidden",
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