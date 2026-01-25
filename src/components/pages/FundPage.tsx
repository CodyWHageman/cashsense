import { Box } from '@mui/material';
import { FundManager } from '../funds/FundManager';
import { useAuth } from '../../contexts/AuthContext';
// Note: Fund import was unused, removed it

function FundPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <FundManager userId={user.uid} />
    </Box>
  );
} 

export default FundPage;