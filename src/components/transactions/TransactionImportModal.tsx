import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Link,
  SwipeableDrawer,
  useTheme,
  Tooltip,
  TextField,
  InputAdornment
} from '@mui/material';
import { Close, Delete, Search, Clear } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Transaction, TransactionCreateDTO } from '../../models/Transaction';
import { BudgetExpense, BudgetIncome, Fund } from '../../models/Budget';
import { createTransaction, checkExistingHashIds, createTransactions } from '../../services/transactionService';
import { createFundTransaction, createFundTransactions, updateFundTransaction } from '../../services/fundService';
import { fromCSV, fromTemplate, generateHashId } from '../../utils/transactionUtils';
import { useAuth } from '../../contexts/AuthContext';
import { getImportTemplates } from '../../services/importTemplateService';
import { useResponsive } from '../../hooks/useResponsive';
import { ExpenseSearchBox } from '../budget/ExpenseSearchBox';
import { calculateFundBalance } from '../../utils/fundUtils';
import { FileDropZone } from '../common/FileDropZone';
import FundTransactionOptionsDialog from '../funds/FundTransactionOptionsDialog';
import { calculateExpenseRemaining, calculateIncomeRemaining }  from '../../utils/calculator';

interface ImportTemplate {
  id: string;
  name: string;
  amountKey: string;
  transactionDateKey: string;
  descriptionKey: string;
  fileType: 'CSV' | 'JSON';
  userId: string;
}

