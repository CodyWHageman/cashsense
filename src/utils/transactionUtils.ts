import { TransactionCreateDTO } from '../models/Transaction';
import { ImportTemplate } from '../models/ImportTemplate';
import hash from 'object-hash';

export function fromCSV(csvRow: Record<string, string>): TransactionCreateDTO {
  // Default CSV mapping for backward compatibility
  const amount = Math.abs(parseFloat(csvRow['Amount'] || '0'));
  const date = new Date(csvRow['Date'] || new Date());
  const description = csvRow['Description'] || '';
  const hashId = generateHashId(amount, date, description);

  return {
    hashId,
    amount,
    date,
    description
  };
}

export function fromTemplate(data: Record<string, string>, template: ImportTemplate): TransactionCreateDTO {
  const date = new Date(data[template.transactionDateKey] || new Date());
  const description = data[template.descriptionKey] || '';
  const amount = Math.abs(parseFloat(data[template.amountKey] || '0'));
  const hashId = generateHashId(amount, date, description);

  return {
    hashId,
    amount,
    date,
    description
  };
}

export function generateHashId(amount: number, date: Date, description: string): string {
  return hash({
    date: date.toISOString(),
    description,
    amount
  });
}
