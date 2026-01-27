import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  orderBy, 
  limit, 
  writeBatch,
  Timestamp, 
  documentId
} from 'firebase/firestore';
import { db } from './firebase'; 
import { 
  Budget, 
  BudgetExpense, 
  BudgetIncome, 
  ExpenseCategory, 
  BudgetCategory, 
  BudgetCreateDTO 
} from '../models/Budget';
import { getDatabaseMonth } from '../utils/dateUtils';
import { ParentTransaction, SplitTransaction, Transaction } from '../models/Transaction';
import { mapSplitTransaction, mapTransaction } from './transactionService';

// Helper: Remove undefined keys
const sanitizeData = (data: any) => {
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (value === undefined) return acc;
    acc[key] = value;
    return acc;
  }, {} as any);
};

const toDate = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val);
};

const mapExpenseCategory = (doc: any): ExpenseCategory => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    color: data.color,
    userId: data.userId,
    createdAt: toDate(data.createdAt) || new Date()
  };
};

const mapBudgetCategory = (doc: any, category?: ExpenseCategory): BudgetCategory => {
  const data = doc.data();
  return {
    id: doc.id,
    budgetId: data.budgetId,
    category: category || { id: data.categoryId, name: 'Unknown', color: '#ccc', userId: '', createdAt: new Date() },
    createdAt: toDate(data.createdAt) || new Date(),
    updatedAt: toDate(data.updatedAt) || new Date(),
    sequenceNumber: data.sequenceNumber
  };
};

const mapExpense = (doc: any, transactions: Transaction[] = [], splitTransactions: SplitTransaction[] = []): BudgetExpense => {
  const data = doc.data();
  return {
    id: doc.id,
    budgetId: data.budgetId,
    categoryId: data.categoryId,
    name: data.name,
    amount: data.amount,
    dueDate: toDate(data.dueDate),
    fundId: data.fundId,
    createdAt: toDate(data.createdAt) || new Date(),
    updatedAt: toDate(data.updatedAt) || new Date(),
    sequenceNumber: data.sequenceNumber,
    isFavorite: data.isFavorite || false,
    transactions: transactions,
    splitTransactions: splitTransactions
  };
};

const mapIncome = (doc: any, transactions: Transaction[] = []): BudgetIncome => {
  const data = doc.data();
  return {
    id: doc.id,
    budgetId: data.budgetId,
    name: data.name,
    amount: data.amount,
    frequency: data.frequency,
    expectedDate: toDate(data.expectedDate),
    createdAt: toDate(data.createdAt) || new Date(),
    updatedAt: toDate(data.updatedAt) || new Date(),
    transactions: transactions,
    isFavorite: data.isFavorite || false
  };
};

const mapBudget = (
  doc: any, 
  expenses: BudgetExpense[] = [], 
  incomes: BudgetIncome[] = [], 
  categories: BudgetCategory[] = []
): Budget => {
  const data = doc.data();
  return {
    id: doc.id,
    month: data.month,
    year: data.year,
    userId: data.userId,
    createdAt: toDate(data.createdAt) || new Date(),
    updatedAt: toDate(data.updatedAt) || new Date(),
    categories,
    expenses,
    incomes
  };
};

// --- Service Methods ---

