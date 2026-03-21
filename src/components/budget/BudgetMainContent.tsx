import { Box, styled, Typography, Button, Paper } from '@mui/material';
import BudgetIncomeComponent from './BudgetIncomeComponent';
import BudgetCategories from './BudgetCategories';
import { Budget, BudgetIncome, BudgetExpense } from '../../models/Budget';
import { getMonthName } from '../../utils/dateUtils';
import BudgetHeader from './BudgetHeader';
import { useResponsive } from '../../hooks/useResponsive';
import { useBudget } from '../../contexts/BudgetContext';

// FIX: Improved centering logic
const MainContent = styled('main')(({ theme }) => ({
    padding: theme.spacing(3),
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    marginBottom: theme.spacing(10),
    width: '100%', // Default width
    
    [theme.breakpoints.up('md')]: {
        maxWidth: '800px', // Constrain max width
        margin: '0 auto',  // Center horizontally
    },
    [theme.breakpoints.down('md')]: {
        maxWidth: '100%',
        padding: theme.spacing(1.5) // Reduced padding for mobile
    }
}));

interface BudgetMainContentProps {
    onIncomeClick: (income: BudgetIncome) => void;
    onExpenseClick: (expense: BudgetExpense) => void;
}

export function BudgetMainContent({
    onExpenseClick,
    onIncomeClick
}: BudgetMainContentProps) {
    const { isMobile } = useResponsive();
    const { currentBudget, selectedMonth, selectedYear, handleGenerateBudget } = useBudget();
    const monthYearDisplay = getMonthName(selectedMonth) + ' ' + selectedYear;

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            // overflowX: 'hidden' // FIX: Prevent accidental horizontal scroll at root
        }}>
            <BudgetHeader />
            <MainContent>
                {!currentBudget ? (
                    <Paper sx={{ p: isMobile ? 2 : 4, textAlign: 'center' }}>
                        <Typography variant="h5" gutterBottom>
                            No Budget Found
                        </Typography>
                        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                            There is no budget for {monthYearDisplay}. Would you like to create one?
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleGenerateBudget}
                            fullWidth={isMobile}
                        >
                            Generate Budget
                        </Button>
                    </Paper>
                ) : (
                    <>
                        <Box sx={{ mb: isMobile ? 2 : 4 }}>
                            <BudgetIncomeComponent onIncomeClick={onIncomeClick} />
                        </Box>
                        <Box>
                            <BudgetCategories onExpenseClick={onExpenseClick} />
                        </Box>
                    </>
                )}
            </MainContent>
        </Box>
    );
}