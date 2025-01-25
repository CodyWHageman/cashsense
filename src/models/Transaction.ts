export interface Transaction {
  id: string;
  hashId: string;
  date: Date;
  description: string;
  amount: number;
  incomeId?: string;
  expenseId?: string;
  createdAt: Date;
  updatedAt?: Date;
  splits?: SplitTransaction[];
  isSplit?: boolean;
}

export interface TransactionCreateDTO {
  hashId: string;
  amount: number;
  date: Date;
  description: string;
  incomeId?: string;
  expenseId?: string;
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

export interface FundTransactionCreateDTO {
  fundId: string;
  transactionId: string;
  type: 'deposit' | 'withdrawal';
  transferComplete: boolean;
}

export interface SplitTransaction {
  id: string;
  parentTransactionId: string;
  splitAmount: number;
  expenseId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionSplitDTO {
  parentTransactionId: string;
  splits: {
    amount: number;
    expenseId: string;
  }[];
}