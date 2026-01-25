import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  writeBatch,
  Timestamp,
  orderBy,
  documentId // Added import
} from 'firebase/firestore';
import { db } from './firebase';
import { Fund } from '../models/Budget';
import { Transaction, FundTransaction, FundTransactionCreateDTO } from '../models/Transaction';
import { mapTransaction } from './transactionService';

const mapFundTransaction = (doc: any, transaction?: Transaction): FundTransaction => {
  const data = doc.data();
  return {
    id: doc.id,
    fundId: data.fundId,
    transactionId: data.transactionId,
    type: data.type,
    transferComplete: data.transferComplete,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    transaction: transaction,
    transferTransactionId: data.transferTransactionId
  };
};

const mapFund = (doc: any, transactions: FundTransaction[] = []): Fund => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    description: data.description,
    targetAmount: data.targetAmount,
    userId: data.userId,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    fundTransactions: transactions
  };
};

export const createFund = async (fund: Omit<Fund, 'id'>): Promise<Fund> => {
  const docRef = await addDoc(collection(db, 'funds'), {
    ...fund,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return mapFund({ id: docRef.id, data: () => fund });
};

export const getUserFunds = async (userId: string): Promise<Fund[]> => {
  const q = query(collection(db, 'funds'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  
  if (snap.empty) return [];

  return snap.docs.map(d => mapFund(d));
};

export const getFundById = async (id: string): Promise<Fund | null> => {
  const snap = await getDoc(doc(db, 'funds', id));
  if (!snap.exists()) return null;

  // Fetch transactions for this fund
  const transQ = query(collection(db, 'fund_transactions'), where('fundId', '==', id));
  const transSnap = await getDocs(transQ);

  // Fetch the actual Transaction details (amounts) for calculation
  const transactionIds = transSnap.docs.map(d => d.data().transactionId).filter(Boolean);
  
  let transactionMap: Record<string, Transaction> = {};
  if (transactionIds.length > 0) {
    // Basic chunking for Firestore 'in' query limit (max 30)
    const chunks = [];
    for (let i = 0; i < transactionIds.length; i += 30) {
        chunks.push(transactionIds.slice(i, i + 30));
    }
    
    for (const chunk of chunks) {
        // FIXED: documentId() function call
        const tQ = query(collection(db, 'transactions'), where(documentId(), 'in', chunk)); 
        const tSnap = await getDocs(tQ);
        tSnap.forEach(d => {
            transactionMap[d.id] = mapTransaction(d);
        });
    }
  }

  const fundTransactions = transSnap.docs.map(d => {
    const data = d.data();
    return mapFundTransaction(d, transactionMap[data.transactionId]);
  });

  return mapFund(snap, fundTransactions);
};

export const updateFund = async (id: string, updates: Partial<Fund>): Promise<Fund> => {
  await updateDoc(doc(db, 'funds', id), {
    ...updates,
    updatedAt: new Date()
  });
  return { id, ...updates } as any;
};

export const deleteFund = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'funds', id));
};

export const createFundTransaction = async (
  fundId: string,
  transactionId: string,
  type: 'deposit' | 'withdrawal',
  transferComplete: boolean = false
): Promise<void> => {
  await addDoc(collection(db, 'fund_transactions'), {
    fundId,
    transactionId,
    type,
    transferComplete,
    createdAt: new Date(),
    updatedAt: new Date()
  });
};

export const createFundTransactions = async (fundTransactions: FundTransactionCreateDTO[]): Promise<void> => {
  const batch = writeBatch(db);
  fundTransactions.forEach(ft => {
    const ref = doc(collection(db, 'fund_transactions'));
    batch.set(ref, { ...ft, createdAt: new Date(), updatedAt: new Date() });
  });
  await batch.commit();
};

export const updateFundTransactionStatus = async (id: string, transferComplete: boolean): Promise<void> => {
  await updateDoc(doc(db, 'fund_transactions', id), {
    transferComplete,
    updatedAt: new Date()
  });
};

export const getFundBalance = async (fundId: string): Promise<number> => {
  // 1. Get Fund Transactions Link Records
  const q = query(collection(db, 'fund_transactions'), where('fundId', '==', fundId));
  const snap = await getDocs(q);
  
  if (snap.empty) return 0;

  const fundTransactions = snap.docs.map(d => d.data());
  const transactionIds = fundTransactions.map(d => d.transactionId).filter(Boolean);
  
  if (transactionIds.length === 0) return 0;

  // 2. Fetch Actual Transactions to get Amounts
  const chunks = [];
  for (let i = 0; i < transactionIds.length; i += 30) {
      chunks.push(transactionIds.slice(i, i + 30));
  }
  
  let balance = 0;
  const amountsMap: Record<string, number> = {};

  for (const chunk of chunks) {
    const tQ = query(collection(db, 'transactions'), where(documentId(), 'in', chunk));
    const tSnap = await getDocs(tQ);
    tSnap.forEach(d => {
        amountsMap[d.id] = d.data().amount || 0;
    });
  }

  // 3. Calculate Balance
  fundTransactions.forEach(ft => {
      const amount = amountsMap[ft.transactionId] || 0;
      if (ft.type === 'deposit') {
          balance += amount;
      } else {
          balance -= amount;
      }
  });

  return balance;
};

export const getPendingFundTransactions = async (fundId: string): Promise<FundTransaction[]> => {
  const q = query(
    collection(db, 'fund_transactions'), 
    where('fundId', '==', fundId),
    where('transferComplete', '==', false)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => mapFundTransaction(d));
};

export const markFundTransferComplete = async (
  fundId: string,
  fundTransactionId: string,
  transferTransactionId: string
): Promise<void> => {
  await updateDoc(doc(db, 'fund_transactions', fundTransactionId), {
    transferComplete: true,
    transferTransactionId,
    updatedAt: new Date()
  });
};

export const updateFundTransaction = async (
  fundTransactionId: string,
  updates: { transferTransactionId?: string; transferComplete?: boolean; }
): Promise<void> => {
  await updateDoc(doc(db, 'fund_transactions', fundTransactionId), {
    ...updates,
    updatedAt: new Date()
  });
};

export const deleteFundTransaction = async (fundTransaction: FundTransaction): Promise<void> => {
  const batch = writeBatch(db);
  
  // Delete the fund transaction link
  batch.delete(doc(db, 'fund_transactions', fundTransaction.id));

  // Delete associated real transactions
  if (fundTransaction.transactionId) {
    batch.delete(doc(db, 'transactions', fundTransaction.transactionId));
  }
  if (fundTransaction.transferTransactionId) {
    batch.delete(doc(db, 'transactions', fundTransaction.transferTransactionId));
  }

  await batch.commit();
};