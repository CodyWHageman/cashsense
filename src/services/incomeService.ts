import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { BudgetIncome, BudgetIncomeCreateDTO } from '../models/Budget';

const mapIncome = (doc: any): BudgetIncome => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    amount: data.amount,
    frequency: data.frequency,
    expectedDate: data.expectedDate instanceof Timestamp ? data.expectedDate.toDate() : data.expectedDate ? new Date(data.expectedDate) : null,
    budgetId: data.budgetId,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    transactions: []
  };
};

export const createIncome = async (income: BudgetIncomeCreateDTO): Promise<BudgetIncome> => {
  const docRef = await addDoc(collection(db, 'budget_incomes'), {
    ...income,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return { id: docRef.id, ...income, createdAt: new Date(), updatedAt: new Date() } as any;
};

export const createIncomes = async (incomes: BudgetIncomeCreateDTO[]): Promise<BudgetIncome[]> => {
  const batch = writeBatch(db);
  const results: BudgetIncome[] = [];

  incomes.forEach(inc => {
    const ref = doc(collection(db, 'budget_incomes'));
    batch.set(ref, {
      ...inc,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    results.push({ id: ref.id, ...inc } as any);
  });

  await batch.commit();
  return results;
};

export const getBudgetIncomes = async (budgetId: string): Promise<BudgetIncome[]> => {
  const q = query(collection(db, 'budget_incomes'), where('budgetId', '==', budgetId));
  const snap = await getDocs(q);
  return snap.docs.map(mapIncome);
};

export const updateIncome = async (id: string, updates: Partial<BudgetIncome>): Promise<BudgetIncome> => {
  const ref = doc(db, 'budget_incomes', id);
  await updateDoc(ref, {
    ...updates,
    updatedAt: new Date()
  });
  return { id, ...updates } as any;
};

export const deleteIncome = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'budget_incomes', id));
};

export const updateIncomes = async (incomes: BudgetIncome[]): Promise<BudgetIncome[]> => {
  const batch = writeBatch(db);
  incomes.forEach(inc => {
    const ref = doc(db, 'budget_incomes', inc.id);
    batch.update(ref, {
      name: inc.name,
      amount: inc.amount,
      frequency: inc.frequency,
      expectedDate: inc.expectedDate,
      updatedAt: new Date()
    });
  });
  
  await batch.commit();
  return incomes;
};