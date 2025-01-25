import React, { useState } from 'react';
import { Fab, Tooltip } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import TransactionImportModal from '../transactions/TransactionImportModal';
import { BudgetExpense, BudgetIncome, Fund } from '../../models/Budget';
import { Transaction } from '../../models/Transaction';

interface ImportTransactionButtonProps {
  expenses: BudgetExpense[];
  incomes: BudgetIncome[];
  funds: Fund[];
  onTransactionsAdded: (transactions: Transaction[]) => void;
}

export default function ImportTransactionButton({
  expenses,
  incomes,
  funds,
  onTransactionsAdded
}: ImportTransactionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Tooltip title="Import Transactions" placement="left" arrow>
        <Fab
          color="primary"
          onClick={() => setIsModalOpen(true)}
        >
          <CloudUpload />
        </Fab>
      </Tooltip>

      <TransactionImportModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        expenses={expenses}
        incomes={incomes}
        funds={funds}
        onTransactionsAdded={onTransactionsAdded}
      />
    </>
  );
} 