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

function BudgetPage() {
    const { user } = useAuth();
    const [selectedIncome, setSelectedIncome] = useState<BudgetIncome | null>(null);
    const [selectedExpense, setSelectedExpense] = useState<BudgetExpense | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | undefined>();
    const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
    const { isMobile } = useResponsive();
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [funds, setFunds] = useState<Fund[]>([]);
    
    // Add refs to track loading states
    const loadingBudgetRef = useRef(false);
    const loadingFundsRef = useRef(false);

    // Combine the two useEffects to avoid redundant rerenders
    useEffect(() => {
        if (!user?.id) return;
        
        const loadData = async () => {
            try {
                // Only load budget if not already loading
                if (!loadingBudgetRef.current) {
                    loadingBudgetRef.current = true;
                    try {
                        const budget = await getBudgetByMonthAndYear(
                            getDatabaseMonth(selectedMonth), 
                            selectedYear, 
                            user.id
                        );
                        
                        if (budget) {
                            setCurrentBudget({
                                ...budget,
                                month: getJavaScriptMonth(budget.month)
                            });
                        } else {
                            setCurrentBudget(null);
                        }
                    } catch (error: any) {
                        if (!error.message?.includes('no rows in result set')) {
                            console.error('Error loading budget:', error);
                            enqueueSnackbar('Error loading budget', { variant: 'error' });
                        }
                    } finally {
                        loadingBudgetRef.current = false;
                    }
                }
                
                // Only load funds if not already loading
                if (!loadingFundsRef.current) {
                    loadingFundsRef.current = true;
                    try {
                        const userFunds = await getUserFunds(user.id);
                        setFunds(userFunds);
                    } catch (error) {
                        console.error('Error loading funds:', error);
                        enqueueSnackbar('Error loading funds', { variant: 'error' });
                    } finally {
                        loadingFundsRef.current = false;
                    }
                }
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, [user?.id, selectedMonth, selectedYear]);

    const handleMonthChange = (month: number, year: number) => {
        setSelectedMonth(month);
        setSelectedYear(year);
    };

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

    const handleDeleteTransaction = async (transactionId: string) => {
        await deleteTransaction(transactionId);
        
        if(!currentBudget) return;

        const updatedIncomes = currentBudget?.incomes?.map(income => {
            return {
                ...income,
                transactions: income.transactions?.filter(transaction => transaction.id !== transactionId)
            };
        });

        const updatedExpenses = currentBudget?.expenses?.map(expense => {
            return {
                ...expense,
                transactions: expense.transactions?.filter(transaction => transaction.id !== transactionId)
            };
        });

        setCurrentBudget({
            ...currentBudget,
            incomes: updatedIncomes,
            expenses: updatedExpenses
        });
    };

    const handleIncomeUpdated = (updatedIncome: BudgetIncome) => {
        if(!currentBudget) return;

        const updatedIncomes = currentBudget?.incomes?.map(income => income.id === updatedIncome.id ? updatedIncome : income); 
        
        setCurrentBudget({
            ...currentBudget,
            incomes: updatedIncomes
        });
    };

    const handleIncomeDelete = (incomeId: string) => {
        if(!currentBudget) return;

        const remainingIncomes = currentBudget?.incomes?.filter(income => income.id !== incomeId); 

        setCurrentBudget({
            ...currentBudget,
            incomes: remainingIncomes
        }); 
    };

    const handleExpenseUpdated = async (updatedExpense: BudgetExpense) => {
        if(!currentBudget) return;

        const updatedExpenses = currentBudget?.expenses?.map(expense => expense.id === updatedExpense.id ? updatedExpense : expense);

        setCurrentBudget({
            ...currentBudget,
            expenses: updatedExpenses
        });
    };

    const handleExpensesChange = async (expenses: BudgetExpense[]) => {
        if(!currentBudget) return;

        setCurrentBudget({
            ...currentBudget,
            expenses: expenses
        });
    };

    const handleCategoriesChange = async (categories: BudgetCategory[]) => {
        if(!currentBudget) return;

        setCurrentBudget({
            ...currentBudget,
            categories: categories
        }); 
    };

    const handleCategoryAdded = async (category: BudgetCategory) => {
        if(!currentBudget) return;

        setCurrentBudget({
            ...currentBudget,
            categories: [...(currentBudget.categories || []), category]
        });
    };

    const handleGenerateBudget = async () => {
        if (!user?.id) return;

        try {
            const newBudget = await createBudget({
                month: getDatabaseMonth(selectedMonth),
                year: selectedYear,
                userId: user.id
            });

            setCurrentBudget({
                ...newBudget,
                month: getJavaScriptMonth(newBudget.month)
            });
            enqueueSnackbar('Budget created successfully', { variant: 'success' });
        } catch (error) {
            console.error('Error creating budget:', error);
            enqueueSnackbar('Error creating budget', { variant: 'error' });
        }
    };

    const handleTransactionsAdded = (transactions: Transaction[]) => {
        if (!currentBudget) return;

        const updatedExpenses = currentBudget.expenses?.map(expense => {
            const newExpenseTransactions = transactions.filter(t => t.expenseId === expense.id);
            if (newExpenseTransactions.length > 0) {
                return {
                    ...expense,
                    transactions: [...(expense.transactions || []), ...newExpenseTransactions]
                };
            }
            return expense;
        });

        const updatedIncomes = currentBudget.incomes?.map(income => {
            const newIncomeTransactions = transactions.filter(t => t.incomeId === income.id);
            if (newIncomeTransactions.length > 0) {
                return {
                    ...income,
                    transactions: [...(income.transactions || []), ...newIncomeTransactions]
                };
            }
            return income;
        });

        setCurrentBudget({
            ...currentBudget,
            expenses: updatedExpenses,
            incomes: updatedIncomes
        });
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
                    currentBudget={currentBudget}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    onMonthChange={handleMonthChange}
                    onGenerateBudgetClick={handleGenerateBudget}
                    onIncomeClick={handleIncomeClick}
                    onExpenseClick={handleExpenseClick}
                    onIncomeUpdate={handleIncomeUpdated}
                    onIncomeDelete={handleIncomeDelete}
                    onExpensesChange={handleExpensesChange}
                    onCategoriesChange={handleCategoriesChange}
                />

                {/* Position the action buttons */}
                {currentBudget && (
                    <BudgetActions
                        currentBudget={currentBudget}
                        funds={funds}
                        onTransactionsAdded={handleTransactionsAdded}
                        onCategoryAdded={handleCategoryAdded}
                    />
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
                        currentBudget={currentBudget}
                        selectedIncome={selectedIncome}
                        selectedExpense={selectedExpense}
                        selectedCategory={selectedCategory}
                        onDetailPanelClose={handleDetailPanelClose}
                        onDeleteTransaction={handleDeleteTransaction}
                        onIncomeUpdate={handleIncomeUpdated}
                        onExpenseUpdate={handleExpenseUpdated}
                        open={!!(selectedIncome || selectedExpense)}
                    />
                </Box>
            )}
        </Box>
    );
}

export default BudgetPage;