import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Container,
  Popover,
  ButtonBase,
  Menu,
  MenuItem,
  Avatar,
  Tooltip
} from '@mui/material';
import { Transaction } from '../models/Transaction';
import { Budget, BudgetCategory, BudgetExpense, BudgetIncome, Fund } from '../models/Budget';
import BudgetCategories from './BudgetCategories';
import BudgetView from './BudgetView';
import BudgetIncomeComponent from './BudgetIncomeComponent';
import { FundManager } from './FundManager';
import ImportTransactionButton from './ImportTransactionButton';
import AddCategoryButton from './AddCategoryButton';
import { createBudget, getBudgetByMonthAndYear } from '../services/budgetService';
import { createTransaction, deleteTransaction } from '../services/transactionService';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { getDatabaseMonth, getJavaScriptMonth } from '../utils/dateUtils';
import { checkBudgetsExist } from '../services/budgetService';
import { Brightness4, Brightness7, KeyboardArrowUp, CalculateTwoTone, AccountBalanceTwoTone, SettingsTwoTone, InfoTwoTone } from '@mui/icons-material';
import { getUserFunds } from '../services/fundService';
import { createCategory } from '../services/categoryService';
import CategoryDialog from './CategoryDialog';
import { styled } from '@mui/material/styles';
import Settings from './Settings';
import Help from './Help';
import Zoom from '@mui/material/Zoom';

interface BudgetHomeProps {
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
}

type ViewType = 'budget' | 'funds' | 'settings' | 'help';

interface EditDialogState {
  open: boolean;
  category: { name: string; color: string } | null;
}

const SideNav = styled(Box)(({ theme }) => ({
  width: '250px',
  height: '100vh',
  borderRight: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
  position: 'fixed',
  left: 0,
  top: 0,
  backgroundColor: theme.palette.background.paper,
  zIndex: 1200
}));

const MainContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  left: '250px',
  right: '400px',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  overflow: 'auto',
  backgroundColor: theme.palette.background.default
}));

const MainContent = styled('main')(({ theme }) => ({
  width: '800px',
  maxWidth: '100%',
  padding: theme.spacing(3),
  flex: 1,
  display: 'flex',
  flexDirection: 'column'
}));

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

const ScrollableSection = styled(Box)({
  padding: '24px'
});

const RightPanel = styled(Box)(({ theme }) => ({
  width: '400px',
  backgroundColor: theme.palette.background.default,
  position: 'fixed',
  right: 0,
  top: 0,
  height: '100vh',
  overflowY: 'auto',
  padding: theme.spacing(2)
}));

const FloatingButton = styled(Box)(({ theme }) => ({
  position: 'fixed',
  left: '50%',
  bottom: theme.spacing(4),
  transform: 'translateX(-50%)',
  zIndex: 1000,
  marginLeft: '100px' // Offset by half the sidebar width to center in main content
}));

