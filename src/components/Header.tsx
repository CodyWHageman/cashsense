import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton,
  Box,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  KeyboardArrowLeft, 
  KeyboardArrowRight,
  MoreVert
} from '@mui/icons-material';
import { getJavaScriptMonth, getMonthName } from '../utils/dateUtils';

interface HeaderProps {
  month: number;
  year: number;
  totalIncome: number;
  totalPlanned: number;
  onMonthChange: (month: number, year: number) => void;
}

function Header({ 
  month = new Date().getMonth() + 1,
  year = new Date().getFullYear(),
  totalIncome = 0,
  totalPlanned = 0,
  onMonthChange
}: HeaderProps) {
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);

  const handlePreviousMonth = () => {
    let newMonth = month - 1;
    let newYear = year;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear = year - 1;
    }
    
    onMonthChange?.(newMonth, newYear);
  };

  const handleNextMonth = () => {
    let newMonth = month + 1;
    let newYear = year;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear = year + 1;
    }
    
    onMonthChange?.(newMonth, newYear);
  };

  const leftToBudget = totalIncome - totalPlanned;

  return (
    <AppBar 
      position="static" 
      color="transparent" 
      elevation={0}
      sx={{ 
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handlePreviousMonth}>
            <KeyboardArrowLeft />
          </IconButton>
          <Box>
            <Typography variant="h6" sx={{ mx: 2 }}>
              {getMonthName(getJavaScriptMonth(month))} {year}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                mx: 2,
                color: leftToBudget < 0 ? 'error.main' : 'text.secondary'
              }}
            >
              ${leftToBudget.toFixed(2)} left to budget
            </Typography>
          </Box>
          <IconButton onClick={handleNextMonth}>
            <KeyboardArrowRight />
          </IconButton>
        </Box>

        <Box sx={{ ml: 'auto' }}>
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <MoreVert />
          </IconButton>
        </Box>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={() => {
            // TODO: Copy budget to next month
            setMenuAnchor(null);
          }}>
            Copy to Next Month
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Header; 