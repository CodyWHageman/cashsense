import { Box, Button, ButtonBase, Popover, styled, Typography, useTheme, useMediaQuery } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Budget } from '../../models/Budget';
import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { checkBudgetsExist } from '../../services/budgetService';
import { calculateLeftToBudget } from '../../utils/calculator';
import { useBudget } from '../../contexts/BudgetContext';
import { useResponsive } from '../../hooks/useResponsive';

// FIX: Remove fixed width logic here. Let the parent container control width.
// Use 'sticky' with z-index to stay on top, but allow height to grow if wrapped.
const HeaderContainer = styled(Box)(({ theme }) => ({
    width: '100%', 
    padding: theme.spacing(1.5, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper, // Ensure solid background
    minHeight: '64px', // Changed from height to minHeight
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 1100,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    flexWrap: 'wrap', // FIX: Allow content to wrap on small screens
    gap: theme.spacing(1) // Add gap for when items wrap
}));

function BudgetHeader() {  
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { user } = useAuth();
  const { currentBudget, selectedMonth, selectedYear, handleMonthChange } = useBudget();
  const [budgetExists, setBudgetExists] = useState<Record<string, boolean>>({});
  const checkingBudgetsRef = useRef(false);
  const { isSmallScreen } = useResponsive(); // Use your responsive hook

  const currentDate = new Date(selectedYear, selectedMonth);
  const monthYearDisplay = format(currentDate, 'MMM yyyy'); // Shortened date format for mobile
  
  useEffect(() => {
    const checkBudgets = async () => {
      if (!user?.uid || checkingBudgetsRef.current) return;
      
      checkingBudgetsRef.current = true;
      
      try {
        const startMonth = 10; 
        const startYear = selectedYear - 1; 
        const periods = [];

        for (let i = 0; i < 9; i++) {
          let month = startMonth + i;
          let year = startYear;
          
          if (month > 11) {
            month = month - 12;
            year = year + 1;
          }
          
          periods.push({
            month: month + 1,
            year: year
          });
        }
        
        const results = await checkBudgetsExist(periods, user.uid);
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
  }, [user?.uid, selectedYear, selectedMonth]);

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) handleMonthChange(11, selectedYear - 1);
    else handleMonthChange(selectedMonth - 1, selectedYear);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) handleMonthChange(0, selectedYear + 1);
    else handleMonthChange(selectedMonth + 1, selectedYear);
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
    // ... (Existing month selector logic remains the same)
    const months = [];
    const startMonth = 10;
    const startYear = selectedYear - 1;
    
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
            bgcolor: isSelected ? 'primary.main' : isToday ? 'success.main' : 'transparent',
            color: (isSelected || isToday) ? 'white' : 'text.primary',
             // ... handle styling ...
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
      }}>
        {months}
      </Box>
    );
  };

  const renderLeftToBudget = (currentBudget: Budget) => {
    const leftToBudget = calculateLeftToBudget(currentBudget);
    let fontColor = 'text.secondary';
    let fontWeight = 500;
    // Shorten text for mobile
    let label = isSmallScreen ? 'Left' : 'Left to Budget';
    
    if (leftToBudget < 0) {
      fontColor = 'error.main';
      fontWeight = 700;
      label = isSmallScreen ? 'Over' : 'Over Budget!';
    }

    if(leftToBudget === 0) {
      fontColor = 'success.main';
      fontWeight = 700;
      label = isSmallScreen ? 'Zero-Based' : 'Every Dollar Has A Job!';
    }
    
    return (
      <Box sx={{ 
          textAlign: 'right', 
          width: isSmallScreen ? '100%' : 'auto', // Force full width on mobile to drop to new line if needed
          mt: isSmallScreen ? 0.5 : 0 
      }}>
          <Typography variant="caption" sx={{ color: fontColor, fontWeight, fontSize: '0.85rem' }}>
             {leftToBudget !== 0 && `$${leftToBudget.toFixed(2)} `} {label}
          </Typography>
      </Box>
    );
  };

  return (
    <HeaderContainer>
        {/* LEFT SECTION: Date & Nav */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Typography 
                variant="h6" 
                component="h1" 
                onClick={handleMonthSelectorClick}
                sx={{ 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    whiteSpace: 'nowrap' // Prevent date from wrapping weirdly
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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                 {/* Hide "Today" button on very small screens if needed, or keep it icon-only */}
                {!isSmallScreen && (
                    <Button 
                        variant="outlined" 
                        size="small"
                        onClick={handleTodayClick}
                        sx={{ py: 0.5, px: 2, minHeight: 0, lineHeight: 1.2 }}
                    >
                        Today
                    </Button>
                )}
                
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

        {/* RIGHT SECTION: Left to Budget */}
        {currentBudget && (renderLeftToBudget(currentBudget))}

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleMonthSelectorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ elevation: 3, sx: { mt: 1 } }}
      >
        {renderMonthSelector()}
      </Popover>
    </HeaderContainer>
  )
}

export default BudgetHeader;