import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import { Transaction } from '../models/Transaction';
import { BudgetExpense, ExpenseCategory, BudgetIncome } from '../models/Budget';
import BudgetSummary from './BudgetSummary';
import TransactionHistory from './TransactionHistory';
import ExpenseDetail from './ExpenseDetail';
import { deleteTransaction } from '../services/transactionService';

interface BudgetViewProps {
  expenses: BudgetExpense[];
  transactions: Transaction[];
  categories: ExpenseCategory[];
  incomes: BudgetIncome[];
  onDeleteTransaction: (transactionId: string) => void;
  selectedExpense?: BudgetExpense | null;
  onExpenseDetailClose?: () => void;
  onExpenseClick?: (expense: BudgetExpense) => void;
  onExpenseUpdate?: (updatedExpense: BudgetExpense) => void;
}

type TabValue = 'summary' | 'transactions';

function BudgetView({ 
  expenses = [], 
  categories = [],
  incomes = [],
  onDeleteTransaction,
  selectedExpense,
  onExpenseDetailClose = () => {},
  onExpenseUpdate = () => {}
}: BudgetViewProps) {
  const [currentTab, setCurrentTab] = useState<TabValue>('summary');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setCurrentTab(newValue);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
      onDeleteTransaction(transactionId);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  if (selectedExpense) {
    const category = categories.find(c => c.id === selectedExpense.categoryId);
    return (
      <ExpenseDetail
        expense={selectedExpense}
        category={category}
        onClose={onExpenseDetailClose}
        onDeleteTransaction={handleDeleteTransaction}
        onExpenseUpdate={onExpenseUpdate}
      />
    );
  }

  return (
    <Box sx={{ 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Paper className="budget-section" sx={{ flex: 1, overflowY: 'auto' }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          sx={{ 
            mb: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            position: 'sticky',
            top: 0,
            bgcolor: 'background.paper',
            zIndex: 1
          }}
        >
          <Tab 
            label="Summary" 
            value="summary"
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            label="Transactions" 
            value="transactions"
            sx={{ textTransform: 'none' }}
          />
        </Tabs>

        <Box sx={{ px: 2, pb: 2 }}>
          {currentTab === 'summary' && (
            <BudgetSummary
              expenses={expenses}
              incomes={incomes}
              categories={categories}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionHistory
              expenses={expenses}
              incomes={incomes}
              categories={categories}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default BudgetView; 