import { Transaction } from '../models/Transaction';
import hash from 'object-hash';

export function fromCSV(csvRow: Record<string, string>): Transaction {
  // Default CSV mapping for backward compatibility
  return {
    amount: parseFloat(csvRow['Amount'] || '0'),
    date: new Date(csvRow['Date'] || new Date()),
    description: csvRow['Description'] || '',
    hashId: `${csvRow['Description']}-${csvRow['Amount']}-${csvRow['Date']}`,
    createdAt: new Date()
  };
}

export function fromTemplate(
  data: Record<string, string>,
  amountKey: string,
  dateKey: string,
  descriptionKey: string
): Transaction {
  const date = new Date(data[dateKey] || new Date());
  const description = data[descriptionKey] || '';
  const amount = parseFloat(data[amountKey] || '0');
  const hashId = hash({
    date: date.toISOString(),
    description,
    amount
  });

  return {
    amount,
    date,
    description,
    hashId,
    createdAt: new Date()
  };
}