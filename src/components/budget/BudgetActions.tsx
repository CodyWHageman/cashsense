import { SpeedDial, SpeedDialAction } from '@mui/material';
import { Add as AddIcon, CloudUpload, Category } from '@mui/icons-material';
import { useState } from 'react';
import { Budget, BudgetCategory, Fund } from '../../models/Budget';
import { Transaction } from '../../models/Transaction';
import TransactionImportModal from '../transactions/TransactionImportModal';
import CategoryDialog from './CategoryDialog';
import { useResponsive } from '../../hooks/useResponsive';
import { createCategory } from '../../services/categoryService';

interface BudgetActionsProps {
  currentBudget: Budget;
  funds: Fund[];
  onTransactionsAdded: (transactions: Transaction[]) => void;
  onCategoryAdded: (category: BudgetCategory) => void;
}

export function BudgetActions({
  currentBudget,
  funds,
  onTransactionsAdded,
  onCategoryAdded
}: BudgetActionsProps) {
  const { isMobile } = useResponsive();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

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
    }
  ];

  const handleCategoryAdded = (category: BudgetCategory) => {
    onCategoryAdded(category);
    setIsCategoryDialogOpen(false);
  }

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
        expenses={currentBudget.expenses || []}
        incomes={currentBudget.incomes || []}
        funds={funds}
        onTransactionsAdded={onTransactionsAdded}
      />

      <CategoryDialog
        open={isCategoryDialogOpen}
        onClose={() => setIsCategoryDialogOpen(false)}
        onCategorySaved={handleCategoryAdded}
        currentBudget={currentBudget}
      />
    </>
  );
} 