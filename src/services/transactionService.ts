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
  runTransaction as firestoreRunTransaction,
  Timestamp,
  documentId
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { 
  ParentTransaction, 
  SplitTransaction, 
  Transaction, 
  TransactionCreateDTO, 
  TransactionSplitDTO 
} from '../models/Transaction';
import { generateHashId } from '../utils/transactionUtils';

// Helper: Remove undefined keys
const sanitizeData = (data: any) => {
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (value === undefined) return acc;
    acc[key] = value;
    return acc;
  }, {} as any);
};

// --- Mappers ---

export const mapTransaction = (doc: any, splits: SplitTransaction[] = []): Transaction => {
  const data = doc.data();
  const parent: ParentTransaction = {
    id: doc.id,
    hashId: data.hashId,
    amount: data.amount,
    date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
    description: data.description,
    expenseId: data.expenseId,
    incomeId: data.incomeId,
    isSplit: data.isSplit || false,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined
  };

  return {
    ...parent,
    splits: splits
  };
};

export const mapSplitTransaction = (doc: any, parentTransaction?: ParentTransaction): SplitTransaction => {
  const data = doc.data();
  return {
    id: doc.id,
    parentTransaction: parentTransaction || {} as any,
    splitAmount: data.splitAmount,
    expenseId: data.expenseId,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined
  };
};

// --- Service Methods ---

const ensureAbsoluteAmount = (transaction: TransactionCreateDTO): TransactionCreateDTO => {
  const absoluteAmount = Math.abs(transaction.amount);  
  const hashId = generateHashId(absoluteAmount, transaction.date, transaction.description);
  return {
    ...transaction,
    amount: absoluteAmount,
    hashId
  };
};

export const createTransaction = async (transaction: TransactionCreateDTO): Promise<Transaction> => {
  const absTransaction = ensureAbsoluteAmount(transaction);
  const cleanTransaction = sanitizeData(absTransaction);
  
  const docRef = await addDoc(collection(db, 'transactions'), {
    ...cleanTransaction,
    userId: auth.currentUser?.uid,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return {
    id: docRef.id,
    ...absTransaction,
    isSplit: false,
    splits: [],
    createdAt: new Date()
  } as Transaction;
};

export const createTransactions = async (transactions: TransactionCreateDTO[]): Promise<Transaction[]> => {
  const batch = writeBatch(db);
  const results: Transaction[] = [];

  transactions.forEach(t => {
    const absT = ensureAbsoluteAmount(t);
    const cleanT = sanitizeData(absT);
    const ref = doc(collection(db, 'transactions'));
    batch.set(ref, {
      ...cleanT,
      userId: auth.currentUser?.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    results.push({
      id: ref.id,
      ...absT,
      isSplit: false,
      splits: [],
      createdAt: new Date()
    } as Transaction);
  });

  await batch.commit();
  return results;
};

export const getBudgetTransactions = async (budgetId: string): Promise<Transaction[]> => {
  console.warn("getBudgetTransactions in Firebase should utilize date-range queries via budgetService");
  return []; 
};

export const getTransactionsByIds = async (ids: string[]): Promise<Transaction[]> => {
  if (!ids.length) return [];
  const q = query(collection(db, 'transactions'), where(documentId(), 'in', ids));
  const snap = await getDocs(q);
  return snap.docs.map(d => mapTransaction(d));
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<Transaction> => {
  const ref = doc(db, 'transactions', id);
  const cleanUpdates = sanitizeData(updates);
  await updateDoc(ref, {
    ...cleanUpdates,
    updatedAt: new Date()
  });
  return { id, ...updates } as Transaction;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'transactions', id));
};

export const checkExistingHashIds = async (hashIds: string[]): Promise<string[]> => {
  const chunks = [];
  for (let i = 0; i < hashIds.length; i += 30) {
    chunks.push(hashIds.slice(i, i + 30));
  }
  
  const existingHashes: string[] = [];
  
  for (const chunk of chunks) {
    const q = query(collection(db, 'transactions'), where('hashId', 'in', chunk));
    const snap = await getDocs(q);
    snap.forEach(d => existingHashes.push(d.data().hashId));
  }
  
  return existingHashes;
};

export const splitTransaction = async (transactionSplit: TransactionSplitDTO): Promise<Transaction> => {
  return await firestoreRunTransaction(db, async (transaction) => {
    const parentRef = doc(db, 'transactions', transactionSplit.parentTransactionId);
    
    const createdSplits: SplitTransaction[] = [];
    
    for (const split of transactionSplit.splits) {
      const splitRef = doc(collection(db, 'split_transactions'));
      const splitData = sanitizeData({
        parentTransactionId: transactionSplit.parentTransactionId,
        splitAmount: split.amount,
        expenseId: split.expenseId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      transaction.set(splitRef, splitData);
      
      createdSplits.push({
        id: splitRef.id,
        ...splitData,
        parentTransaction: {} as any 
      });
    }

    transaction.update(parentRef, {
      expenseId: null,
      incomeId: null,
      isSplit: true,
      updatedAt: new Date()
    });

    const parentSnap = await transaction.get(parentRef);
    return mapTransaction(parentSnap, createdSplits);
  });
};