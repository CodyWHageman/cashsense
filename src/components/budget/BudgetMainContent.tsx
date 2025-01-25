import { Box, styled, Typography, Button } from '@mui/material';
import BudgetIncomeComponent from './BudgetIncomeComponent';
import BudgetCategories from './BudgetCategories';
import { Budget, BudgetIncome, BudgetExpense, BudgetCategory } from '../../models/Budget';
import { getMonthName } from '../../utils/dateUtils';
import BudgetHeader from './BudgetHeader';
import { Paper } from '@mui/material';
import { useResponsive } from '../../hooks/useResponsive';

const MainContent = styled('main')(({ theme }) => ({
    padding: theme.spacing(3),
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    marginBottom: theme.spacing(10),
    [theme.breakpoints.up('md')]: {
        width: '800px',
        maxWidth: '100%'
    },
    [theme.breakpoints.down('md')]: {
        width: '100%',
        padding: theme.spacing(2)
    }
}));

interface BudgetMainContentProps {
    currentBudget: Budget | null;
    onMonthChange: (month: number, year: number) => void;
    selectedMonth: number;
    selectedYear: number;
    onGenerateBudgetClick: () => void;
    onIncomeClick: (income: BudgetIncome) => void;
    onExpenseClick: (expense: BudgetExpense) => void;
    onIncomeUpdate: (income: BudgetIncome) => void;
    onIncomeDelete: (incomeId: string) => void;
    onExpensesChange: (expenses: BudgetExpense[]) => void;
    onCategoriesChange: (categories: BudgetCategory[]) => void;
}

export function BudgetMainContent({
    currentBudget,
    onMonthChange,
    selectedMonth,
    selectedYear,
    onGenerateBudgetClick,
    onExpenseClick,
    onIncomeClick,
    onIncomeUpdate,
    onIncomeDelete,
    onExpensesChange,
    onCategoriesChange
}: BudgetMainContentProps) {
    const { isMobile } = useResponsive();
    const monthYearDisplay = getMonthName(selectedMonth) + ' ' + selectedYear;

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
        }}>
            <Box sx={{ mb: isMobile ? 1 : 2 }}>
                <BudgetHeader currentBudget={currentBudget} onMonthChange={onMonthChange} selectedMonth={selectedMonth} selectedYear={selectedYear} />
            </Box>
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
                            onClick={onGenerateBudgetClick}
                            fullWidth={isMobile}
                        >
                            Generate Budget
                        </Button>
                    </Paper>
                ) : (
                    <>
                        <Box sx={{ mb: isMobile ? 2 : 4 }}>
                            <BudgetIncomeComponent
                                currentBudget={currentBudget}
                                onIncomeClick={onIncomeClick}
                                onIncomeUpdate={onIncomeUpdate}
                                onIncomeDelete={onIncomeDelete}
                            />
                        </Box>

                        <Box>
                            <BudgetCategories
                                currentBudget={currentBudget}
                                onExpenseClick={onExpenseClick}
                                onExpensesChange={onExpensesChange}
                                onCategoriesChange={onCategoriesChange}
                            />
                        </Box>
                    </>
                )}
            </MainContent>
        </Box>
    );
} 