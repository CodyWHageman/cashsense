import { Box } from '@mui/material';
import { FundManager } from '../funds/FundManager';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';

function FundPage() {
  const { user } = useAuth();
  const { isSmallScreen } = useResponsive();

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ 
      p: isSmallScreen ? 1 : 3, // Reduce padding on mobile
      mb: isSmallScreen ? 8 : 0 // Add bottom margin for mobile nav or FAB
    }}>
      <FundManager userId={user.uid} />
    </Box>
  );
} 

export default FundPage;