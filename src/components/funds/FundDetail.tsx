import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import { Fund } from '../../models/Budget';
import { format } from 'date-fns';
import { Warning, CheckCircle } from '@mui/icons-material';

interface FundDetailProps {
  fund: Fund;
  balance: number;
}

const FundDetail: React.FC<FundDetailProps> = ({ fund, balance }) => {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {fund.name} Details
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Current Balance
        </Typography>
        <Typography variant="h4" color={balance >= 0 ? 'success.main' : 'error.main'}>
          ${balance.toFixed(2)}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Target Amount
        </Typography>
        <Typography variant="h5">
          ${fund.targetAmount.toFixed(2)}
        </Typography>
      </Box>

      <Typography variant="h6" gutterBottom>
        Recent Transactions
      </Typography>
      
      {fund.fundTransactions && fund.fundTransactions.length > 0 ? (
        <List>
          {fund.fundTransactions.map((ft) => (
            <React.Fragment key={ft.id}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {ft.transaction?.description}
                      <Chip
                        icon={ft.transferComplete ? <CheckCircle fontSize="small" /> : <Warning fontSize="small" />}
                        label={ft.transferComplete ? "Transfer Complete" : "Pending Transfer"}
                        size="small"
                        color={ft.transferComplete ? "success" : "warning"}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      {format(new Date(ft.transaction?.date || ft.createdAt), 'MMM d, yyyy')}
                      <Typography
                        component="span"
                        variant="body2"
                        color={ft.type === 'deposit' ? 'success.main' : 'error.main'}
                        sx={{ display: 'block' }}
                      >
                        {ft.type === 'deposit' ? '+' : '-'}${ft.transaction?.amount.toFixed(2)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography color="text.secondary">
          No transactions yet
        </Typography>
      )}
    </Paper>
  );
};

export default FundDetail; 