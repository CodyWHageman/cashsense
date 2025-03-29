import { useEffect, useState, useRef } from 'react';
import { Box } from '@mui/material';
import { BudgetMainContent } from '../budget/BudgetMainContent';
import { BudgetDetailPanel } from '../budget/BudgetDetailPanel';
import { Budget, BudgetIncome, BudgetExpense, BudgetCategory, ExpenseCategory, Fund } from '../../models/Budget';
import { useResponsive } from '../../hooks/useResponsive';
import { createBudget, getBudgetByMonthAndYear } from '../../services/budgetService';
import { useAuth } from '../../contexts/AuthContext';
import { getJavaScriptMonth } from '../../utils/dateUtils';
import { getDatabaseMonth } from '../../utils/dateUtils';
import { enqueueSnackbar } from 'notistack';
import Loading from '../common/Loading';
import { deleteTransaction } from '../../services/transactionService';
import AddCategoryButton from '../global-actions/AddCategoryButton';
import ImportTransactionButton from '../global-actions/ImportTransactionButton';
import { getUserFunds } from '../../services/fundService';
import { Transaction } from '../../models/Transaction';
import { BudgetActions } from '../budget/BudgetActions';
import { useBudget } from '../../contexts/BudgetContext';
function BudgetPage() {
    const { currentBudget, loading } = useBudget();
    const [selectedIncome, setSelectedIncome] = useState<BudgetIncome | null>(null);
    const [selectedExpense, setSelectedExpense] = useState<BudgetExpense | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | undefined>();
    const { isMobile } = useResponsive();
    const [funds, setFunds] = useState<Fund[]>([]);

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
            height: '100vh'
        }}>
            <Box sx={{ 
                flex: 1,
                width: '100%',
                position: 'relative'
            }}>
                <BudgetMainContent
                    onIncomeClick={handleIncomeClick}
                    onExpenseClick={handleExpenseClick}
                />

                {/* Position the action buttons */}
                {currentBudget && (
                    <BudgetActions funds={funds} />
                )}
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