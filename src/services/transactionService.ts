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

// --- Mappers ---

export const mapTransaction = (doc: any, splits: SplitTransaction[] = []): Transaction => {
  const data = doc.data();
  // Map base fields
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
    parentTransaction: parentTransaction || {} as any, // Often loaded separately
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
  
  const docRef = await addDoc(collection(db, 'transactions'), {
    ...absTransaction,
    userId: auth.currentUser?.uid, // Architectural note: Always tag data with userId for security rules
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Return mapped object (we construct it manually to save a fetch)
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
    const ref = doc(collection(db, 'transactions')); // Generate ID client-side
    batch.set(ref, {
      ...absT,
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
  // Migration Note: Instead of joining via expense_id, we should ideally query by Date Range 
  // or store budgetId on the transaction. 
  // For now, assuming we want transactions for the *User* within a reasonable timeframe, 
  // or we can rely on the budgetService to pass us the loaded transactions.
  
  // If this function is called strictly to get transactions *linked* to a budget, 
  // we first need the budget's expenses/incomes.
  // This is expensive in NoSQL without denormalization.
  // STRATEGY: Fetch all user transactions, then filter in memory (if dataset < 2000 items).
  // Otherwise, we need to pass a date range here.
  
  // Fallback: Return empty and let the BudgetPage context handle data loading via budgetService.
  console.warn("getBudgetTransactions in Firebase should utilize date-range queries via budgetService");
  return []; 
};

// New Helper: Get transactions by IDs (used by budgetService)
export const getTransactionsByIds = async (ids: string[]): Promise<Transaction[]> => {
  if (!ids.length) return [];
  // Chunking handled by caller or basic check
  const q = query(collection(db, 'transactions'), where(documentId(), 'in', ids));
  const snap = await getDocs(q);
  return snap.docs.map(d => mapTransaction(d));
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<Transaction> => {
  const ref = doc(db, 'transactions', id);
  await updateDoc(ref, {
    ...updates,
    updatedAt: new Date()
  });
  return { id, ...updates } as Transaction; // Optimistic return
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'transactions', id));
};

export const checkExistingHashIds = async (hashIds: string[]): Promise<string[]> => {
  // Firestore "IN" limit is 30. If importing 100s, this needs chunking.
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
    // 1. Get Parent Reference
    const parentRef = doc(db, 'transactions', transactionSplit.parentTransactionId);
    
    // 2. Create Split Docs
    const createdSplits: SplitTransaction[] = [];
    
    for (const split of transactionSplit.splits) {
      const splitRef = doc(collection(db, 'split_transactions'));
      const splitData = {
        parentTransactionId: transactionSplit.parentTransactionId,
        splitAmount: split.amount,
        expenseId: split.expenseId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      transaction.set(splitRef, splitData);
      
      createdSplits.push({
        id: splitRef.id,
        ...splitData,
        parentTransaction: {} as any // Placeholder
      });
    }

    // 3. Update Parent
    transaction.update(parentRef, {
      expenseId: null,
      incomeId: null,
      isSplit: true,
      updatedAt: new Date()
    });

    // 4. Return result (we must manually construct the return object as the transaction doesn't return data)
    // We need to fetch the parent to be sure, or just optimistically construct it.
    const parentSnap = await transaction.get(parentRef);
    return mapTransaction(parentSnap, createdSplits);
  });
};