export interface Transaction extends ParentTransaction {
  splits?: SplitTransaction[];
}

export interface ParentTransaction {
  id: string;
  hashId: string;
  amount: number;
  date: Date;
  description: string;
  expenseId?: string;
  incomeId?: string;
  createdAt: Date;
  updatedAt?: Date;
  isSplit: boolean;
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
  splitAmount: number;
  expenseId: string;
  parentTransaction: ParentTransaction;
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