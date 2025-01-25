import { useMediaQuery, useTheme } from '@mui/material';

export function useResponsive() {
  const theme = useTheme();
  
  return {
    isMobile: useMediaQuery(theme.breakpoints.down('md')),
    isTablet: useMediaQuery(theme.breakpoints.between('sm', 'md')),
    isDesktop: useMediaQuery(theme.breakpoints.up('md')),
    // Specific breakpoint checks
    isSmallScreen: useMediaQuery(theme.breakpoints.down('sm')),
    isMediumScreen: useMediaQuery(theme.breakpoints.between('md', 'lg')),
    isLargeScreen: useMediaQuery(theme.breakpoints.up('lg')),
  };
} 