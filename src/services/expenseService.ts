import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { BudgetExpense, BudgetExpenseCreateDTO, BudgetExpenseUpdateDTO } from '../models/Budget';
import { createFundTransaction } from './fundService';

// --- Helper: Remove undefined keys ---
const sanitizeData = (data: any) => {
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (value === undefined) {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {} as any);
};

const mapExpense = (doc: any): BudgetExpense => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    amount: data.amount,
    dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : data.dueDate ? new Date(data.dueDate) : null,
    categoryId: data.categoryId,
    fundId: data.fundId,
    budgetId: data.budgetId,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    sequenceNumber: data.sequenceNumber,
    transactions: [] 
  };
};

export const createExpense = async (expense: BudgetExpenseCreateDTO): Promise<BudgetExpense> => {
  const cleanExpense = sanitizeData(expense);
  
  const docRef = await addDoc(collection(db, 'budget_expenses'), {
    ...cleanExpense,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return {
    id: docRef.id,
    ...expense,
    createdAt: new Date(),
    updatedAt: new Date(),
    transactions: []
  };
};

export const createExpenses = async (expenses: BudgetExpenseCreateDTO[]): Promise<BudgetExpense[]> => {
  const batch = writeBatch(db);
  const results: BudgetExpense[] = [];

  expenses.forEach(exp => {
    const cleanExp = sanitizeData(exp);
    const ref = doc(collection(db, 'budget_expenses'));
    batch.set(ref, {
      ...cleanExp,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    results.push({ id: ref.id, ...exp } as any);
  });

  await batch.commit();
  return results;
};

export const updateExpense = async (id: string, updates: BudgetExpenseUpdateDTO): Promise<Partial<BudgetExpense>> => {
  const ref = doc(db, 'budget_expenses', id);
  
  const cleanUpdates = sanitizeData(updates);
  const timestampedUpdates = {
    ...cleanUpdates,
    updatedAt: new Date()
  };

  await updateDoc(ref, timestampedUpdates);
  
  return { id, ...timestampedUpdates };
};

export const deleteExpense = async (id: string): Promise<void> => {
  const batch = writeBatch(db);

  // 1. Delete the expense document
  const expenseRef = doc(db, 'budget_expenses', id);
  batch.delete(expenseRef);

  // 2. Delete linked standard transactions
  const transQ = query(collection(db, 'transactions'), where('expenseId', '==', id));
  const transSnap = await getDocs(transQ);
  transSnap.forEach(doc => {
    batch.delete(doc.ref);
  });

  // 3. Delete linked split transactions
  const splitQ = query(collection(db, 'split_transactions'), where('expenseId', '==', id));
  const splitSnap = await getDocs(splitQ);
  splitSnap.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
};
export const getBudgetExpenses = async (budgetId: string): Promise<BudgetExpense[]> => {
  const q = query(collection(db, 'budget_expenses'), where('budgetId', '==', budgetId));
  const snap = await getDocs(q);
  return snap.docs.map(mapExpense);
};

export const addTransactionToExpense = async (expenseId: string, transactionId: string): Promise<void> => {
  const expenseRef = doc(db, 'budget_expenses', expenseId);
  const expenseSnap = await getDoc(expenseRef);
  
  if (!expenseSnap.exists()) throw new Error("Expense not found");
  const expenseData = expenseSnap.data();

  const transRef = doc(db, 'transactions', transactionId);
  await updateDoc(transRef, { expenseId: expenseId });

  if (expenseData.fundId) {
    await createFundTransaction(expenseData.fundId, transactionId, 'deposit');
  }
};

export const updateExpenses = async (expenses: BudgetExpense[]): Promise<BudgetExpense[]> => {
  const batch = writeBatch(db);
  expenses.forEach(exp => {
    const ref = doc(db, 'budget_expenses', exp.id);
    
    batch.update(ref, {
      name: exp.name,
      amount: exp.amount,
      dueDate: exp.dueDate,
      fundId: exp.fundId ?? null,
      updatedAt: new Date(),
      sequenceNumber: exp.sequenceNumber
    });
  });
  
  await batch.commit();
  return expenses;
};