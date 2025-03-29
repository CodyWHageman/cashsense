import { SpeedDial, SpeedDialAction } from '@mui/material';
import { Add as AddIcon, CloudUpload, Category, AttachMoney } from '@mui/icons-material';
import { useState } from 'react';
import { Budget, BudgetCategory, Fund } from '../../models/Budget';
import { Transaction } from '../../models/Transaction';
import TransactionImportModal from '../transactions/TransactionImportModal';
import CategoryDialog from './CategoryDialog';
import { useResponsive } from '../../hooks/useResponsive';
import { createCategory } from '../../services/categoryService';
import { useBudget } from '../../contexts/BudgetContext';
import { AddTransactionDialog } from '../transactions/AddTransactionDialog';

interface BudgetActionsProps {
  funds: Fund[];
}

export function BudgetActions({
  funds
}: BudgetActionsProps) {
  const { isMobile } = useResponsive();
  const { currentBudget, handleCategoryAdded, handleTransactionsAdded } = useBudget();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);

  const actions = [
    {
      icon: <Category />,
      name: 'Add Category',
      onClick: () => setIsCategoryDialogOpen(true)
    },
    {
      icon: <CloudUpload />,
      name: 'Import Transactions',
      onClick: () => setIsImportModalOpen(true)
    },
    {
      icon: <AttachMoney />,
      name: 'Add Transaction',
      onClick: () => setIsAddTransactionOpen(true)
    }
  ];

  return (
    <>
      <SpeedDial
        ariaLabel="Budget Actions"
        sx={{
          position: 'fixed',
          bottom: isMobile ? 130 : 24,
          right: isMobile ? 8 : 24,
          zIndex: 1500
        }}
        icon={<AddIcon />}
        FabProps={{
          sx: {
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
            }
          }
        }}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.onClick}
            tooltipOpen={isMobile}
          />
        ))}
      </SpeedDial>

      <TransactionImportModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        expenses={currentBudget?.expenses || []}
        incomes={currentBudget?.incomes || []}
        funds={funds}
        onTransactionsAdded={handleTransactionsAdded}
      />

      <CategoryDialog
        open={isCategoryDialogOpen}
        onClose={() => setIsCategoryDialogOpen(false)}
        onCategorySaved={(category) => {
          handleCategoryAdded(category);
          setIsCategoryDialogOpen(false);
        }}
      />

      <AddTransactionDialog
        open={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        expenses={currentBudget?.expenses || []}
        onTransactionAdded={(transaction) => {
          handleTransactionsAdded([transaction]);
          setIsAddTransactionOpen(false);
        }}
      />
    </>
  );
} 