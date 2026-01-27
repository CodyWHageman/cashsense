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

const sanitizeData = (data: any) => {
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (value === undefined) return acc;
    acc[key] = value;
    return acc;
  }, {} as any);
};

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
    transactions: [],
    isFavorite: data.isFavorite || false,
  };
};

export const createIncome = async (income: BudgetIncomeCreateDTO): Promise<BudgetIncome> => {
  const cleanIncome = sanitizeData(income);
  const docRef = await addDoc(collection(db, 'budget_incomes'), {
    ...cleanIncome,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return { id: docRef.id, ...income, createdAt: new Date(), updatedAt: new Date() } as any;
};

export const createIncomes = async (incomes: BudgetIncomeCreateDTO[]): Promise<BudgetIncome[]> => {
  const batch = writeBatch(db);
  const results: BudgetIncome[] = [];

  incomes.forEach(inc => {
    const cleanInc = sanitizeData(inc);
    const ref = doc(collection(db, 'budget_incomes'));
    batch.set(ref, {
      ...cleanInc,
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

export const updateIncome = async (id: string, updates: Partial<BudgetIncome>): Promise<Partial<BudgetIncome>> => {
  const ref = doc(db, 'budget_incomes', id);
  const { id: _id, transactions: _transactions, ...rest } = updates;
  
  const cleanUpdates = sanitizeData(rest);
  const timestampedUpdates = {
    ...cleanUpdates,
    updatedAt: new Date()
  };
  
  await updateDoc(ref, timestampedUpdates);
  
  return { id, ...timestampedUpdates };
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
      expectedDate: inc.expectedDate ?? null,
      updatedAt: new Date()
    });
  });
  
  await batch.commit();
  return incomes;
};