export const getBudgetByMonthAndYear = async (month: number, year: number, userId: string): Promise<Budget | null> => {
  try {
    const budgetsRef = collection(db, 'budgets');
    const q = query(
      budgetsRef, 
      where('userId', '==', userId), 
      where('month', '==', month), 
      where('year', '==', year),
      limit(1)
    );
    
    const budgetSnap = await getDocs(q);
    if (budgetSnap.empty) return null;
    
    const budgetDoc = budgetSnap.docs[0];
    const budgetId = budgetDoc.id;

    // 1. Fetch Basic Budget Data
    const [expensesSnap, incomesSnap, budgetCatsSnap] = await Promise.all([
      getDocs(query(collection(db, 'budget_expenses'), where('budgetId', '==', budgetId))),
      getDocs(query(collection(db, 'budget_incomes'), where('budgetId', '==', budgetId))),
      getDocs(query(collection(db, 'budget_categories'), where('budgetId', '==', budgetId)))
    ]);

    // 2. Map Categories
    const categoryIds = budgetCatsSnap.docs.map(d => d.data().categoryId);
    let expenseCategoriesMap: Record<string, ExpenseCategory> = {};

    if (categoryIds.length > 0) {
      const chunks = [];
      const chunkSize = 30;
      for (let i = 0; i < categoryIds.length; i += chunkSize) {
          chunks.push(categoryIds.slice(i, i + chunkSize));
      }

      const fetchedCategories = await Promise.all(
        chunks.map(chunk => getDocs(query(collection(db, 'expense_categories'), where(documentId(), 'in', chunk))))
      );
      
      fetchedCategories.forEach(snap => {
        snap.forEach(doc => {
          expenseCategoriesMap[doc.id] = mapExpenseCategory(doc);
        });
      });
    }

    const categories = budgetCatsSnap.docs.map(doc => 
      mapBudgetCategory(doc, expenseCategoriesMap[doc.data().categoryId])
    );
    categories.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    const expenseIds = expensesSnap.docs.map(d => d.id);
    const incomeIds = incomesSnap.docs.map(d => d.id);
    
    // 3. Fetch Standard Transactions (Direct Links)
    let transactionMap: Record<string, Transaction[]> = {};

    const fetchTransactionsForLinks = async (field: 'expenseId' | 'incomeId', ids: string[]) => {
      if (ids.length === 0) return;
      const chunks = [];
      for (let i = 0; i < ids.length; i += 30) {
        chunks.push(ids.slice(i, i + 30));
      }
      
      const results = await Promise.all(
        chunks.map(chunk => getDocs(query(collection(db, 'transactions'), where(field, 'in', chunk))))
      );

      results.forEach(snap => {
        snap.forEach(doc => {
          const t = mapTransaction(doc); 
          const linkId = field === 'expenseId' ? t.expenseId : t.incomeId;
          if (linkId) {
            if (!transactionMap[linkId]) transactionMap[linkId] = [];
            transactionMap[linkId].push(t);
          }
        });
      });
    };

    // 4. Fetch Split Transactions
    let splitTransactionMap: Record<string, SplitTransaction[]> = {};
    const fetchSplitTransactions = async (ids: string[]) => {
      if (ids.length === 0) return;
      
      // A. Fetch the split records
      const splitDocs: any[] = [];
      const chunks = [];
      for (let i = 0; i < ids.length; i += 30) {
        chunks.push(ids.slice(i, i + 30));
      }

      await Promise.all(
        chunks.map(async chunk => {
          const q = query(collection(db, 'split_transactions'), where('expenseId', 'in', chunk));
          const snap = await getDocs(q);
          snap.forEach(d => splitDocs.push(d));
        })
      );

      if (splitDocs.length === 0) return;

      // B. Fetch the parent transactions for these splits
      const parentIds = Array.from(new Set(splitDocs.map(d => d.data().parentTransactionId))).filter(id => !!id);
      const parentMap: Record<string, ParentTransaction> = {};
      
      const parentChunks = [];
      for (let i = 0; i < parentIds.length; i += 30) {
        parentChunks.push(parentIds.slice(i, i + 30));
      }

      await Promise.all(
        parentChunks.map(async chunk => {
          const q = query(collection(db, 'transactions'), where(documentId(), 'in', chunk));
          const snap = await getDocs(q);
          snap.forEach(d => {
            parentMap[d.id] = mapTransaction(d);
          });
        })
      );

      // C. Map splits and attach parents
      splitDocs.forEach(d => {
        const data = d.data();
        const parent = parentMap[data.parentTransactionId];
        if (parent) {
          const split = mapSplitTransaction(d, parent);
          if (!splitTransactionMap[split.expenseId]) {
            splitTransactionMap[split.expenseId] = [];
          }
          splitTransactionMap[split.expenseId].push(split);
        }
      });
    };

    await Promise.all([
      fetchTransactionsForLinks('expenseId', expenseIds),
      fetchTransactionsForLinks('incomeId', incomeIds),
      fetchSplitTransactions(expenseIds) // Add this call
    ]);

    // 5. Map Final Objects
    const expenses = expensesSnap.docs.map(doc => 
      mapExpense(
        doc, 
        transactionMap[doc.id] || [], 
        splitTransactionMap[doc.id] || [] // Pass splits here
      )
    );
    const incomes = incomesSnap.docs.map(doc => mapIncome(doc, transactionMap[doc.id] || []));

    expenses.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    return mapBudget(budgetDoc, expenses, incomes, categories);

  } catch (error) {
    console.error("Error getting budget:", error);
    throw error;
  }
};

