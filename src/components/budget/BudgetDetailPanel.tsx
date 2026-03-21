import { Box, SwipeableDrawer, styled, IconButton, Fab, Tabs, Tab } from '@mui/material';
import BudgetSummary from './BudgetSummary';
import IncomeDetail from './IncomeDetail';
import ExpenseDetail from './ExpenseDetail';
import { Budget, BudgetIncome, BudgetExpense, ExpenseCategory } from '../../models/Budget';
import { useResponsive } from '../../hooks/useResponsive';
import { KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';
import { useState } from 'react';
import TransactionHistory from './TransactionHistory';
import { TabContext, TabPanel } from '@mui/lab';
import { useBudget } from '../../contexts/BudgetContext';

const DesktopPanel = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  width: '400px',
  height: '100vh',
  borderLeft: `1px solid ${theme.palette.divider}`,
  overflow: 'auto'
}));

interface BudgetDetailPanelProps {
  selectedIncome: BudgetIncome | null;
  selectedExpense: BudgetExpense | null;
  selectedCategory?: ExpenseCategory;
  onDetailPanelClose: () => void;
  open: boolean;
}

export function BudgetDetailPanel({
  selectedIncome,
  selectedExpense,
  selectedCategory,
  onDetailPanelClose,
  open
}: BudgetDetailPanelProps) {
  const { isMobile } = useResponsive();
  const { currentBudget } = useBudget();
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [tabValue, setTabValue] = useState('0');
  const expenses = currentBudget?.expenses || [];
  const incomes = currentBudget?.incomes || [];
  const categories = currentBudget?.categories || [];

  const detailContent = (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      {!selectedIncome && !selectedExpense && (
        <TabContext value={tabValue}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Summary" value="0" />
            <Tab label="Transactions" value="1" />
          </Tabs>
          <TabPanel value="0" sx={{ p: 0 }}>
            <Box>
              <BudgetSummary 
                expenses={expenses}
                incomes={incomes}
                budgetCategories={categories}
              />
            </Box>
          </TabPanel>
          <TabPanel value="1" sx={{ p: 0 }}>
            <Box>
              <TransactionHistory />
            </Box>
          </TabPanel>
        </TabContext>
      )}
      
      {selectedIncome && (
        <IncomeDetail
          income={selectedIncome}
          onClose={onDetailPanelClose}
          open={open}
        />
      )}
      
      {selectedExpense && (
        <ExpenseDetail
          expense={selectedExpense}
          category={selectedCategory}
          onClose={onDetailPanelClose}
          open={open}
        />
      )}
    </Box>
  );

  if (isMobile) {
    const shouldShowDrawer = open || showMobilePanel;
    
    return (
      <>
        {!open && (
          <Fab
            color="primary"
            size="small"
            onClick={() => setShowMobilePanel(true)}
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 16,
              zIndex: 1300
            }}
          >
            <KeyboardArrowUp />
          </Fab>
        )}
        
        <SwipeableDrawer
          anchor="bottom"
          open={shouldShowDrawer}
          onClose={() => {
            if (!open) {
              setShowMobilePanel(false);
            } else {
              onDetailPanelClose();
            }
          }}
          onOpen={() => setShowMobilePanel(true)}
          swipeAreaWidth={open ? 0 : 20}
          disableSwipeToOpen={open}
          sx={{
            '& .MuiDrawer-paper': {
              height: '90vh',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16
            }
          }}
        >
          <Box sx={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center',
            pt: 1,
            pb: 2
          }}>
            <IconButton 
              onClick={() => {
                if (!open) {
                  setShowMobilePanel(false);
                } else {
                  onDetailPanelClose();
                }
              }}
              size="small"
            >
              <KeyboardArrowDown />
            </IconButton>
          </Box>
          {detailContent}
        </SwipeableDrawer>
      </>
    );
  }

  return (
    <DesktopPanel>
      {detailContent}
    </DesktopPanel>
  );
} 