export interface Transaction {
  id?: string;
  hashId?: string;
  date: Date;
  description: string;
  amount: number;
  incomeId?: string;
  expenseId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface FundTransaction {
  id: string;
  fundId: string;
  transactionId: string;
  transferTransactionId?: string;
  type: 'deposit' | 'withdrawal';
  transferComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  transaction?: Transaction;
  transferTransaction?: Transaction;
}

export const createTransaction = (data: Partial<Transaction>): Transaction => {
  return {
    id: data.id || crypto.randomUUID(),
    date: data.date ? new Date(data.date) : new Date(),
    amount: data.amount || 0,
    description: data.description?.trim() || '',
    incomeId: data.incomeId,
    expenseId: data.expenseId,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
    hashId: data.hashId
  };
};

export const createFundTransaction = (data: Partial<FundTransaction>): FundTransaction => {
  return {
    id: data.id || crypto.randomUUID(),
    fundId: data.fundId || '',
    transactionId: data.transactionId || '',
    type: data.type || 'deposit',
    transferComplete: Boolean(data.transferComplete),
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
  };
}; 