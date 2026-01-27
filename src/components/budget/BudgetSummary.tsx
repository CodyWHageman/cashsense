import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableRow, 
  Paper, 
  Stack,
  LinearProgress,
  Tabs,
  Tab,
  useTheme,
  Card,
  CardContent
} from '@mui/material';
import { ResponsivePie } from '@nivo/pie';
import { BudgetExpense, BudgetIncome, BudgetCategory } from '../../models/Budget';
import { useResponsive } from '../../hooks/useResponsive';

interface BudgetSummaryProps {
  expenses: BudgetExpense[];
  incomes: BudgetIncome[];
  budgetCategories: BudgetCategory[];
}

function BudgetSummary({ 
  expenses = [], 
  incomes = [], 
  budgetCategories = []
}: BudgetSummaryProps) {
  const { isSmallScreen } = useResponsive();
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0); // 0: Planned, 1: Spent, 2: Remaining
  
  const tabMap = ['planned', 'spent', 'remaining'];
  const activeMode = tabMap[currentTab];

  const totalIncome = (incomes || []).reduce((sum, income) => sum + income.amount, 0);
  
  // --- CALCULATION LOGIC ---
  const categoryTotals = (budgetCategories || []).map(budgetCategory => {
    const categoryExpenses = (expenses || []).filter(e => e.categoryId === budgetCategory.category.id);
    
    const planned = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const spent = categoryExpenses.reduce((sum, expense) => {
      const transactionTotal = (expense.transactions || []).reduce((tSum, t) => tSum + t.amount, 0);
      const splitTotal = (expense.splitTransactions || []).reduce((tSum, t) => tSum + t.splitAmount, 0);
      return sum + transactionTotal + splitTotal;
    }, 0);

    const remaining = planned - spent;
    const percentage = planned > 0 ? Math.round((spent / planned) * 100) : 0;

    // Determine value to show based on active tab
    let displayValue = 0;
    if (activeMode === 'planned') displayValue = planned;
    else if (activeMode === 'spent') displayValue = spent;
    else displayValue = remaining;

    return {
      id: budgetCategory.category.name,
      label: budgetCategory.category.name,
      value: displayValue, // Nivo uses this
      color: budgetCategory.category.color,
      planned,
      spent,
      remaining,
      percentage
    };
  });

  // Filter out zero values for the chart to prevent clutter/rendering issues
  // For 'remaining', we might have negative numbers (over budget), Nivo doesn't like negatives in Pie.
  // We will show absolute values for visual representation but keep the sign in text.
  const pieData = categoryTotals
    .filter(cat => Math.abs(cat.value) > 0)
    .map(cat => ({
      id: cat.id,
      label: cat.label,
      value: Math.abs(cat.value), // Ensure positive for chart slice sizing
      color: cat.color,
      formattedValue: cat.value // Keep original for display
    }));

  const totalPlanned = categoryTotals.reduce((sum, cat) => sum + cat.planned, 0);
  const totalSpent = categoryTotals.reduce((sum, cat) => sum + cat.spent, 0);
  const totalRemaining = totalPlanned - totalSpent;

  const getDisplayTotal = () => {
    switch (activeMode) {
      case 'planned': return totalPlanned;
      case 'spent': return totalSpent;
      case 'remaining': return totalRemaining;
      default: return 0;
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      {/* 1. CONTROLS */}
      <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }} elevation={isSmallScreen ? 2 : 1}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          variant="fullWidth" 
          indicatorColor="primary"
          textColor="primary"
          sx={{ bgcolor: 'background.paper' }}
        >
          <Tab label="Planned" />
          <Tab label="Spent" />
          <Tab label="Remaining" />
        </Tabs>
      </Paper>

      {/* 2. CHART SECTION */}
      <Box sx={{ 
        position: 'relative', 
        height: isSmallScreen ? 280 : 320, 
        mb: 4,
        display: 'flex',
        justifyContent: 'center'
      }}>
        {pieData.length > 0 ? (
          <>
            <ResponsivePie
              data={pieData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              innerRadius={0.7} // Thinner donut for cleaner look
              padAngle={1}
              cornerRadius={4}
              activeOuterRadiusOffset={8}
              colors={d => d.data.color}
              borderWidth={0}
              enableArcLinkLabels={!isSmallScreen} // Hide messy link lines on mobile
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor={theme.palette.text.primary}
              enableArcLabels={false} // Clean look
              animate={true}
              tooltip={({ datum }) => (
                <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: datum.color }} />
                  <Typography variant="body2">
                    {datum.label}: <strong>${datum.data.formattedValue.toFixed(2)}</strong>
                  </Typography>
                </Paper>
              )}
            />
            {/* Center Text Overlay */}
            <Box sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              textAlign: 'center', 
              pointerEvents: 'none',
              width: '60%' // Prevent text from hitting ring
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                TOTAL {activeMode}
              </Typography>
              <Typography 
                variant={isSmallScreen ? "h4" : "h3"} 
                fontWeight="800"
                color={activeMode === 'remaining' && totalRemaining < 0 ? 'error.main' : 'text.primary'}
                sx={{ 
                    // Responsive font sizing if numbers get huge
                    fontSize: isSmallScreen && getDisplayTotal() > 10000 ? '1.75rem' : undefined 
                }}
              >
                ${getDisplayTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', flexDirection: 'column', opacity: 0.5 }}>
            <Box sx={{ width: 120, height: 120, borderRadius: '50%', border: '4px dashed #ccc', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">No data to display</Typography>
          </Box>
        )}
      </Box>

      {/* 3. DATA LIST SECTION */}
      {isSmallScreen ? (
        // --- MOBILE CARD LIST ---
        <Stack spacing={2}>
            {categoryTotals.sort((a,b) => b.value - a.value).map((cat) => (
                <Card 
                    key={cat.id} 
                    variant="outlined" 
                    sx={{ 
                        borderColor: 'divider',
                        // Highlight negative remaining if that's the view
                        bgcolor: activeMode === 'remaining' && cat.value < 0 ? 'error.lighter' : 'background.paper'
                    }}
                >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        {/* Header: Name + Big Value */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: cat.color }} />
                                <Typography variant="subtitle1" fontWeight={600}>
                                    {cat.label}
                                </Typography>
                            </Box>
                            <Typography 
                                variant="h6" 
                                fontWeight={700}
                                color={activeMode === 'remaining' && cat.value < 0 ? 'error.main' : 'text.primary'}
                            >
                                ${cat.value.toFixed(2)}
                            </Typography>
                        </Box>

                        {/* Context: Progress Bar */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ flexGrow: 1 }}>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={Math.min(cat.percentage, 100)} 
                                    color={cat.remaining < 0 ? "error" : "primary"}
                                    sx={{ height: 6, borderRadius: 3 }}
                                />
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 35, textAlign: 'right' }}>
                                {cat.percentage}%
                            </Typography>
                        </Box>
                        
                        {/* Subtext Context */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Planned: ${cat.planned.toFixed(0)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Spent: ${cat.spent.toFixed(0)}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            ))}
        </Stack>
      ) : (
        // --- DESKTOP TABLE ---
        <TableContainer component={Paper} sx={{ boxShadow: 'none', maxHeight: 400, overflow: 'auto' }}>
          <Table stickyHeader>
            <TableBody>
              {categoryTotals.map((category) => (
                <TableRow key={category.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: 2, bgcolor: category.color }} />
                      <Typography variant="body1" fontWeight={500}>{category.id}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" fontWeight={500}>
                      ${category.value.toFixed(2)}
                      {activeMode === 'planned' && (
                         <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                           ({Math.round((category.planned / totalIncome) * 100)}%)
                         </Typography>
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" width="30%">
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                            variant="determinate" 
                            value={Math.min(category.percentage, 100)} 
                            sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                            color={category.remaining < 0 ? 'error' : 'primary'}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40, textAlign: 'right' }}>
                            {category.percentage}%
                        </Typography>
                     </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default BudgetSummary;