import { Box, Button, ButtonBase, Popover, styled, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { BudgetIncome, Fund } from '../../models/Budget';
import { useEffect, useState, useRef } from 'react';
import { Budget } from '../../models/Budget';
import { format } from 'date-fns';
import { checkBudgetsExist } from '../../services/budgetService';
import { calculateLeftToBudget } from '../../utils/calculator';
import { useBudget } from '../../contexts/BudgetContext';
const Header = styled(Box)(({ theme }) => ({
    width: '800px',
    maxWidth: '100%',
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default,
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 1100,
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
  }));

interface BudgetHeaderProps {
  currentBudget: Budget | null;
  onMonthChange: (month: number, year: number) => void;
  selectedMonth: number;
  selectedYear: number;
}

function BudgetHeader() {  
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { user } = useAuth();
  const { currentBudget, selectedMonth, selectedYear, handleMonthChange } = useBudget();
  const [budgetExists, setBudgetExists] = useState<Record<string, boolean>>({});
  
  // Add a ref to track if we're checking budgets
  const checkingBudgetsRef = useRef(false);

  const currentDate = new Date(selectedYear, selectedMonth);
  const monthYearDisplay = format(currentDate, 'MMMM yyyy');
  
  useEffect(() => {
    const checkBudgets = async () => {
      if (!user?.id || checkingBudgetsRef.current) return;
      
      checkingBudgetsRef.current = true;
      
      try {
        const startMonth = 10; // November (0-based)
        const startYear = selectedYear - 1; // Previous year
        const periods = [];

        for (let i = 0; i < 9; i++) {
          let month = startMonth + i;
          let year = startYear;
          
          if (month > 11) {
            month = month - 12;
            year = year + 1;
          }
          
          periods.push({
            month: month + 1, // Convert to 1-based for database
            year: year
          });
        }
        
        const results = await checkBudgetsExist(periods, user.id);
        const existsMap = results.reduce((acc, result) => {
          acc[`${result.year}-${result.month}`] = result.exists;
          return acc;
        }, {} as Record<string, boolean>);
        setBudgetExists(existsMap);
      } catch (error) {
        console.error('Error checking budgets:', error);
      } finally {
        checkingBudgetsRef.current = false;
      }
    };
    
    checkBudgets();
  }, [user?.id, selectedYear, selectedMonth]);

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      handleMonthChange(11, selectedYear - 1);
    } else {
      handleMonthChange(selectedMonth - 1, selectedYear);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      handleMonthChange(0, selectedYear + 1);
    } else {
      handleMonthChange(selectedMonth + 1, selectedYear);
    }
  };

  const handleTodayClick = () => {
    const today = new Date();
    handleMonthChange(today.getMonth(), today.getFullYear());
  };

  const handleMonthSelectorClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMonthSelectorClose = () => {
    setAnchorEl(null);
  };

  const handleMonthYearSelect = (month: number, year: number) => {
    handleMonthChange(month, year);
    handleMonthSelectorClose();
  };

  const renderMonthSelector = () => {
    const months = [];
    const startMonth = 10; // November (0-based)
    const startYear = selectedYear - 1; // Previous year
    
    for (let i = 0; i < 9; i++) {
      let month = startMonth + i;
      let year = startYear;
      
      if (month > 11) {
        month = month - 12;
        year = year + 1;
      }
      
      const isSelected = month === selectedMonth && year === selectedYear;
      const isToday = month === new Date().getMonth() && year === new Date().getFullYear();
      const hasBudget = budgetExists[`${year}-${month + 1}`];
      
      months.push(
        <ButtonBase
          key={`${year}-${month}`}
          onClick={() => handleMonthYearSelect(month, year)}
          sx={{
            p: 1.5,
            borderRadius: 1,
            width: '110px',
            justifyContent: 'center',
            border: theme => hasBudget 
              ? `1px solid ${theme.palette.divider}`
              : `1px dashed ${theme.palette.divider}`,
            ...(isSelected && {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              border: theme => `1px solid ${theme.palette.primary.main}`,
            }),
            ...(isToday && {
              bgcolor: 'success.main',
              color: 'success.contrastText',
              border: theme => `1px solid ${theme.palette.success.main}`,
            }),
            '&:hover': {
              bgcolor: isSelected ? 'primary.dark' : 'action.hover',
            }
          }}
        >
          <Typography variant="body2">
            {format(new Date(year, month), 'MMM yyyy')}
          </Typography>
        </ButtonBase>
      );
    }

    return (
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'row',
        gap: 0.5,
        p: 1,
        overflowX: 'auto',
        '&::-webkit-scrollbar': {
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'background.paper',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'divider',
          borderRadius: '4px',
        },
      }}>
        {months}
      </Box>
    );
    };

  const renderLeftToBudget = (currentBudget: Budget) => {
    const leftToBudget = calculateLeftToBudget(currentBudget);
    let fontColor = 'text.secondary';
    let fontWeight = 'normal';
    let leftToBudgetText = `${leftToBudget.toFixed(2)} Left to Budget`;

    if (leftToBudget < 0) {
      fontColor = 'error.main';
      fontWeight = 'bold';
      leftToBudgetText = 'Over Budget! ' + leftToBudget.toFixed(2);
    }

    if(leftToBudget === 0) {
      fontColor = 'success.main';
      fontWeight = 'bold';
      leftToBudgetText = 'Every Dollar Has A Job!';
    }
    
    return (
      <Typography 
      variant="caption" 
      sx={{ 
        color: fontColor,
        fontWeight: fontWeight
      }}
    >
      {leftToBudgetText}
    </Typography>
    );
  };

  return (
    <Header>
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography 
            variant="h6" 
            component="h1" 
            onClick={handleMonthSelectorClick}
            sx={{ 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            {monthYearDisplay}
            <Box component="span" sx={{ 
              fontSize: '0.7em',
              color: 'text.secondary',
              transform: anchorEl ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s'
            }}>▼</Box>
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button 
              variant="outlined" 
              size="small"
              onClick={handleTodayClick}
              sx={{ py: 0.5, px: 2, minHeight: 0, lineHeight: 1.2 }}
            >
              Today
            </Button>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button 
                size="small" 
                onClick={handlePreviousMonth}
                sx={{ minWidth: 32, p: 0.5 }}
              >&lt;</Button>
              <Button 
                size="small" 
                onClick={handleNextMonth}
                sx={{ minWidth: 32, p: 0.5 }}
              >&gt;</Button>
            </Box>
          </Box>
        </Box>
        {currentBudget && (renderLeftToBudget(currentBudget))}
      </Box>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleMonthSelectorClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          elevation: 3,
          sx: { mt: 1 }
        }}
      >
        {renderMonthSelector()}
      </Popover>
    </Header>
  )
}

export default BudgetHeader;
