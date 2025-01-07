import React, { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { 
  Box, 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  Checkbox,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import { MoreVert, Delete } from '@mui/icons-material';
import { Transaction } from '../models/Transaction';
import { createTransaction } from '../models/Transaction';
import { createTransactions } from '../services/transactionService';
import Papa from 'papaparse';

interface TransactionImportProps {
  onImportTransaction: (transaction: Transaction, importedId?: string) => void;
  importedTransactions: Transaction[];
  setImportedTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  existingTransactions: Transaction[];
}

interface MenuState {
  element: HTMLElement | null;
  transactionId: string | null;
}

interface ParsedTransaction {
  'Transaction Date': string;
  'Post Date': string;
  Description: string;
  Category: string;
  Type: string;
  Amount: string;
  [key: string]: string;  // Allow for other fields from CSV
}

function TransactionImport({ 
  onImportTransaction, 
  importedTransactions = [], 
  setImportedTransactions,
  existingTransactions = []
}: TransactionImportProps) {
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [menuAnchor, setMenuAnchor] = useState<MenuState>({ element: null, transactionId: null });
  const [draggedTransactions, setDraggedTransactions] = useState<Transaction[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File selected:', file);
    if (!file) return;

    Papa.parse<ParsedTransaction>(file, {
      header: true,
      complete: async (results) => {
        console.log('Parse results:', results);
        let duplicateCount = 0;
        const newTransactions = results.data
          .filter(row => {
            console.log('Processing row:', row);
            return row['Transaction Date'] && row.Amount;
          }) // Filter out empty rows
          .map(row => {
            const amount = Math.abs(parseFloat(row.Amount.replace(/[^0-9.-]+/g, '')));
            const date = new Date(row['Transaction Date']);
            console.log('Creating transaction with amount:', amount);
            return {
              date,
              description: row.Description,
              amount,
              account: row.Category || 'default',
              createdAt: new Date()
            };
          })
          .filter(transaction => {
            console.log('Checking for duplicate:', transaction);
            // Filter out transactions that already exist
            const isDuplicate = existingTransactions.some(existing => {
              // Ensure we're working with Date objects
              const existingDate = existing.date instanceof Date ? existing.date : new Date(existing.date);
              const transactionDate = transaction.date instanceof Date ? transaction.date : new Date(transaction.date);
              
              return existingDate.toDateString() === transactionDate.toDateString() &&
                existing.amount === transaction.amount &&
                existing.description === transaction.description;
            });
            
            if (isDuplicate) {
              duplicateCount++;
            }
            return !isDuplicate;
          });

        console.log('New transactions to add:', newTransactions);
        try {
          const createdTransactions = await createTransactions(newTransactions);
          setImportedTransactions(prev => [...prev, ...createdTransactions]);
          
          if (duplicateCount > 0) {
            enqueueSnackbar(
              `${duplicateCount} duplicate transaction${duplicateCount === 1 ? '' : 's'} found and skipped.`,
              { variant: 'warning', autoHideDuration: 3000 }
            );
          }
        } catch (error) {
          console.error('Error creating transactions:', error);
          enqueueSnackbar(
            'Error importing transactions',
            { variant: 'error', autoHideDuration: 3000 }
          );
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        enqueueSnackbar(
          'Error parsing CSV file',
          { variant: 'error', autoHideDuration: 3000 }
        );
      }
    });

    // Reset the input
    event.target.value = '';
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>, transactionId: string) => {
    event.stopPropagation();
    setMenuAnchor({ element: event.currentTarget, transactionId });
  };

  const handleCloseMenu = () => {
    setMenuAnchor({ element: null, transactionId: null });
  };

  const handleDeleteTransaction = (transactionId: string) => {
    handleCloseMenu();
    setImportedTransactions(prev => prev.filter(t => t.id === transactionId));
  };

  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === importedTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      const validIds = importedTransactions
        .map(t => t.id)
        .filter((id): id is string => typeof id === 'string');
      setSelectedTransactions(new Set(validIds));
    }
  };

  const handleDeleteSelected = () => {
    setImportedTransactions(prev => prev.filter(t => !selectedTransactions.has(t.id || '')));
    setSelectedTransactions(new Set());
  };

  const handleDragStart = (event: React.DragEvent, transactions: Transaction[]) => {
    setDraggedTransactions(transactions);
    event.dataTransfer.setData('transactions', JSON.stringify(transactions));
  };

  const handleDragEnd = () => {
    setDraggedTransactions([]);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="contained"
          component="label"
        >
          Upload CSV
          <input
            type="file"
            hidden
            accept=".csv"
            onChange={handleFileUpload}
          />
        </Button>
        {selectedTransactions.size > 0 && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteSelected}
          >
            Delete Selected ({selectedTransactions.size})
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedTransactions.size > 0 && selectedTransactions.size < importedTransactions.length}
                  checked={selectedTransactions.size === importedTransactions.length && importedTransactions.length > 0}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {importedTransactions.map(transaction => (
              <TableRow
                key={transaction.id}
                draggable
                onDragStart={(e) => handleDragStart(e, [transaction])}
                onDragEnd={handleDragEnd}
                sx={{
                  cursor: 'grab',
                  opacity: draggedTransactions.some(t => t.id === transaction.id) ? 0.5 : 1,
                  '&:hover': {
                    backgroundColor: 'background.default'
                  }
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={transaction.id ? selectedTransactions.has(transaction.id) : false}
                    onChange={() => transaction.id && handleSelectTransaction(transaction.id)}
                  />
                </TableCell>
                <TableCell>{transaction.date.toLocaleDateString()}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell align="right">${transaction.amount.toFixed(2)}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => transaction.id && handleOpenMenu(e, transaction.id)}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {importedTransactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">
                    No transactions imported yet. Upload a CSV file to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={handleCloseMenu}
      >
        <MenuItem 
          onClick={() => {
            if (menuAnchor.transactionId) {
              handleDeleteTransaction(menuAnchor.transactionId);
            }
          }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default TransactionImport; 