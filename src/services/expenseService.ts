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
  Timestamp,
  documentId 
} from 'firebase/firestore';
import { db } from './firebase';
import { BudgetExpense, BudgetExpenseCreateDTO, BudgetExpenseUpdateDTO } from '../models/Budget';
import { createFundTransaction } from './fundService';

// --- Helper: Remove undefined keys ---
const sanitizeData = (data: any) => {
  return Object.entries(data).reduce((acc, [key, value]) => {
    // If value is explicitly undefined, skip it. 
    // If it's null, we keep it (Firestore allows null).
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
  // Sanitize to ensure no 'undefined' fields (like fundId) are passed
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
    const ref = doc(collection(db, 'budget_expenses')); // Generate ID locally
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

export const updateExpense = async (id: string, updates: BudgetExpenseUpdateDTO): Promise<BudgetExpense> => {
  const ref = doc(db, 'budget_expenses', id);
  
  // Sanitize updates!
  const cleanUpdates = sanitizeData(updates);

  await updateDoc(ref, {
    ...cleanUpdates,
    updatedAt: new Date()
  });
  return { id, ...updates } as any;
};

export const deleteExpense = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'budget_expenses', id));
};

export const getBudgetExpenses = async (budgetId: string): Promise<BudgetExpense[]> => {
  const q = query(collection(db, 'budget_expenses'), where('budgetId', '==', budgetId));
  const snap = await getDocs(q);
  return snap.docs.map(mapExpense);
};

export const addTransactionToExpense = async (expenseId: string, transactionId: string): Promise<void> => {
  // 1. Get the expense to check for fund linkage
  const expenseRef = doc(db, 'budget_expenses', expenseId);
  const expenseSnap = await getDoc(expenseRef);
  
  if (!expenseSnap.exists()) throw new Error("Expense not found");
  const expenseData = expenseSnap.data();

  // 2. Update Transaction
  const transRef = doc(db, 'transactions', transactionId);
  await updateDoc(transRef, { expenseId: expenseId });

  // 3. Handle Fund Logic
  if (expenseData.fundId) {
    await createFundTransaction(expenseData.fundId, transactionId, 'deposit');
  }
};

export const updateExpenses = async (expenses: BudgetExpense[]): Promise<BudgetExpense[]> => {
  const batch = writeBatch(db);
  expenses.forEach(exp => {
    const ref = doc(db, 'budget_expenses', exp.id);
    
    // Explicitly select fields to update to avoid passing accidental undefineds from the object
    batch.update(ref, {
      name: exp.name,
      amount: exp.amount,
      dueDate: exp.dueDate,
      fundId: exp.fundId ?? null, // Ensure null if undefined
      updatedAt: new Date(),
      sequenceNumber: exp.sequenceNumber
    });
  });
  
  await batch.commit();
  return expenses;
};