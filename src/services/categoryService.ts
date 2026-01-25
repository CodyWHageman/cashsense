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
import { BudgetCategory, ExpenseCategory, ExpenseCategoryCreateDTO, ExpenseCategoryUpdateDTO } from '../models/Budget';

const mapExpenseCategory = (doc: any): ExpenseCategory => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    color: data.color,
    userId: data.userId,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date()
  };
};

const mapBudgetCategory = (doc: any, categoryData: ExpenseCategory): BudgetCategory => {
  const data = doc.data();
  return {
    id: doc.id,
    budgetId: data.budgetId,
    category: categoryData,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    sequenceNumber: data.sequenceNumber
  };
};

export const createCategory = async (
  newCategory: ExpenseCategoryCreateDTO,
  budgetId: string,
  sequenceNumber: number
): Promise<BudgetCategory> => {
  const batch = writeBatch(db);

  // 1. Create Expense Category (The definition)
  const categoryRef = doc(collection(db, 'expense_categories'));
  const categoryData = {
    name: newCategory.name,
    color: newCategory.color,
    userId: newCategory.userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  batch.set(categoryRef, categoryData);

  // 2. Create Budget Category (The link)
  const budgetCategoryRef = doc(collection(db, 'budget_categories'));
  const budgetCategoryData = {
    budgetId: budgetId,
    categoryId: categoryRef.id,
    sequenceNumber: sequenceNumber,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  batch.set(budgetCategoryRef, budgetCategoryData);

  await batch.commit();

  return mapBudgetCategory(
    { id: budgetCategoryRef.id, data: () => budgetCategoryData }, 
    { id: categoryRef.id, ...categoryData } as ExpenseCategory
  );
};

export const updateExpenseCategory = async (
  id: string,
  { name, color }: ExpenseCategoryUpdateDTO
): Promise<ExpenseCategory> => {
  const ref = doc(db, 'expense_categories', id);
  await updateDoc(ref, {
    name,
    color,
    updatedAt: new Date()
  });
  return { id, name, color, updatedAt: new Date() } as any;
};

export const deleteCategory = async (budgetCategory: BudgetCategory): Promise<void> => {
  // 1. Check for associated expenses in this budget
  const expQ = query(
    collection(db, 'budget_expenses'), 
    where('categoryId', '==', budgetCategory.category.id),
    where('budgetId', '==', budgetCategory.budgetId)
  );
  const expSnap = await getDocs(expQ);

  if (!expSnap.empty) {
    throw new Error('Cannot delete category with associated expenses');
  }

  const batch = writeBatch(db);

  // 2. Delete the link (budget_category)
  // We need to find the specific budget_category link ID. 
  // Optimization: If we passed the ID in the object, use it.
  const linkRef = doc(db, 'budget_categories', budgetCategory.id);
  batch.delete(linkRef);

  // 3. Check if this category definition is used in OTHER budgets
  // If not, delete the definition too (Cleanup)
  const otherUsageQ = query(
    collection(db, 'budget_categories'), 
    where('categoryId', '==', budgetCategory.category.id)
  );
  const otherUsageSnap = await getDocs(otherUsageQ);

  // If the ONLY usage is the one we are about to delete (size 1), then delete the definition
  if (otherUsageSnap.size <= 1) {
    const defRef = doc(db, 'expense_categories', budgetCategory.category.id);
    batch.delete(defRef);
  }

  await batch.commit();
};