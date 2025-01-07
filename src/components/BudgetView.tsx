import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { Transaction } from '../models/Transaction';
import { BudgetExpense, ExpenseCategory, BudgetIncome } from '../models/Budget';
import BudgetSummary from './BudgetSummary';
import TransactionHistory from './TransactionHistory';
import TransactionImport from './TransactionImport';
import ExpenseDetail from './ExpenseDetail';
import { createTransaction, deleteTransaction } from '../services/transactionService';

interface BudgetViewProps {
  expenses: BudgetExpense[];
  transactions: Transaction[];
  importedTransactions: Transaction[];
  setImportedTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  categories: ExpenseCategory[];
  incomes: BudgetIncome[];
  onImportTransaction: (transaction: Transaction, importedId?: string) => void;
  onDeleteTransaction: (transactionId: string) => void;
  selectedExpense?: BudgetExpense | null;
  onExpenseDetailClose?: () => void;
  onExpenseClick?: (expense: BudgetExpense) => void;
}

type TabValue = 'summary' | 'transactions' | 'import';

function BudgetView({ 
  expenses = [], 
  transactions = [],
  importedTransactions = [],
  setImportedTransactions,
  categories = [],
  incomes = [],
  onImportTransaction,
  onDeleteTransaction,
  selectedExpense,
  onExpenseDetailClose = () => {},
  onExpenseClick
}: BudgetViewProps) {
  const [currentTab, setCurrentTab] = useState<TabValue>('summary');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setCurrentTab(newValue);
  };

  const handleImportTransaction = async (transaction: Transaction, importedId?: string) => {
    try {
      const newTransaction = await createTransaction(transaction);
      onImportTransaction(newTransaction, importedId);
    } catch (error) {
      console.error('Error importing transaction:', error);
    }
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
        transactions={transactions.filter(t => t.expenseId === selectedExpense.id)}
        category={category}
        onClose={onExpenseDetailClose}
        onDeleteTransaction={handleDeleteTransaction}
      />
    );
  }

  return (
    <Box>
      <Tabs 
        value={currentTab} 
        onChange={handleTabChange}
        sx={{ 
          mb: 3,
          borderBottom: '1px solid',
          borderColor: 'divider'
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
        <Tab 
          label="Import Transactions" 
          value="import"
          sx={{ textTransform: 'none' }}
        />
      </Tabs>

      {currentTab === 'summary' && (
        <BudgetSummary
          expenses={expenses}
          transactions={transactions}
          incomes={incomes}
          categories={categories}
        />
      )}

      {currentTab === 'transactions' && (
        <TransactionHistory
          transactions={transactions}
          categories={categories}
          expenses={expenses}
          onDeleteTransaction={handleDeleteTransaction}
        />
      )}

      {currentTab === 'import' && (
        <TransactionImport
          onImportTransaction={handleImportTransaction}
          importedTransactions={importedTransactions}
          setImportedTransactions={setImportedTransactions}
          existingTransactions={transactions}
        />
      )}
    </Box>
  );
}

export default BudgetView; 