export const getMostRecentBudgetForCopy = async (month: number, year: number, userId: string): Promise<Budget | null> => {
  const q = query(
    collection(db, 'budgets'),
    where('userId', '==', userId),
    orderBy('year', 'desc'),
    orderBy('month', 'desc'),
    limit(10)
  );

  const snapshot = await getDocs(q);
  
  const targetDateValue = year * 12 + month;

  const previousBudgetDoc = snapshot.docs.find(doc => {
    const data = doc.data();
    const docDateValue = data.year * 12 + data.month;
    return docDateValue < targetDateValue;
  });

  if (!previousBudgetDoc) return null;

  const data = previousBudgetDoc.data();
  return getBudgetByMonthAndYear(data.month, data.year, userId);
};

export const createBudget = async (budgetDTO: BudgetCreateDTO): Promise<Budget> => {
  const batch = writeBatch(db);
  const cleanBudget = sanitizeData(budgetDTO);
  
  const newBudgetRef = doc(collection(db, 'budgets'));
  batch.set(newBudgetRef, {
    ...cleanBudget,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const recentBudget = await getMostRecentBudgetForCopy(budgetDTO.month, budgetDTO.year, budgetDTO.userId);

  if (recentBudget) {
    if (recentBudget.categories) {
      recentBudget.categories.forEach(cat => {
        const newRef = doc(collection(db, 'budget_categories'));
        batch.set(newRef, {
          budgetId: newBudgetRef.id,
          categoryId: cat.category.id,
          sequenceNumber: cat.sequenceNumber,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    }

    if (recentBudget.expenses) {
      recentBudget.expenses.forEach(exp => {
        const newRef = doc(collection(db, 'budget_expenses'));
        batch.set(newRef, {
          budgetId: newBudgetRef.id,
          categoryId: exp.categoryId,
          name: exp.name,
          amount: exp.amount,
          dueDate: exp.dueDate, 
          fundId: exp.fundId || null,
          sequenceNumber: exp.sequenceNumber,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    }

    if (recentBudget.incomes) {
      recentBudget.incomes.forEach(inc => {
        const newRef = doc(collection(db, 'budget_incomes'));
        batch.set(newRef, {
          budgetId: newBudgetRef.id,
          name: inc.name,
          amount: inc.amount,
          frequency: inc.frequency,
          expectedDate: inc.expectedDate,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    }
  }

  await batch.commit();

  const created = await getBudgetByMonthAndYear(budgetDTO.month, budgetDTO.year, budgetDTO.userId);
  if (!created) throw new Error("Failed to retrieve created budget");
  return created;
};

export const updateBudget = async (id: string, updates: Partial<Budget>): Promise<Budget> => {
  const ref = doc(db, 'budgets', id);
  const cleanUpdates = sanitizeData(updates);
  await updateDoc(ref, {
    ...cleanUpdates,
    updatedAt: new Date()
  });
  const snap = await getDoc(ref);
  return mapBudget(snap); 
};

export const deleteBudget = async (id: string): Promise<void> => {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'budgets', id));

  const expQ = query(collection(db, 'budget_expenses'), where('budgetId', '==', id));
  const expSnap = await getDocs(expQ);
  expSnap.forEach(d => batch.delete(d.ref));

  const incQ = query(collection(db, 'budget_incomes'), where('budgetId', '==', id));
  const incSnap = await getDocs(incQ);
  incSnap.forEach(d => batch.delete(d.ref));

  const catQ = query(collection(db, 'budget_categories'), where('budgetId', '==', id));
  const catSnap = await getDocs(catQ);
  catSnap.forEach(d => batch.delete(d.ref));

  await batch.commit();
};

export const getCurrentBudget = async (userId: string): Promise<Budget | null> => {
  const currentDate = new Date();
  return await getBudgetByMonthAndYear(getDatabaseMonth(currentDate.getMonth()), currentDate.getFullYear(), userId);
};

interface BudgetPeriod {
  month: number;
  year: number;
}

interface BudgetCheckResult {
  month: number;
  year: number;
  exists: boolean;
  budgetId?: string;
}

export const checkBudgetsExist = async (
  periods: BudgetPeriod[],
  userId: string
): Promise<BudgetCheckResult[]> => {
  const q = query(collection(db, 'budgets'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  
  return periods.map(period => {
    const found = snapshot.docs.find(d => {
      const data = d.data();
      return data.month === period.month && data.year === period.year;
    });

    return {
      month: period.month,
      year: period.year,
      exists: !!found,
      budgetId: found?.id
    };
  });
};