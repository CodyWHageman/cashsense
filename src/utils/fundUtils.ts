import { Fund } from '../models/Budget';

export interface FundWithBalance extends Fund {
  balance: number;
  progress: number;
}

export const calculateFundBalance = (fund: Fund): FundWithBalance => {
  const balance = fund.fundTransactions?.reduce((total, ft) => {
    if (!ft.transaction) return total;
    return ft.type === 'deposit' ? total + ft.transaction.amount : total - ft.transaction.amount;
  }, 0) || 0;

  return {
    ...fund,
    balance,
    progress: (balance / fund.targetAmount) * 100
  };
}; 