interface TransactionImportModalProps {
  open: boolean;
  onClose: () => void;
  expenses: BudgetExpense[];
  incomes: BudgetIncome[];
  funds: Fund[];
  onTransactionsAdded: (transactions: Transaction[]) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`import-tabpanel-${index}`}
      aria-labelledby={`import-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const LoadingDots = () => (
  <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        sx={{
          width: '4px',
          height: '4px',
          backgroundColor: 'text.secondary',
          borderRadius: '50%',
          animation: 'dotJump 1s infinite',
          animationDelay: `${i * 0.2}s`,
          '@keyframes dotJump': {
            '0%, 100%': {
              transform: 'translateY(0)',
            },
            '50%': {
              transform: 'translateY(-6px)',
            },
          },
        }}
      />
    ))}
  </Box>
);

// Create a separate component for the search box to isolate rerenders
const ExpenseSearchInput = ({ value, onChange }: { value: string, onChange: (value: string) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  return (
    <TextField
      fullWidth
      placeholder="Search expenses..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      inputRef={inputRef}
      autoFocus
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={() => {
                onChange('');
                // Focus after clearing
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              edge="end"
            >
              <Clear />
            </IconButton>
          </InputAdornment>
        ) : null
      }}
      size="small"
      variant="outlined"
    />
  );
};

export default function TransactionImportModal({
  open,
  onClose,
  expenses,
  incomes,
  funds,
  onTransactionsAdded
}: TransactionImportModalProps) {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [importedTransactions, setImportedTransactions] = useState<TransactionCreateDTO[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [tabValue, setTabValue] = useState(0);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [fundTransactionDialog, setFundTransactionDialog] = useState<{
    open: boolean;
    fund: Fund | null;
    transaction: TransactionCreateDTO | null;
  }>({
    open: false,
    fund: null,
    transaction: null
  });
  const [internalOpen, setInternalOpen] = useState(open);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templates, setTemplates] = useState<ImportTemplate[]>([]);
  const { isMobile } = useResponsive();
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [parsedTransactions, setParsedTransactions] = useState<Transaction[]>([]);
  const transactionListRef = useRef<HTMLDivElement>(null);
  const transactionsScrollRef = useRef<HTMLDivElement>(null);
  const [expenseSearchTerm, setExpenseSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredExpenses = useMemo(() => {
    if (!expenseSearchTerm.trim()) {
      return expenses;
    }
    
    const searchTermLower = expenseSearchTerm.toLowerCase();
    return expenses.filter(expense => 
      expense.name.toLowerCase().includes(searchTermLower)
    );
  }, [expenses, expenseSearchTerm]);

  useEffect(() => {
    setInternalOpen(open);
  }, [open]);

  useEffect(() => {
    async function loadTemplates() {
      try {
        if(user) {
          const templates = await getImportTemplates(user?.uid);
          setTemplates(templates);
          if (templates.length > 0) {
            setSelectedTemplate(templates[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading import templates:', error);
        enqueueSnackbar('Error loading import templates', { variant: 'error' });
      }
    }
    
    if (open) {
      loadTemplates();
    }
  }, [open, user]);

  useEffect(() => {
    // Track if the search field had focus before filtering
    const hasFocus = document.activeElement === searchInputRef.current;
    
    // After rendering, if the field had focus before, restore it
    if (hasFocus && searchInputRef.current) {
      // Preserve cursor position by storing and restoring selection
      const selectionStart = searchInputRef.current.selectionStart;
      const selectionEnd = searchInputRef.current.selectionEnd;
      
      // Use requestAnimationFrame to ensure we run after render
      requestAnimationFrame(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.setSelectionRange(selectionStart, selectionEnd);
        }
      });
    }
  }, [expenseSearchTerm]);

  const handleClose = () => {
    setInternalOpen(false);
    onClose();
  };

  const processFile = async (file: File) => {
    if (!selectedTemplate && templates.length > 0) {
      enqueueSnackbar('Please select an import template', { variant: 'error' });
      return;
    }

    setIsParsingFile(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          throw new Error('Failed to read file');
        }

        const template = templates.find(t => t.id === selectedTemplate);
        let newTransactions: TransactionCreateDTO[] = [];

        if (template?.fileType === 'JSON') {
          try {
            const jsonData = JSON.parse(text);
            const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
            newTransactions = dataArray.map(item => {
              return fromTemplate(item, template);
            });
          } catch (error) {
            throw new Error('Invalid JSON format');
          }
        } else {
          const rows = text.split('\n').map(row => row.split(','));
          if (rows.length < 2) {
            throw new Error('File appears to be empty or invalid');
          }

          const headers = rows[0];
          newTransactions = rows.slice(1)
            .filter(row => row.length === headers.length && row.some(cell => cell.trim()))
            .map(row => {
              const csvRow = headers.reduce((obj, header, i) => {
                obj[header.trim()] = row[i].trim();
                return obj;
              }, {} as Record<string, string>);

              if (template) {
                return fromTemplate(csvRow, template);
              } else {
                return fromCSV(csvRow);
              }
            });
        }

        if (newTransactions.length === 0) {
          throw new Error('No valid transactions found in file');
        }

        // Check for duplicates using hash IDs
        const hashIds = newTransactions.map(t => t.hashId).filter((h): h is string => h !== undefined);
        const existingHashIds = await checkExistingHashIds(hashIds);
        
        const unique = newTransactions.filter(t => !existingHashIds.includes(t.hashId || ''));
        const duplicates = newTransactions.filter(t => existingHashIds.includes(t.hashId || ''));

        if (duplicates.length > 0) {
          enqueueSnackbar(
            `${duplicates.length} duplicate transaction${duplicates.length === 1 ? '' : 's'} found and skipped.`,
            { variant: 'warning' }
          );
        }

        if (unique.length > 0) {
          setImportedTransactions(prev => [...prev, ...unique]);
          enqueueSnackbar(
            `${unique.length} transaction${unique.length === 1 ? '' : 's'} imported successfully.`,
            { variant: 'success' }
          );
        }
      } catch (error) {
        console.error('Error processing file:', error);
        enqueueSnackbar(error instanceof Error ? error.message : 'Error processing file', { variant: 'error' });
      }
      setIsParsingFile(false);
      setCurrentTab(1);
    };

    reader.onerror = () => {
      enqueueSnackbar('Error reading file', { variant: 'error' });
      setIsParsingFile(false);
    };

    reader.readAsText(file);
  };

  const handleRemoveTransaction = (hashId: string) => {
    setImportedTransactions(prev => prev.filter(t => t.hashId !== hashId));
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      newSet.delete(hashId);
      return newSet;
    });
  };

  const handleRemoveSelected = () => {
    setImportedTransactions(prev => prev.filter(t => !selectedTransactions.has(t.hashId || '')));
    setSelectedTransactions(new Set());
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingFile(false);
    
    const file = event.dataTransfer.files[0];
    const template = templates.find(t => t.id === selectedTemplate);
    
    if (!template) {
      enqueueSnackbar('Please select an import template', { variant: 'error' });
      return;
    }

    if (file && (
      (template.fileType === 'CSV' && file.name.toLowerCase().endsWith('.csv')) ||
      (template.fileType === 'JSON' && file.name.toLowerCase().endsWith('.json'))
    )) {
      processFile(file);
    } else {
      enqueueSnackbar(`Please upload a ${template.fileType} file`, { variant: 'error' });
    }
  };

  const handleTransactionDrop = async (destinationId: string, transactionIds: string[], type: 'expense' | 'income' | 'fund') => {
    const transactions = transactionIds.map(hashId => 
      importedTransactions.find(t => t.hashId === hashId)
    ).filter((t): t is TransactionCreateDTO => t !== undefined);

    if (transactions.length === 0) return;

    try {
      // Get the name of the destination based on type
      let destinationName = '';
      
      if (type === 'expense') {
        const expense = expenses.find(e => e.id === destinationId);
        destinationName = expense?.name || 'expense';
      } else if (type === 'income') {
        const income = incomes.find(i => i.id === destinationId);
        destinationName = income?.name || 'income';
      } else if (type === 'fund') {
        const fund = funds.find(f => f.id === destinationId);
        destinationName = fund?.name || 'fund';
        
        if (fund) {
          setFundTransactionDialog({
            open: true,
            fund,
            transaction: transactions[0] // Fund transactions are handled one at a time
          });
          return;
        }
      }

      // Prepare transactions with the correct expense/income ID
      const preparedTransactions = transactions.map(transaction => ({
        ...transaction,
        amount: Math.abs(transaction.amount),
        expenseId: type === 'expense' ? destinationId : undefined,
        incomeId: type === 'income' ? destinationId : undefined
      }));

      // Create all transactions in a single request
      const newTransactions = await createTransactions(preparedTransactions);

      // If they're expenses with a fund, create fund transactions
      if (type === 'expense') {
        const expense = expenses.find(e => e.id === destinationId);
        if (expense?.fundId) {
          const fundTransactions = newTransactions.map(transaction => ({
            fundId: expense.fundId!,
            transactionId: transaction.id,
            type: 'deposit' as const,
            transferComplete: true
          }));
          await createFundTransactions(fundTransactions);
        }
      }

      // Remove the successfully saved transactions
      setImportedTransactions(prev => 
        prev.filter(t => !transactionIds.includes(t.hashId || ''))
      );

      // Clear the successfully processed transactions from selection
      setSelectedTransactions(prev => {
        const newSet = new Set(prev);
        transactionIds.forEach(id => newSet.delete(id));
        return newSet;
      });

      // Enhanced success message with destination name
      enqueueSnackbar(
        <span>
          {newTransactions.length} transaction{newTransactions.length === 1 ? '' : 's'} added to <strong>{destinationName}</strong> successfully
        </span>,
        { variant: 'success' }
      );

      // Notify parent with the new transactions
      onTransactionsAdded(newTransactions);

    } catch (error) {
      console.error('Error saving transactions:', error);
      enqueueSnackbar('Failed to save transactions', { variant: 'error' });
    }
  };

  const handleCreateTransactionForFund = async (transactionType: 'deposit' | 'withdrawal') => {
    if (!fundTransactionDialog.fund || !fundTransactionDialog.transaction) return;

    try {
      // First create the transaction
      const newTransaction = await createTransaction({ ...fundTransactionDialog.transaction });
      const fundName = fundTransactionDialog.fund.name;

      if (newTransaction.id) {
        // Create a fund transaction with type deposit and transfer_complete false
        await createFundTransaction(
          fundTransactionDialog.fund.id,
          newTransaction.id,
          transactionType,
          transactionType === 'withdrawal' ? false : true
        );
      }

      // Remove the transaction from imported list
      setImportedTransactions(prev => 
        prev.filter(t => t.hashId !== fundTransactionDialog.transaction?.hashId)
      );

      enqueueSnackbar(
        <span>
          Transaction added as {transactionType} to <strong>{fundName}</strong> successfully
        </span>, 
        { variant: 'success' }
      );
      onTransactionsAdded([newTransaction]);
      setFundTransactionDialog({ open: false, fund: null, transaction: null });
    } catch (error) {
      console.error(`Error creating fund ${transactionType}:`, error);
      enqueueSnackbar(`Error creating fund ${transactionType}`, { variant: 'error' });
    }
  };

  const handleLinkToExisting = async (fundTransactionId: string) => {
    if (!fundTransactionDialog.fund || !fundTransactionDialog.transaction) return;

    try {
      const newTransaction = await createTransaction({ ...fundTransactionDialog.transaction });

      if (newTransaction.id) {
        await updateFundTransaction(fundTransactionId, {
          transferTransactionId: newTransaction.id,
          transferComplete: true
        });
      }

      // Remove the transaction from imported list
      setImportedTransactions(prev => 
        prev.filter(t => t.hashId !== fundTransactionDialog.transaction?.hashId)
      );

      enqueueSnackbar('Transaction linked successfully', { variant: 'success' });
      onTransactionsAdded([newTransaction]);
      setFundTransactionDialog({ open: false, fund: null, transaction: null });
    } catch (error) {
      console.error('Error linking transaction:', error);
      enqueueSnackbar('Error linking transaction', { variant: 'error' });
    }
  };

  const handleDragEnd = async (result: any) => {
    // Early return if no destination
    if (!result.destination) return;
    
    // Parse the destination ID format which should be "type:id"
    const destinationParts = result.destination.droppableId.split(':');
    
    // If the format is incorrect or type is invalid, don't process the drop
    if (destinationParts.length !== 2) return;
    
    const [type, id] = destinationParts;
    
    // Only process drops on valid target types
    if (!['expense', 'income', 'fund'].includes(type)) return;
    
    // Now it's safe to process the transaction drop
    await handleTransactionDrop(id, [result.draggableId], type as 'expense' | 'income' | 'fund');
  };

  const handleItemClick = async (id: string, type: 'expense' | 'income' | 'fund') => {
    if (selectedTransactions.size === 0) return;
    await handleTransactionDrop(id, Array.from(selectedTransactions), type);
  };

  const toggleTransaction = (transactionId: string) => {
    // Save the current scroll position before updating state
    const scrollPosition = transactionsScrollRef.current?.scrollTop || 0;
    
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
    
    // Use requestAnimationFrame instead of setTimeout for more reliable timing
    requestAnimationFrame(() => {
      if (transactionsScrollRef.current) {
        transactionsScrollRef.current.scrollTop = scrollPosition;
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === importedTransactions.length) {
      // If all are selected, deselect all
      setSelectedTransactions(new Set());
    } else {
      // Select all
      setSelectedTransactions(new Set(importedTransactions.map(t => t.hashId || '')));
    }
  };

  const ModalContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        bgcolor: 'background.paper',
        zIndex: 1
      }}>
        {isMobile && (
          <IconButton
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        )}
        <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)} centered>
          <Tab label="Upload" />
          <Tab label="Assign" disabled={importedTransactions.length === 0} />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2, paddingTop: 0 }}>
        {currentTab === 0 ? (
          <>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Import Template</InputLabel>
              <Select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                label="Import Template"
              >
                {templates.map(template => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FileDropZone
              onFileSelect={(file) => {
                if (!selectedTemplate) {
                  enqueueSnackbar('Please select an import template first', { variant: 'error' });
                  return;
                }
                processFile(file);
              }}
              accept={{
                'text/csv': ['.csv'],
                'application/json': ['.json']
              }}
              helperText="Supports CSV and JSON files"
            />
          </>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Grid container spacing={2}>
              {/* Left side - Categories */}
              <Grid item xs={12} md={7}>
                {/* Sticky header for categories section */}
                <Box sx={{ 
                  position: 'sticky', 
                  top: 0, 
                  bgcolor: 'background.paper', 
                  zIndex: 1,
                  borderBottom: 1,
                  borderColor: 'divider',
                  mb: 1
                }}>
                  <Tabs
                    value={tabValue}
                    onChange={(_, newValue) => setTabValue(newValue)}
                  >
                    <Tab label="Expenses" />
                    <Tab label="Incomes" />
                    <Tab label="Funds" />
                  </Tabs>
                  
                  {/* Add the search box here, but only show it for the Expenses tab */}
                  {tabValue === 0 && (
                    <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
                      <ExpenseSearchInput 
                        value={expenseSearchTerm}
                        onChange={setExpenseSearchTerm}
                      />
                    </Box>
                  )}
                </Box>

                {/* Scrollable content area for categories */}
                <Box sx={{ 
                  overflowY: 'auto',
                  height: 'calc(100vh - 300px)',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                  },
                }}>
                  <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={1}>
                      {filteredExpenses.map(expense => (
                        <Grid item xs={6} sm={4} md={4} key={expense.id}>
                          <Droppable droppableId={`expense:${expense.id}`}>
                            {(provided) => (
                              <Paper
                                id={`expense-${expense.id}`}
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                sx={{
                                  p: 2,
                                  minHeight: 100,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    backgroundColor: 'action.hover',
                                    transform: 'translateY(-2px)'
                                  },
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textAlign: 'center',
                                  height: '100%'
                                }}
                                onClick={() => handleItemClick(expense.id, 'expense')}
                              >
                                <Tooltip title={expense.name} enterDelay={500}>
                                  <Typography variant="body1" sx={{ 
                                    width: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    mb: 1
                                  }}>
                                    {expense.name}
                                  </Typography>
                                </Tooltip>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Budget: ${expense.amount.toFixed(2)}
                                  </Typography>
                                  <Typography variant="caption" color="success.main">
                                    Remaining: ${calculateExpenseRemaining(expense).toFixed(2)}
                                  </Typography>
                                </Box>
                                {provided.placeholder}
                              </Paper>
                            )}
                          </Droppable>
                        </Grid>
                      ))}
                    </Grid>
                  </TabPanel>
                  
                  <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={1}>
                      {incomes.map(income => (
                        <Grid item xs={6} sm={4} md={4} key={income.id}>
                          <Droppable droppableId={`income:${income.id}`}>
                            {(provided) => (
                              <Paper
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                sx={{
                                  p: 2,
                                  minHeight: 100,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    backgroundColor: 'action.hover',
                                    transform: 'translateY(-2px)'
                                  },
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textAlign: 'center',
                                  height: '100%'
                                }}
                                onClick={() => handleItemClick(income.id, 'income')}
                              >
                                <Tooltip title={income.name} enterDelay={500}>
                                  <Typography variant="body1" sx={{ 
                                    width: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    mb: 1
                                  }}>
                                    {income.name}
                                  </Typography>
                                </Tooltip>
                                <Typography variant="caption" color="text.secondary">
                                  ${income.amount.toFixed(2)}
                                </Typography>
                                <Typography variant="caption" color="success.main">
                                  Remaining: ${calculateIncomeRemaining(income).toFixed(2)}
                                </Typography>
                                {provided.placeholder}
                              </Paper>
                            )}
                          </Droppable>
                        </Grid>
                      ))}
                    </Grid>
                  </TabPanel>
                  
                  <TabPanel value={tabValue} index={2}>
                    <Grid container spacing={1}>
                      {funds.map(fund => {
                        const {balance} = calculateFundBalance(fund);

                        return (
                          <Grid item xs={6} sm={4} md={4} key={fund.id}>
                            <Droppable droppableId={`fund:${fund.id}`}>
                              {(provided) => (
                                <Paper
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  sx={{
                                    p: 2,
                                    minHeight: 100,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      backgroundColor: 'action.hover',
                                      transform: 'translateY(-2px)'
                                    },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    height: '100%'
                                  }}
                                  onClick={() => handleItemClick(fund.id, 'fund')}
                                >
                                  <Tooltip title={fund.name} enterDelay={500}>
                                    <Typography variant="body1" sx={{ 
                                      width: '100%',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      mb: 1
                                    }}>
                                      {fund.name}
                                    </Typography>
                                  </Tooltip>
                                  <Typography variant="caption" color="text.secondary">
                                    Target: ${fund.targetAmount.toFixed(2)}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    color={balance >= fund.targetAmount ? 'success.main' : 'text.secondary'}
                                  >
                                    Balance: ${balance.toFixed(2)}
                                  </Typography>
                                  {provided.placeholder}
                                </Paper>
                              )}
                            </Droppable>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </TabPanel>
                </Box>
              </Grid>

              {/* Right side - Transactions */}
              <Grid item xs={12} md={5}>
                {importedTransactions.length === 0 ? (
                  <Paper 
                    sx={{ 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed',
                      borderColor: isDraggingFile ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      bgcolor: 'background.default',
                      p: 3,
                      transition: 'border-color 0.2s ease'
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                      {templates.length === 0 ? (
                        <>
                          Please create an import template in{' '}
                          <Link
                            component="button"
                            onClick={() => {
                              handleClose();
                              window.location.hash = '#/settings';
                            }}
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            Settings
                          </Link>
                          {' '}first
                        </>
                      ) : !selectedTemplate ? (
                        'Please select an import template'
                      ) : (
                        `Drop ${templates.find(t => t.id === selectedTemplate)?.fileType} file here`
                      )}
                    </Typography>
                    {selectedTemplate && (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          OR
                        </Typography>
                        <Button
                          variant="outlined"
                          component="label"
                          disabled={!selectedTemplate}
                        >
                          Choose File
                          <input
                            type="file"
                            hidden
                            accept={`.${templates.find(t => t.id === selectedTemplate)?.fileType.toLowerCase()}`}
                            onChange={(e) => {
                              if (e.target.files) {
                                processFile(e.target.files[0]);
                              }
                            }}
                          />
                        </Button>
                      </>
                    )}
                    {isParsingFile && (
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 1,
                          mt: 2,
                          color: 'text.secondary'
                        }}
                      >
                        <Typography variant="body2">Parsing transactions</Typography>
                        <LoadingDots />
                      </Box>
                    )}
                  </Paper>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    height: 'calc(100vh - 300px)',
                    position: 'relative'
                  }}>
                    {/* Sticky header for transactions */}
                    <Box sx={{ 
                      position: 'sticky',
                      top: 0,
                      bgcolor: 'background.paper',
                      zIndex: 1,
                      borderBottom: 1,
                      borderColor: 'divider',
                      p: 2
                    }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          component="label"
                          fullWidth
                        >
                          Upload {templates.find(t => t.id === selectedTemplate)?.fileType || 'CSV'}
                          <input
                            type="file"
                            hidden
                            accept={`.${templates.find(t => t.id === selectedTemplate)?.fileType.toLowerCase()}`}
                            onChange={(e) => {
                              if (e.target.files) {
                                processFile(e.target.files[0]);
                              }
                            }}
                          />
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={handleSelectAll}
                        >
                          {selectedTransactions.size === importedTransactions.length ? 'Deselect All' : 'Select All'}
                        </Button>
                        {selectedTransactions.size > 0 && (
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={handleRemoveSelected}
                          >
                            Remove Selected
                          </Button>
                        )}
                      </Box>
                    </Box>
                    
                    {/* Scrollable transactions list */}
                    <Box 
                      ref={transactionsScrollRef}
                      sx={{ 
                        flex: 1, 
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': {
                          width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: 'transparent',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: 'rgba(0,0,0,0.1)',
                          borderRadius: '4px',
                        },
                      }}
                    >
                      <Paper sx={{ flex: 1, overflow: 'auto' }}>
                        <Droppable droppableId="transactions">
                          {(provided) => (
                            <List
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                            >
                              {importedTransactions.map((transaction, index) => (
                                <Draggable
                                  key={transaction.hashId}
                                  draggableId={transaction.hashId || ''}
                                  index={index}
                                >
                                  {(provided) => (
                                    <ListItem
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                    >
                                      <ListItemText
                                        primary={transaction.description}
                                        secondary={
                                          <>
                                            <Typography component="span" variant="body2" color="text.primary">
                                              ${transaction.amount.toFixed(2)}
                                            </Typography>
                                            {' — '}
                                            {new Date(transaction.date).toLocaleDateString()}
                                          </>
                                        }
                                      />
                                      <ListItemSecondaryAction>
                                        <Checkbox
                                          edge="end"
                                          checked={selectedTransactions.has(transaction.hashId || '')}
                                          onChange={() => toggleTransaction(transaction.hashId || '')}
                                        />
                                        <IconButton
                                          edge="end"
                                          size="small"
                                          onClick={() => handleRemoveTransaction(transaction.hashId || '')}
                                        >
                                          <Delete />
                                        </IconButton>
                                      </ListItemSecondaryAction>
                                    </ListItem>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </List>
                          )}
                        </Droppable>
                      </Paper>
                    </Box>
                  </Box>
                )}
              </Grid>
            </Grid>
          </DragDropContext>
        )}
      </Box>
      <FundTransactionOptionsDialog
        open={fundTransactionDialog.open}
        onClose={() => setFundTransactionDialog({ open: false, fund: null, transaction: null })}
        fund={fundTransactionDialog.fund as Fund}
        transaction={fundTransactionDialog.transaction as TransactionCreateDTO}
        onCreateWithdrawal={() => handleCreateTransactionForFund('withdrawal')}
        onCreateDeposit={() => handleCreateTransactionForFund('deposit')}
        onLinkToExisting={handleLinkToExisting}
      />
    </Box>
  );

  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            height: '90vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16
          }
        }}
      >
        <ModalContent />
      </SwipeableDrawer>
    );
  }

  return (
    <Dialog
      open={internalOpen}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          height: '90vh',
          width: '95%'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Import Transactions</Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <ModalContent />
      </DialogContent>
    </Dialog>
  );
} 