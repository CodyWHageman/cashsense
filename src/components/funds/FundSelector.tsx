import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  LinearProgress,
  IconButton
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Fund } from '../../models/Budget';
import { getUserFunds } from '../../services/fundService';
import { calculateFundBalance, FundWithBalance } from '../../utils/fundUtils';
import FundEditor from './FundEditor';

interface FundSelectorProps {
  value: string | null;
  onChange: (fundId: string | null) => void;
  userId: string;
}

function FundSelector({ value, onChange, userId }: FundSelectorProps) {
  const [funds, setFunds] = useState<FundWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFundEditor, setShowFundEditor] = useState(false);

  const loadFunds = async () => {
    try {
      const userFunds = await getUserFunds(userId);
      const fundsWithBalances = userFunds.map(calculateFundBalance);
      setFunds(fundsWithBalances);
    } catch (error) {
      console.error('Error loading funds:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFunds();
  }, [userId]);

  const handleFundSave = async (fund: Fund) => {
    await loadFunds();
    onChange(fund.id);
    setShowFundEditor(false);
  };

  const selectedFund = funds.find(f => f.id === value);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Autocomplete
          value={selectedFund || null}
          onChange={(_, newValue) => onChange(newValue?.id || null)}
          options={funds}
          getOptionLabel={(option) => option.name}
          loading={loading}
          fullWidth
          renderInput={(params) => (
            <TextField
              {...params}
              label="Fund"
              placeholder="Select a fund"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <LinearProgress /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option, state) => {
            const { key, ...otherProps } = props;
            return (
              <li key={key} {...otherProps}>
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography>{option.name}</Typography>
                    <Typography color="text.secondary">
                      ${option.balance.toFixed(2)} / ${option.targetAmount.toFixed(2)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(option.progress, 100)}
                    sx={{ height: 4, borderRadius: 1 }}
                  />
                </Box>
              </li>
            );
          }}
          slotProps={{
            popper: {
              sx: { zIndex: 1300 }
            }
          }}
        />
        <IconButton
          onClick={() => setShowFundEditor(true)}
          color="primary"
          sx={{ mt: 1 }}
        >
          <AddIcon />
        </IconButton>
      </Box>

      <FundEditor
        open={showFundEditor}
        onClose={() => setShowFundEditor(false)}
        userId={userId}
        onSave={handleFundSave}
      />
    </>
  );
}

export default FundSelector; 