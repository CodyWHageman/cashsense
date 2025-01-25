import { Box, Button, ButtonBase, Popover, styled, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { BudgetIncome, Fund } from '../../models/Budget';
import { useEffect, useState } from 'react';
import { Budget } from '../../models/Budget';
import { format } from 'date-fns';
import { checkBudgetsExist } from '../../services/budgetService';

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
    zIndex: 1
  }));

interface BudgetHeaderProps {
  currentBudget: Budget | null;
  onMonthChange: (month: number, year: number) => void;
  selectedMonth: number;
  selectedYear: number;
}

  function BudgetHeader({ currentBudget, onMonthChange, selectedMonth, selectedYear } : BudgetHeaderProps) {  
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { user } = useAuth();
  const [budgetExists, setBudgetExists] = useState<Record<string, boolean>>({});

  const currentDate = new Date(selectedYear, selectedMonth);
  const monthYearDisplay = format(currentDate, 'MMMM yyyy');
  
  useEffect(() => {
    const checkBudgets = async () => {
      if (!user?.id) return;

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
      
      try {
        const results = await checkBudgetsExist(periods, user.id);
        const existsMap = results.reduce((acc, result) => {
          acc[`${result.year}-${result.month}`] = result.exists;
          return acc;
        }, {} as Record<string, boolean>);
        setBudgetExists(existsMap);
      } catch (error) {
        console.error('Error checking budgets:', error);
      }
    };
    
    checkBudgets();
  }, [user?.id, selectedYear, selectedMonth]);

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      onMonthChange(11, selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1, selectedYear);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      onMonthChange(0, selectedYear + 1);
    } else {
      onMonthChange(selectedMonth + 1, selectedYear);
    }
  };

  const handleTodayClick = () => {
    const today = new Date();
    onMonthChange(today.getMonth(), today.getFullYear());
  };

  const handleMonthSelectorClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMonthSelectorClose = () => {
    setAnchorEl(null);
  };

  const handleMonthYearSelect = (month: number, year: number) => {
    onMonthChange(month, year);
    handleMonthSelectorClose();
  };

  const calculateLeftToBudget = (budget: Budget): number => {
    const totalIncome = budget.incomes?.reduce((sum, income) => sum + income.amount, 0) || 0;
    const totalExpenses = budget.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
    return totalIncome - totalExpenses;
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
        {currentBudget && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            ${calculateLeftToBudget(currentBudget).toFixed(2)} Left to Budget
          </Typography>
        )}
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
