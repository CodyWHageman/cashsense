import { Transaction } from '../models/Transaction';
import hash from 'object-hash';

export const processTransaction = (transaction: Transaction) => {
  return transaction;
};

export const findDuplicateTransactions = (newTransactions: Array<Transaction>, existingTransactions: Array<Transaction>) => {
  const existingHashes = new Set(existingTransactions.map(t => t.hashId));
  
  const duplicates: Array<Transaction> = [];
  const unique: Array<Transaction> = [];

  newTransactions.forEach(transaction => {
    if (existingHashes.has(transaction.hashId)) {
      duplicates.push(transaction);
    } else {
      unique.push(transaction);
    }
  });

  return { duplicates, unique };
}; 

  /**
   * Generate hash from immutable transaction properties
   * @private
   * @returns {string}
   */
export const generateHashForTransaction = (transaction: Transaction) => {
  const hashInput = {
    date: transaction.date.toISOString().split('T')[0],
    description: transaction.description,
    amount: transaction.amount.toFixed(2),
    account: transaction.account
  };

  return hash(hashInput);
}

  /**
   * Create a Transaction instance from CSV data
   * @param {Object} csvRow - Raw data from CSV import
   * @returns {Transaction}
   */
export const fromCSV = (csvRow: any): Transaction => {
  return {
    date: new Date(csvRow['Transaction Date']),
    description: csvRow.Description,
    amount: Math.abs(parseFloat(csvRow.Amount)),
    account: csvRow.account || 'default',
    createdAt: new Date()
  };
}

//TODO: create a budget form data interface
// export const fromManual = (data: Object): Transaction => {
//   return {
//     date: new Date(),
//     ...data
//   };
// }

export const toDisplay = (transaction: Transaction) => {
  return {
    id: transaction.id,
    date: transaction.date.toLocaleDateString(),
    description: transaction.description,
    amount: transaction.amount.toFixed(2)
  };
}