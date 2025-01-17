import React, { useState } from 'react';
import { Fab, Tooltip } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import TransactionImportModal from './TransactionImportModal';
import { BudgetExpense, BudgetIncome, Fund } from '../models/Budget';

interface ImportTransactionButtonProps {
  expenses: BudgetExpense[];
  incomes: BudgetIncome[];
  funds: Fund[];
  onTransactionAdded: () => void;
}

export default function ImportTransactionButton({
  expenses,
  incomes,
  funds,
  onTransactionAdded
}: ImportTransactionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Tooltip title="Import Transactions" placement="left" arrow>
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16
          }}
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
        onTransactionAdded={onTransactionAdded}
      />
    </>
  );
} 