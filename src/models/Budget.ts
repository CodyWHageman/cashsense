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

export interface BudgetCreateDTO {
  month: number;
  year: number;
  userId: string;
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

export interface BudgetExpenseCreateDTO {
  name: string;
  amount: number;
  budgetId: string;
  categoryId: string;
  dueDate: Date | null;
  fundId?: string | null;
  sequenceNumber: number;
}

export interface BudgetExpenseUpdateDTO {
  name: string;
  amount: number;
  dueDate: Date | null;
  fundId?: string | null;
  sequenceNumber: number;
}

export interface BudgetIncome {
  id: string;
  budgetId: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'bi-weekly';
  expectedDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  transactions?: Transaction[];
}

export interface BudgetIncomeCreateDTO {
  name: string;
  amount: number;
  budgetId: string;
  frequency: 'monthly' | 'weekly' | 'bi-weekly';
  expectedDate: Date | null;
}

export interface BudgetIncomeUpdateDTO {
  name: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'bi-weekly';
  expectedDate: Date | null;
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