function BudgetHome({ mode, toggleColorMode }: BudgetHomeProps) {
  const { user, signOut } = useAuth();
  const userId = user?.id;
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<BudgetExpense | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentView, setCurrentView] = useState<ViewType>('budget');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [budgetExists, setBudgetExists] = useState<Record<string, boolean>>({});
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [editDialog, setEditDialog] = useState<EditDialogState>({ open: false, category: null });
  const [showScrollTop, setShowScrollTop] = useState(false);

  const currentDate = new Date(selectedYear, selectedMonth);
  const monthYearDisplay = format(currentDate, 'MMMM yyyy');

  useEffect(() => {
    const checkBudgets = async () => {
      if (!userId) return;

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
        const results = await checkBudgetsExist(periods, userId);
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
  }, [userId, selectedYear, selectedMonth]);

  const loadBudget = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const budget = await getBudgetByMonthAndYear(getDatabaseMonth(selectedMonth), selectedYear, userId);
      if (budget) {
        setCurrentBudget({
          ...budget,
          month: getJavaScriptMonth(budget.month)
        });
      } else {
        setCurrentBudget(null);
        setTransactions([]);
      }
    } catch (error: any) {
      if (!error.message?.includes('no rows in result set')) {
        console.error('Error loading budget:', error);
        enqueueSnackbar('Error loading budget', { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudget();
  }, [userId, selectedMonth, selectedYear]);

  const handleGenerateBudget = async () => {
    if (!userId) return;

    try {
      const newBudget = await createBudget({
        month: getDatabaseMonth(selectedMonth),
        year: selectedYear,
        userId
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

  const handleUpdatedExpenses = async (expenses: BudgetExpense[]) => {
    if (!currentBudget) return;
    try {
      const updatedBudget = { ...currentBudget, expenses };
      setCurrentBudget(updatedBudget);
    } catch (error) {
      console.error('Error updating expenses:', error);
      enqueueSnackbar('Error updating expenses', { variant: 'error' });
    }
  };

  const handleUpdatedCategories = async (categories: BudgetCategory[]) => {
    if (!currentBudget) return;
    try {
      const updatedBudget = { ...currentBudget, categories };
      setCurrentBudget(updatedBudget);
    } catch (error) {
      console.error('Error updating categories:', error);
      enqueueSnackbar('Error updating categories', { variant: 'error' });
    }
  };

  const handleUpdateIncomes = async (incomes: BudgetIncome[]) => {
    if (!currentBudget) return;
    try {
      const updatedBudget = { ...currentBudget, incomes };
      setCurrentBudget(updatedBudget);
    } catch (error) {
      console.error('Error updating incomes:', error);
      enqueueSnackbar('Error updating incomes', { variant: 'error' });
    }
  };

  const handleImportTransaction = async (transaction: Transaction) => {
    if (!currentBudget) return;
    
    try {
      const newTransaction = await createTransaction({...transaction});
      setTransactions(prev => [...prev, newTransaction]);
      enqueueSnackbar('Transaction imported successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error importing transaction:', error);
      enqueueSnackbar('Error importing transaction', { variant: 'error' });
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      enqueueSnackbar('Transaction deleted successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      enqueueSnackbar('Error deleting transaction', { variant: 'error' });
    }
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleTodayClick = () => {
    const today = new Date();
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
  };

  const handleMonthSelectorClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMonthSelectorClose = () => {
    setAnchorEl(null);
  };

  const handleMonthYearSelect = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    handleMonthSelectorClose();
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await signOut();
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

  useEffect(() => {
    const loadUserFunds = async () => {
      if (!userId) return;
      try {
        const userFunds = await getUserFunds(userId);
        setFunds(userFunds);
      } catch (error) {
        console.error('Error loading funds:', error);
        enqueueSnackbar('Error loading funds', { variant: 'error' });
      }
    };
    loadUserFunds();
  }, [userId]);

  const handleSaveCategory = async (category: { name: string; color: string }) => {
    if (!currentBudget) return;

    try {
      const newCategory = await createCategory(
        {
          name: category.name,
          color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color for now
          userId: userId,
          createdAt: new Date()
        },
        currentBudget.id,
        currentBudget.categories?.length || 0
      );

      setCurrentBudget({
        ...currentBudget,
        categories: [...(currentBudget.categories || []), newCategory]
      });

      enqueueSnackbar('Category created successfully', { variant: 'success' });
      setEditDialog({ open: false, category: null });
    } catch (error) {
      console.error('Error creating category:', error);
      enqueueSnackbar('Error creating category', { variant: 'error' });
    }
  };

  const handleExpenseUpdate = async (updatedExpense: BudgetExpense) => {
    if (!currentBudget || !currentBudget.expenses) return;
    try {
      const updatedExpenses = currentBudget.expenses.map(expense => 
        expense.id === updatedExpense.id ? updatedExpense : expense
      );
      const updatedBudget = { ...currentBudget, expenses: updatedExpenses };
      setCurrentBudget(updatedBudget);
    } catch (error) {
      console.error('Error updating expense:', error);
      enqueueSnackbar('Error updating expense', { variant: 'error' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTrigger = window.innerHeight * 0.3; // Show after 30% of viewport height
      setShowScrollTop(window.scrollY > scrollTrigger);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const calculateLeftToBudget = (budget: Budget): number => {
    const totalIncome = budget.incomes?.reduce((sum, income) => sum + income.amount, 0) || 0;
    const totalExpenses = budget.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
    return totalIncome - totalExpenses;
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <SideNav>
        <Box sx={{ p: 2 }}>
          <img 
            src="/images/cashsense-small.png" 
            alt="CashSense" 
            style={{ height: '40px', marginBottom: '24px' }} 
          />
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}>
          <Button
            startIcon={<CalculateTwoTone />}
            onClick={() => setCurrentView('budget')}
            variant={currentView === 'budget' ? 'contained' : 'text'}
            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
          >
            Budget
          </Button>
          <Button
            startIcon={<AccountBalanceTwoTone />}
            onClick={() => setCurrentView('funds')}
            variant={currentView === 'funds' ? 'contained' : 'text'}
            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
          >
            Funds
          </Button>
          <Button
            startIcon={<InfoTwoTone />}
            onClick={() => setCurrentView('help')}
            variant={currentView === 'help' ? 'contained' : 'text'}
            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
          >
            Help
          </Button>
          <Button
            startIcon={<SettingsTwoTone />}
            onClick={() => setCurrentView('settings')}
            variant={currentView === 'settings' ? 'contained' : 'text'}
            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
          >
            Settings
          </Button>
        </Box>

        <Box sx={{ mt: 'auto', p: 2 }}>
          <Button
            onClick={handleUserMenuClick}
            sx={{ 
              width: '100%', 
              justifyContent: 'flex-start',
              textTransform: 'none'
            }}
            startIcon={
              <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem' }}>
                {user?.email?.substring(0, 2).toUpperCase() || 'U'}
              </Avatar>
            }
          >
            {user?.email}
          </Button>
        </Box>
      </SideNav>

      <MainContainer>
        {currentView === 'budget' ? (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
              </Header>

              <MainContent>
                <ScrollableSection>
                  {!currentBudget ? (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
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
                      >
                        Generate Budget
                      </Button>
                    </Paper>
                  ) : (
                    <>
                      <Paper sx={{ p: 2 }}>
                        <BudgetIncomeComponent
                          updateIncomes={handleUpdateIncomes}
                          currentBudget={currentBudget}
                          addTransaction={handleImportTransaction}
                        />
                      </Paper>
                      <BudgetCategories
                        currentBudget={currentBudget}
                        onExpensesChange={handleUpdatedExpenses}
                        onCategoriesChange={handleUpdatedCategories}
                        onExpenseClick={setSelectedExpense}
                      />
                    </>
                  )}
                </ScrollableSection>
              </MainContent>
            </Box>

            <RightPanel>
              {currentBudget && (
                <BudgetView
                  expenses={currentBudget.expenses || []}
                  transactions={transactions}
                  categories={currentBudget.categories?.map(c => c.category) || []}
                  incomes={currentBudget.incomes || []}
                  onDeleteTransaction={handleDeleteTransaction}
                  selectedExpense={selectedExpense}
                  onExpenseDetailClose={() => setSelectedExpense(null)}
                  onExpenseClick={setSelectedExpense}
                  onExpenseUpdate={handleExpenseUpdate}
                />
              )}
            </RightPanel>
          </>
        ) : currentView === 'funds' ? (
          <Box sx={{ p: 3, gridColumn: '1 / -1' }}>
            {userId && <FundManager userId={userId} />}
          </Box>
        ) : currentView === 'help' ? (
          <Help />
        ) : (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Settings mode={mode} toggleColorMode={toggleColorMode} />
          </Box>
        )}
      </MainContainer>

      <Zoom in={showScrollTop}>
        <FloatingButton>
          <Tooltip title="Scroll to top" placement="left">
            <Button
              onClick={scrollToTop}
              variant="contained"
              sx={{
                borderRadius: '50%',
                minWidth: '48px',
                width: '48px',
                height: '48px'
              }}
            >
              <KeyboardArrowUp />
            </Button>
          </Tooltip>
        </FloatingButton>
      </Zoom>

      {/* Keep existing dialogs and popups */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={() => {
          toggleColorMode();
          handleUserMenuClose();
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Box>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          Logout
        </MenuItem>
      </Menu>

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

      <CategoryDialog 
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, category: null })}
        onSave={handleSaveCategory}
        initialCategory={editDialog.category}
      />

      {/* Import Transaction Button and Add Category Button */}
      {currentBudget && (
        <>
          <AddCategoryButton onClick={() => setEditDialog({ open: true, category: null })} />
          <ImportTransactionButton
            expenses={currentBudget.expenses || []}
            incomes={currentBudget.incomes || []}
            funds={funds}
            onTransactionAdded={loadBudget}
          />
        </>
      )}
    </Box>
  );
}

export default BudgetHome;