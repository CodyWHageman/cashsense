import { supabase } from './supabase';
import { BudgetExpense, BudgetExpenseCategoryAssociation } from '../models/Budget';

export const sequenceService = {
  async updateCategorySequence(budgetId: string, categorySequences: BudgetExpenseCategoryAssociation[]) {
    const { data, error } = await supabase
      .from('budget_categories')
      .upsert(
        categorySequences.map(seq => ({
          budget_id: budgetId,
          category_id: seq.categoryId,
          sequence_number: seq.sequenceNumber
        })),
        { onConflict: 'budget_id,category_id' }
      );

    if (error) throw error;
    return data;
  },

  async updateExpenseSequence(categoryId: string, expenses: BudgetExpense[]) {
    const { data, error } = await supabase
      .from('budget_expenses')
      .upsert(
        expenses.map(expense => ({
          id: expense.id,
          sequence_number: expense.sequenceNumber
        })),
        { onConflict: 'id' }
      );

    if (error) throw error;
    return data;
  }
}; 