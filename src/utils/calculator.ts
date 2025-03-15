import { Budget, BudgetExpense, BudgetIncome } from '../models/Budget';

/**
 * Calculates the total amount spent for an expense
 * @param expense The budget expense object
 * @returns The total amount spent including regular and split transactions
 */
export const calculateExpenseSpent = (expense: BudgetExpense): number => {
  // Calculate total from regular transactions
  const transactionTotal = expense.transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
  
  // Calculate total from split transactions
  const splitTotal = expense.splitTransactions?.reduce((sum, t) => sum + t.splitAmount, 0) || 0;
  
  return transactionTotal + splitTotal;
};

/**
 * Calculates the remaining amount for an expense
 * @param expense The budget expense object
 * @returns The amount remaining (budgeted - spent)
 */
export const calculateExpenseRemaining = (expense: BudgetExpense): number => {
  const spent = calculateExpenseSpent(expense);
  return expense.amount - spent;
};

/**
 * Calculates the total amount spent for an income
 * @param income The budget income object
 * @returns The total amount spent including regular and split transactions
 */


export const calculateIncomeSpent = (income: BudgetIncome): number => {
  const transactionTotal = income.transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
  return transactionTotal;
};

/**
 * Calculates the remaining amount for an income
 * @param income The budget income object
 * @returns The amount remaining (budgeted - spent)
 */ 
export const calculateIncomeRemaining = (income: BudgetIncome): number => {
  const spent = calculateIncomeSpent(income);
  return income.amount - spent;
};  

export const calculateLeftToBudget = (budget: Budget): number => {
  const totalIncome = budget.incomes?.reduce((sum, income) => sum + income.amount, 0) || 0;
  const totalExpenses = budget.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

  return Math.round((totalIncome - totalExpenses) * 100) / 100;
};