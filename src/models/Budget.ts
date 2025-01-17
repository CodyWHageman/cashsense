import { FundTransaction, Transaction } from "./Transaction";

export interface Budget {
  id: string;
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  expenses?: BudgetExpense[];
  incomes?: BudgetIncome[];
  categories?: BudgetCategory[];
}

export interface BudgetExpense {
  id: string;
  budgetId: string;
  categoryId: string;
  name: string;
  amount: number;
  dueDate: Date | null;
  fundId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  sequenceNumber: number;
  transactions?: Transaction[];
}

export interface BudgetIncome {
  id: string;
  budgetId: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'bi-weekly';
  expectedDate: Date;
  createdAt: Date;
  updatedAt: Date;
  transactions?: Transaction[];
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  userId: string;
}

export interface BudgetCategory {
  id: string;
  budgetId: string;
  category: ExpenseCategory;
  createdAt: Date;
  updatedAt: Date;
  sequenceNumber: number;
}

export interface BudgetExpenseCategoryAssociation {
  budgetId: string;
  categoryId: string;
  sequenceNumber: number;
}

export interface Fund {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  fundTransactions?: FundTransaction[];
}