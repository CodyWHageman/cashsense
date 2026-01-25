import { 
  writeBatch, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc 
} from 'firebase/firestore';
import { db } from './firebase';
import { BudgetExpense, BudgetExpenseCategoryAssociation } from '../models/Budget';

export const sequenceService = {
  async updateCategorySequence(budgetId: string, categorySequences: BudgetExpenseCategoryAssociation[]) {
    // 1. Fetch all budget_category links for this budget to map categoryId -> docId
    // We need this step because the input 'categorySequences' usually lacks the Firestore Document ID.
    const q = query(collection(db, 'budget_categories'), where('budgetId', '==', budgetId));
    const snapshot = await getDocs(q);
    
    // Map categoryId to the link Document Reference
    const linkMap = new Map<string, any>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      linkMap.set(data.categoryId, doc.ref);
    });

    const batch = writeBatch(db);
    let updateCount = 0;

    // 2. Queue updates
    for (const seq of categorySequences) {
      const ref = linkMap.get(seq.categoryId);
      if (ref) {
        batch.update(ref, { 
          sequenceNumber: seq.sequenceNumber,
          updatedAt: new Date()
        });
        updateCount++;
      }
    }

    if (updateCount > 0) {
      await batch.commit();
    }
  },

  async updateExpenseSequence(expenses: BudgetExpense[]) {
    const batch = writeBatch(db);
    
    expenses.forEach(expense => {
      // We assume the expense exists, so we just update the sequence
      const ref = doc(db, 'budget_expenses', expense.id);
      batch.update(ref, { 
        sequenceNumber: expense.sequenceNumber,
        updatedAt: new Date()
      });
    });

    await batch.commit();
  }
};