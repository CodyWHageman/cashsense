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
  Button, 
  Stack,
  useTheme
} from '@mui/material';
import { ResponsivePie } from '@nivo/pie';
import { BudgetExpense, BudgetIncome, BudgetCategory } from '../../models/Budget';
import { useResponsive } from '../../hooks/useResponsive';

interface CategoryTotal {
  id: string;
  label: string;
  value: number;
  color: string;
  planned: number;
  spent: number;
  remaining: number;
  percentage: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

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
  const { isMobile } = useResponsive();
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState<'planned' | 'spent' | 'remaining'>('planned');
  const totalIncome = (incomes || []).reduce((sum, income) => sum + income.amount, 0);
  
  // Calculate totals by category
  const categoryTotals = (budgetCategories || []).map(budgetCategory => {
    // Get all expenses for this category
    const categoryExpenses = (expenses || []).filter(e => e.categoryId === budgetCategory.category.id);
    
    // Calculate planned amount (sum of all expense amounts in this category)
    const planned = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate spent amount (sum of all transactions for expenses in this category)
    const spent = categoryExpenses.reduce((sum, expense) => {
      const transactionTotal = (expense.transactions || []).reduce((tSum, t) => tSum + t.amount, 0);
      const splitTotal = (expense.splitTransactions || []).reduce((tSum, t) => tSum + t.splitAmount, 0);
      return sum + transactionTotal + splitTotal;
    }, 0);

    // Calculate remaining (planned - spent)
    const remaining = planned - spent;
    
    // Calculate percentage spent of planned
    const percentage = planned > 0 ? Math.round((spent / planned) * 100) : 0;

    return {
      id: budgetCategory.category.name,
      label: budgetCategory.category.name,
      value: currentTab === 'planned' ? planned : currentTab === 'spent' ? spent : remaining,
      color: budgetCategory.category.color,
      planned,
      spent,
      remaining,
      percentage
    };
  });

  // Prepare data for pie chart
  const pieData = categoryTotals
    .filter(cat => cat.value > 0)
    .map(cat => ({
      id: cat.id,
      label: cat.label,
      value: Math.abs(cat.value), // Use absolute value for the pie chart
      color: cat.color
    }));

  const tabs = [
    { id: 'planned' as const, label: 'PLANNED' },
    { id: 'spent' as const, label: 'SPENT' },
    { id: 'remaining' as const, label: 'REMAINING' }
  ];

  // Calculate totals for the center display
  const getDisplayValue = () => {
    const totalPlanned = categoryTotals.reduce((sum, cat) => sum + cat.planned, 0);
    const totalSpent = categoryTotals.reduce((sum, cat) => sum + cat.spent, 0);
    
    switch (currentTab) {
      case 'planned':
        return totalPlanned;
      case 'spent':
        return totalSpent;
      case 'remaining':
        return totalPlanned - totalSpent;
      default:
        return 0;
    }
  };

  return (
    <Box>
      {/* Tab Buttons - Adjusted for mobile */}
      <Stack 
        direction="row" 
        spacing={1} 
        sx={{ 
          mb: isMobile ? 2 : 3,
          justifyContent: "center",
          overflow: 'auto',
          px: isMobile ? 1 : 0
        }}
      >
        {tabs.map(tab => (
          <Button
            key={tab.id}
            variant="text"
            onClick={() => setCurrentTab(tab.id)}
            sx={{ 
              color: currentTab === tab.id ? 'primary.main' : 'text.secondary',
              borderBottom: currentTab === tab.id ? '2px solid' : 'none',
              borderColor: 'primary.main',
              borderRadius: 0,
              px: isMobile ? 1 : 2,
              minWidth: isMobile ? 'auto' : undefined,
              whiteSpace: 'nowrap',
              '&:hover': {
                backgroundColor: 'transparent',
                opacity: 0.8
              }
            }}
          >
            {tab.label}
          </Button>
        ))}
      </Stack>

      {/* Pie Chart - Adjusted height for mobile */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: isMobile ? 2 : 4,
        position: 'relative',
        height: isMobile ? 200 : 240
      }}>
        {pieData.length > 0 ? (
          <ResponsivePie
            data={pieData}
            margin={{ 
              top: isMobile ? 10 : 20, 
              right: isMobile ? 10 : 20, 
              bottom: isMobile ? 10 : 20, 
              left: isMobile ? 10 : 20 
            }}
            innerRadius={0.75}
            padAngle={0.5}
            cornerRadius={3}
            colors={d => d.data.color}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            enableArcLinkLabels={false}
            enableArcLabels={false}
            legends={[]}
          />
        ) : (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Typography color="text.secondary">No data to display</Typography>
          </Box>
        )}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 1
          }}
        >
          <Typography variant={isMobile ? 'body1' : 'h6'} color="text.secondary">
            {currentTab.toUpperCase()}
          </Typography>
          <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 'bold' }}>
            ${getDisplayValue().toFixed(2)}
          </Typography>
        </Box>
      </Box>

      {/* Categories Table - Mobile optimized */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          boxShadow: 'none',
          maxHeight: isMobile ? 'calc(100vh - 400px)' : undefined,
          overflow: 'auto'
        }}
      >
        <Table size={isMobile ? "small" : "medium"}>
          <TableBody>
            {categoryTotals.map((category) => (
              <TableRow 
                key={category.id}
                sx={{ 
                  '& .MuiTableCell-root': { 
                    py: isMobile ? 0.5 : 0.75,
                    borderBottom: 'none'
                  }
                }}
              >
                <TableCell>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: isMobile ? 0.5 : 1
                  }}>
                    <Box
                      sx={{
                        width: isMobile ? 8 : 10,
                        height: isMobile ? 8 : 10,
                        borderRadius: '2px',
                        bgcolor: category.color,
                      }}
                    />
                    <Typography variant={isMobile ? 'body2' : 'body1'} sx={{ color: category.color }}>
                      {category.id}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant={isMobile ? 'body2' : 'body1'}>
                    ${Math.abs(currentTab === 'planned' ? category.planned : 
                             currentTab === 'spent' ? category.spent : 
                             category.remaining).toFixed(2)}
                    {currentTab === 'planned' && (
                      <Typography 
                        component="span" 
                        variant={isMobile ? 'caption' : 'body2'} 
                        color="text.secondary" 
                        sx={{ ml: 1 }}
                      >
                        ({Math.round((category.planned / totalIncome) * 100)}%)
                      </Typography>
                    )}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default BudgetSummary; 