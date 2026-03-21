import { useState } from 'react';
import { Box } from '@mui/material';
import { BudgetMainContent } from '../budget/BudgetMainContent';
import { BudgetDetailPanel } from '../budget/BudgetDetailPanel';
import { BudgetIncome, BudgetExpense, ExpenseCategory } from '../../models/Budget';
import { useResponsive } from '../../hooks/useResponsive';
import Loading from '../common/Loading';
import { BudgetActions } from '../budget/BudgetActions';
import { useBudget } from '../../contexts/BudgetContext';
import { useFund } from '../../contexts/FundContext';
import ScrollToTopButton from '../common/ScrollToTopButton';

function BudgetPage() {
    const { currentBudget, loading } = useBudget();
    const [selectedIncome, setSelectedIncome] = useState<BudgetIncome | null>(null);
    const [selectedExpense, setSelectedExpense] = useState<BudgetExpense | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | undefined>();
    const { isMobile } = useResponsive();
    const { funds } = useFund();

    const handleIncomeClick = (income: BudgetIncome | null) => {
        setSelectedIncome(income);
        setSelectedExpense(null);
    };

    const handleExpenseClick = (expense: BudgetExpense | null) => {
        setSelectedExpense(expense);
        setSelectedIncome(null);
    };

    const handleDetailPanelClose = () => {
        setSelectedIncome(null);
        setSelectedExpense(null);
    };

    if(loading) {
        return <Loading />;
    }

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            position: 'relative',
            height: '100vh',
            overflow: 'hidden' // NEW: Lock the main window from scrolling
        }}>
            <Box
                id="budget-main-scroll-container" 
                sx={{ 
                    flex: 1,
                    width: '100%',
                    position: 'relative',
                    height: '100%', // NEW: Take full height of parent
                    overflowY: 'auto', // NEW: Make THIS the scrollable container
                    overflowX: 'hidden' // NEW: Moved horizontal protection here safely
                }}
            >
                <BudgetMainContent
                    onIncomeClick={handleIncomeClick}
                    onExpenseClick={handleExpenseClick}
                />

                {/* Position the action buttons */}
                {currentBudget && (
                    <BudgetActions funds={funds} />
                )}
                <ScrollToTopButton targetId="budget-main-scroll-container" />
            </Box>

            {currentBudget && (
                <Box sx={{ 
                    position: isMobile ? 'fixed' : 'sticky',
                    top: 0,
                    right: 0,
                    zIndex: 1200
                }}>
                    <BudgetDetailPanel
                        selectedIncome={selectedIncome}
                        selectedExpense={selectedExpense}
                        selectedCategory={selectedCategory}
                        onDetailPanelClose={handleDetailPanelClose}
                        open={!!(selectedIncome || selectedExpense)}
                    />
                </Box>
            )}
        </Box>
    );
}

export default BudgetPage;