import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  LinearProgress, 
  IconButton, 
  Card, 
  CardContent, 
  Stack,
  Chip,
  Button
} from '@mui/material';
import { 
  SavingsTwoTone, 
  TrendingUp, 
  TrendingDown, 
  ArrowForward, 
  WarningAmber 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBudget } from '../../contexts/BudgetContext';
import { useFund } from '../../contexts/FundContext';
import { calculateFundBalance } from '../../utils/fundUtils';
import { calculateLeftToBudget } from '../../utils/calculator';
import { useResponsive } from '../../hooks/useResponsive';

function DashboardPage() {
  const { user } = useAuth();
  const { currentBudget, loading: budgetLoading } = useBudget();
  const { funds, loading: fundsLoading } = useFund();
  const { isSmallScreen } = useResponsive();
  const navigate = useNavigate();

  // --- 1. FILTER FAVORITES ---
  const pinnedFunds = funds.filter(f => f.isFavorite);
  const pinnedExpenses = currentBudget?.expenses?.filter(e => e.isFavorite) || [];
  const pinnedIncomes = currentBudget?.incomes?.filter(i => i.isFavorite) || [];

  // --- 2. CALCULATE HEADER STATS ---
  const leftToBudget = currentBudget ? calculateLeftToBudget(currentBudget) : 0;
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const displayName = user?.displayName?.split(' ')[0] || 'User';

  if (budgetLoading || fundsLoading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ p: isSmallScreen ? 2 : 4, maxWidth: '1000px', margin: '0 auto', mb: 8 }}>
      
      {/* HEADER SECTION */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.secondary">
            {getGreeting()},
          </Typography>
          <Typography variant={isSmallScreen ? "h3" : "h2"} fontWeight={800} color="primary.main">
            {displayName}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
           <Typography variant="caption" color="text.secondary">LEFT TO BUDGET</Typography>
           <Typography 
             variant="h5" 
             fontWeight={700}
             color={leftToBudget < 0 ? 'error.main' : 'success.main'}
           >
             ${leftToBudget.toFixed(2)}
           </Typography>
        </Box>
      </Box>

      {/* PINNED FUNDS (Horizontal Scroll) */}
      {pinnedFunds.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Savings Watch</Typography>
            <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/funds')}>
                All Funds
            </Button>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            overflowX: 'auto', 
            pb: 1,
            mx: isSmallScreen ? -2 : 0, // Negative margin to bleed to edge on mobile
            px: isSmallScreen ? 2 : 0,  // Padding to restore content alignment
            '::-webkit-scrollbar': { display: 'none' } // Hide scrollbar for cleaner look
          }}>
            {pinnedFunds.map(fund => {
              const { balance } = calculateFundBalance(fund);
              const progress = Math.min((balance / fund.targetAmount) * 100, 100);
              
              return (
                <Paper 
                  key={fund.id}
                  variant="outlined"
                  sx={{ 
                    minWidth: 200, 
                    maxWidth: 200,
                    p: 2,
                    borderRadius: 3,
                    flexShrink: 0,
                    bgcolor: 'background.paper',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate('/funds')} // Could deep link later
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <SavingsTwoTone color="primary" />
                    {balance >= fund.targetAmount && (
                        <Chip label="Done" size="small" color="success" sx={{ height: 20, fontSize: '0.6rem' }} />
                    )}
                  </Box>
                  <Typography variant="subtitle2" noWrap fontWeight={600}>{fund.name}</Typography>
                  <Typography variant="h6" fontWeight={700}>${balance.toLocaleString()}</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ mt: 1, height: 6, borderRadius: 3 }} 
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {Math.round(progress)}% of ${fund.targetAmount.toLocaleString()}
                  </Typography>
                </Paper>
              );
            })}
          </Box>
        </Box>
      )}

      {/* WATCHLIST (Expenses & Incomes) */}
      {(pinnedExpenses.length > 0 || pinnedIncomes.length > 0) && (
         <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={700}>Budget Watchlist</Typography>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/budget')}>
                    Full Budget
                </Button>
            </Box>

            <Stack spacing={2}>
                {/* Incomes */}
                {pinnedIncomes.map(income => {
                    const received = income.transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
                    return (
                        <Card key={income.id} variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'success.lighter', color: 'success.main' }}>
                                    <TrendingUp />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" fontWeight={600}>{income.name}</Typography>
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={Math.min((received / income.amount) * 100, 100)} 
                                        color="success"
                                        sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                                    />
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2" fontWeight={700} color="success.main">
                                        +${received.toFixed(0)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        of ${income.amount.toFixed(0)}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Expenses */}
                {pinnedExpenses.map(expense => {
                    const spent = (expense.transactions?.reduce((sum, t) => sum + t.amount, 0) || 0) +
                                  (expense.splitTransactions?.reduce((sum, t) => sum + t.splitAmount, 0) || 0);
                    const remaining = expense.amount - spent;
                    const percent = (spent / expense.amount) * 100;
                    const isOver = remaining < 0;

                    return (
                        <Card 
                            key={expense.id} 
                            variant="outlined" 
                            sx={{ 
                                borderRadius: 2,
                                borderColor: isOver ? 'error.light' : 'divider',
                                bgcolor: isOver ? 'error.lighter' : 'background.paper'
                            }}
                        >
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ 
                                    p: 1, 
                                    borderRadius: '50%', 
                                    bgcolor: isOver ? 'error.main' : 'primary.lighter', 
                                    color: isOver ? 'white' : 'primary.main' 
                                }}>
                                    {isOver ? <WarningAmber /> : <TrendingDown />}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle2" fontWeight={600}>{expense.name}</Typography>
                                        <Typography 
                                            variant="caption" 
                                            fontWeight={600}
                                            color={isOver ? 'error.main' : 'text.secondary'}
                                        >
                                            {isOver ? 'OVER BUDGET' : `$${remaining.toFixed(2)} left`}
                                        </Typography>
                                    </Box>
                                    
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={Math.min(percent, 100)} 
                                        color={isOver ? 'error' : 'primary'}
                                        sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })}
            </Stack>
         </Box>
      )}

      {/* EMPTY STATE */}
      {pinnedFunds.length === 0 && pinnedExpenses.length === 0 && pinnedIncomes.length === 0 && (
          <Paper 
            sx={{ 
                p: 4, 
                textAlign: 'center', 
                borderStyle: 'dashed', 
                borderColor: 'divider', 
                bgcolor: 'transparent' 
            }}
          >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                  Your Dashboard is Empty
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Pin your favorite Funds, Incomes, or Expenses to see them here for quick access.
              </Typography>
              <Button variant="contained" onClick={() => navigate('/budget')}>
                  Go to Budget
              </Button>
          </Paper>
      )}

    </Box>
  );
}

export default DashboardPage;