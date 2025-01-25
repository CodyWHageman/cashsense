import { Box } from '@mui/material';
import { FundManager } from '../funds/FundManager';
import { Fund } from '../../models/Budget';
import { useAuth } from '../../contexts/AuthContext';

function FundPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <FundManager userId={user.id} />
    </Box>
  );
} 

export default FundPage;