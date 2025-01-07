import React, { useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Stack } from '@mui/material';
import { ResponsivePie } from '@nivo/pie';
import { Transaction } from '../models/Transaction';
import { BudgetExpense } from '../models/Budget';

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
  transactions: Transaction[];
  incomes: Array<{
    id: string;
    amount: number;
  }>;
  categories: Category[];
}

function BudgetSummary({ 
  expenses = [], 
  transactions = [], 
  incomes = [], 
  categories = []
}: BudgetSummaryProps) {
  const [currentTab, setCurrentTab] = useState<'planned' | 'spent' | 'remaining'>('planned');
  const totalIncome = (incomes || []).reduce((sum, income) => sum + income.amount, 0);
  
  // Calculate totals by category
  const categoryTotals = (categories || []).map(category => {
    const categoryExpenses = (expenses || []).filter(e => e.categoryId === category.id);
    const planned = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const spent = (transactions || [])
      .filter(t => categoryExpenses.some(e => e.id === t.expenseId))
      .reduce((sum, t) => sum + t.amount, 0);
    const remaining = planned - spent;
    const percentage = planned > 0 ? Math.round((spent / planned) * 100) : 0;

    return {
      id: category.name,
      label: category.name,
      value: currentTab === 'planned' ? planned : currentTab === 'spent' ? spent : remaining,
      color: category.color,
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

  const getDisplayValue = () => {
    switch (currentTab) {
      case 'planned':
        return totalIncome;
      case 'spent':
        return transactions.reduce((sum, t) => sum + t.amount, 0);
      case 'remaining':
        return totalIncome - transactions.reduce((sum, t) => sum + t.amount, 0);
      default:
        return 0;
    }
  };

  return (
    <Box>
      {/* Tab Buttons */}
      <Stack 
        direction="row" 
        spacing={1} 
        sx={{ mb: 3 }}
        justifyContent="center"
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
              px: 2,
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

      {/* Income/Spent/Remaining Display */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: 4,
        position: 'relative',
        height: 300
      }}>
        {pieData.length > 0 ? (
          <ResponsivePie
            data={pieData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            innerRadius={0.6}
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
          <Typography variant="h6" color="text.secondary">
            {currentTab.toUpperCase()}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            ${getDisplayValue().toFixed(2)}
          </Typography>
        </Box>
      </Box>

      {/* Categories Table */}
      <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
        <Table>
          <TableBody>
            {categoryTotals.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '2px',
                        bgcolor: category.color,
                        mr: 1
                      }}
                    />
                    <Typography sx={{ color: category.color }}>
                      {category.id}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  ${Math.abs(currentTab === 'planned' ? category.planned : 
                           currentTab === 'spent' ? category.spent : 
                           category.remaining).toFixed(2)}
                  {currentTab === 'planned' && (
                    <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
                      ({Math.round((category.planned / totalIncome) * 100)}%)
                    </Typography>
                  )}
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