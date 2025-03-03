import { supabase } from './supabase';
import { BudgetExpense, BudgetExpenseCategoryAssociation } from '../models/Budget';

export const sequenceService = {
  async updateCategorySequence(budgetId: string, categorySequences: BudgetExpenseCategoryAssociation[]) {
    // Create a single upsert with all records
    const { data, error } = await supabase
      .from('budget_categories')
      .upsert(
        categorySequences.map(seq => ({
          budget_id: budgetId,
          category_id: seq.categoryId,
          sequence_number: seq.sequenceNumber
        })),
        { 
          onConflict: 'budget_id,category_id',
          ignoreDuplicates: false 
        }
      );
    
    if (error) throw error;
    return data;
  },

  async updateExpenseSequence(expenses: BudgetExpense[]) {
    // Include all required fields to prevent null constraint violations
    const { data, error } = await supabase
      .from('budget_expenses')
      .upsert(
        expenses.map(expense => ({
          id: expense.id,
          budget_id: expense.budgetId,
          category_id: expense.categoryId,
          sequence_number: expense.sequenceNumber,
          name: expense.name,
          amount: expense.amount
        })),
        { 
          onConflict: 'id'
        }
      );
    
    if (error) throw error;
    return data;
  }
}; 