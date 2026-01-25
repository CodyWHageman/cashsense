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
import { db } from './firebase'; // Ensure this file exists as created in step 3
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
import { mapTransaction } from './transactionService'; // You will need to update this service next

// --- Mapper Helpers ---

const toDate = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val); // Fallback for strings
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
    // We assume the category details are joined in the service layer
    category: category || { id: data.categoryId, name: 'Unknown', color: '#ccc', userId: '', createdAt: new Date() },
    createdAt: toDate(data.createdAt) || new Date(),
    updatedAt: toDate(data.updatedAt) || new Date(),
    sequenceNumber: data.sequenceNumber
  };
};

const mapExpense = (doc: any, transactions: Transaction[] = []): BudgetExpense => {
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
    transactions: transactions, // Joined in service
    splitTransactions: [] // TODO: Implement split transactions fetching if needed
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
    transactions: transactions
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
    // 1. Fetch Budget Document
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

    // 2. Parallel Fetch: Expenses, Incomes, Categories
    const [expensesSnap, incomesSnap, budgetCatsSnap] = await Promise.all([
      getDocs(query(collection(db, 'budget_expenses'), where('budgetId', '==', budgetId))),
      getDocs(query(collection(db, 'budget_incomes'), where('budgetId', '==', budgetId))),
      getDocs(query(collection(db, 'budget_categories'), where('budgetId', '==', budgetId)))
    ]);

    // 3. Process Categories (Need to fetch linked Expense Categories)
    // Collect all category IDs to fetch
    const categoryIds = budgetCatsSnap.docs.map(d => d.data().categoryId);
    let expenseCategoriesMap: Record<string, ExpenseCategory> = {};

    if (categoryIds.length > 0) {
      // Firestore 'in' query is limited to 30 items. If you have more, you need to chunk this.
      // For now assuming < 30 categories per budget.
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
    // Sort categories by sequence
    categories.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    // 4. Fetch Transactions for Expenses & Incomes
    // Optimization: Collect all Expense IDs and Income IDs
    const expenseIds = expensesSnap.docs.map(d => d.id);
    const incomeIds = incomesSnap.docs.map(d => d.id);
    
    let transactionMap: Record<string, Transaction[]> = {};

    // Helper to fetch transactions by field
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
          const t = mapTransaction(doc); // Assumes mapTransaction handles Firestore doc
          const linkId = field === 'expenseId' ? t.expenseId : t.incomeId;
          if (linkId) {
            if (!transactionMap[linkId]) transactionMap[linkId] = [];
            transactionMap[linkId].push(t);
          }
        });
      });
    };

    await Promise.all([
      fetchTransactionsForLinks('expenseId', expenseIds),
      fetchTransactionsForLinks('incomeId', incomeIds)
    ]);

    // 5. Map final objects
    const expenses = expensesSnap.docs.map(doc => mapExpense(doc, transactionMap[doc.id] || []));
    const incomes = incomesSnap.docs.map(doc => mapIncome(doc, transactionMap[doc.id] || []));

    expenses.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    return mapBudget(budgetDoc, expenses, incomes, categories);

  } catch (error) {
    console.error("Error getting budget:", error);
    throw error;
  }
};

export const getMostRecentBudgetForCopy = async (month: number, year: number, userId: string): Promise<Budget | null> => {
  // Logic: Fetch all budgets for user, sort descending, filter in JS (Firestore limitation on OR queries across fields)
  // OR: Query budgets < year, OR (year == year AND month < month).
  // Firestore composite queries are tricky. Easier to fetch recent budgets ordered by year/month desc and find first one older than current.
  
  const q = query(
    collection(db, 'budgets'),
    where('userId', '==', userId),
    orderBy('year', 'desc'),
    orderBy('month', 'desc'),
    limit(10) // reasonable buffer
  );

  const snapshot = await getDocs(q);
  
  const targetDateValue = year * 12 + month;

  const previousBudgetDoc = snapshot.docs.find(doc => {
    const data = doc.data();
    const docDateValue = data.year * 12 + data.month;
    return docDateValue < targetDateValue;
  });

  if (!previousBudgetDoc) return null;

  // If found, we need to fetch its full details to copy them
  // Re-use the main get function
  const data = previousBudgetDoc.data();
  return getBudgetByMonthAndYear(data.month, data.year, userId);
};

export const createBudget = async (budgetDTO: BudgetCreateDTO): Promise<Budget> => {
  const batch = writeBatch(db);
  
  // 1. Create the Budget Doc
  const newBudgetRef = doc(collection(db, 'budgets'));
  batch.set(newBudgetRef, {
    month: budgetDTO.month,
    year: budgetDTO.year,
    userId: budgetDTO.userId,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 2. Check for Previous Budget to Copy
  const recentBudget = await getMostRecentBudgetForCopy(budgetDTO.month, budgetDTO.year, budgetDTO.userId);

  if (recentBudget) {
    // Copy Categories
    if (recentBudget.categories) {
      recentBudget.categories.forEach(cat => {
        const newRef = doc(collection(db, 'budget_categories'));
        batch.set(newRef, {
          budgetId: newBudgetRef.id,
          categoryId: cat.category.id, // Link to existing expense_category
          sequenceNumber: cat.sequenceNumber,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    }

    // Copy Expenses
    if (recentBudget.expenses) {
      recentBudget.expenses.forEach(exp => {
        const newRef = doc(collection(db, 'budget_expenses'));
        batch.set(newRef, {
          budgetId: newBudgetRef.id,
          categoryId: exp.categoryId,
          name: exp.name,
          amount: exp.amount,
          dueDate: exp.dueDate, // Date object is fine for Firestore
          fundId: exp.fundId || null,
          sequenceNumber: exp.sequenceNumber,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    }

    // Copy Incomes
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

  // Return the newly created budget
  const created = await getBudgetByMonthAndYear(budgetDTO.month, budgetDTO.year, budgetDTO.userId);
  if (!created) throw new Error("Failed to retrieve created budget");
  return created;
};

export const updateBudget = async (id: string, updates: Partial<Budget>): Promise<Budget> => {
  const ref = doc(db, 'budgets', id);
  await updateDoc(ref, {
    ...updates,
    updatedAt: new Date()
  });
  
  // Return updated
  const snap = await getDoc(ref);
  // We'd ideally re-fetch the whole tree, but for month/year updates we might just map the doc
  // However, returning a partial object might break UI expectation. 
  // Let's rely on the caller refreshing or return simple mapped doc
  return mapBudget(snap); 
};

export const deleteBudget = async (id: string): Promise<void> => {
  // Firestore doesn't cascade delete automatically. We must delete sub-resources.
  const batch = writeBatch(db);
  
  // 1. Delete Budget
  batch.delete(doc(db, 'budgets', id));

  // 2. Find and Delete Budget Expenses
  const expQ = query(collection(db, 'budget_expenses'), where('budgetId', '==', id));
  const expSnap = await getDocs(expQ);
  expSnap.forEach(d => batch.delete(d.ref));

  // 3. Find and Delete Budget Incomes
  const incQ = query(collection(db, 'budget_incomes'), where('budgetId', '==', id));
  const incSnap = await getDocs(incQ);
  incSnap.forEach(d => batch.delete(d.ref));

  // 4. Find and Delete Budget Categories
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
  // Optimization: Fetch all user budgets (only fields needed) and check in memory
  // This is better than N queries
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