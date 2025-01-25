import React from 'react';
import { Box, Typography } from '@mui/material';
import LoomVideo from '../common/LoomVideo';

function HelpPage() {
  const sections = [
    { id: 'budget', title: 'Budget' },
    { id: 'funds', title: 'Funds' },
    { id: 'transactions', title: 'Transactions' },
    { id: 'importing', title: 'Importing Transactions' }
  ];

  return (
    <Box 
      sx={{ 
        position: 'fixed',
        left: '250px',
        right: '400px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'auto',
        backgroundColor: 'background.default'
      }}
    >
      <Box 
        sx={{ 
          maxWidth: '800px',
          width: '100%',
          p: 3,
          height: 'fit-content'
        }}
      >
        <Typography variant="h4" gutterBottom>How to Use CashSense</Typography>
        
        {/* Table of Contents */}
        <Box sx={{ mb: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>Contents</Typography>
          <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {sections.map(section => (
              <Typography
                key={section.id}
                component="a"
                href={`#${section.id}`}
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }
                }}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(section.id)?.scrollIntoView({
                    behavior: 'smooth'
                  });
                }}
              >
                {section.title}
              </Typography>
            ))}
          </Box>
        </Box>

        {/* Content Sections with IDs */}
        <Typography variant="h5" id="budget" sx={{ mt: 4, mb: 2 }}>Budget</Typography>
        <Typography paragraph>
          CashSense uses zero-based budgeting, which means every dollar has a job. The goal is to allocate all your income across your expense categories until you have zero dollars left to budget.
        </Typography>
        <Typography paragraph>
          Here's how to use the budget feature:
        </Typography>
        <Typography component="div" sx={{ pl: 2 }}>
          <ul>
            <li>Start by adding your expected income for the month</li>
            <li>Create categories for your expenses (e.g., Rent, Groceries, Utilities)</li>
            <li>Allocate your income across these categories until you reach zero</li>
            <li>As you spend money, add transactions to track your progress</li>
            <li>The summary view shows how well you're sticking to your budget</li>
          </ul>
        </Typography>
        <Typography paragraph>
          Remember: Every dollar should have a purpose. If you have money left over, consider allocating it to savings or future expenses using Funds.
        </Typography>

        <Typography variant="h5" id="funds" sx={{ mt: 4, mb: 2 }}>Funds</Typography>
        <Typography paragraph>
          Funds are like digital envelopes for your savings. They help you save for specific future expenses or goals by setting aside money over time.
        </Typography>
        <Typography paragraph>
          Common uses for funds include:
        </Typography>
        <Typography component="div" sx={{ pl: 2 }}>
          <ul>
            <li>Emergency fund (3-6 months of expenses)</li>
            <li>Annual expenses (insurance, property taxes)</li>
            <li>Car maintenance or replacement</li>
            <li>Home repairs</li>
            <li>Vacation savings</li>
            <li>Holiday gifts</li>
          </ul>
        </Typography>
        <Typography paragraph>
          When you create a fund, you can set a target amount and track your progress. This helps ensure you're prepared for future expenses without disrupting your monthly budget.
        </Typography>

        <Typography variant="h5" id="transactions" sx={{ mt: 4, mb: 2 }}>Transactions</Typography>
        <Typography paragraph>
          Transactions in CashSense represent your actual spending and income. Each transaction is uniquely identified to prevent duplicates and ensure accurate budget tracking.
        </Typography>
        <Typography paragraph>
          Key features of transactions:
        </Typography>
        <Typography component="div" sx={{ pl: 2 }}>
          <ul>
            <li>Each transaction generates a unique hashId based on its details (date, amount, description)</li>
            <li>Duplicate detection prevents the same transaction from being added multiple times</li>
            <li>Transactions can be manually added or imported from bank statements</li>
            <li>Each transaction is linked to a specific budget category or fund</li>
            <li>Transaction history helps track spending patterns over time</li>
          </ul>
        </Typography>
        <Typography paragraph>
          Managing transactions:
        </Typography>
        <Typography component="div" sx={{ pl: 2 }}>
          <ul>
            <li>Click on any expense to add or view its transactions</li>
            <li>Edit transactions to correct any mistakes or update categorization</li>
            <li>Delete transactions if needed (this will update your budget numbers)</li>
            <li>Use the search feature to find specific transactions</li>
            <li>View transaction totals per category to track spending</li>
          </ul>
        </Typography>
        <Typography paragraph>
          The duplicate detection system ensures data accuracy by:
        </Typography>
        <Typography component="div" sx={{ pl: 2 }}>
          <ul>
            <li>Automatically checking for matching transactions during import</li>
            <li>Flagging potential duplicates for review</li>
            <li>Preventing accidental double-entry of expenses</li>
            <li>Maintaining consistent transaction records across imports</li>
          </ul>
        </Typography>

        <Typography variant="h5" id="importing" sx={{ mt: 4, mb: 2 }}>Importing Transactions</Typography>
        <Typography paragraph>
          CashSense allows you to import transactions from your bank or credit card statements. Watch this quick tutorial on how to import your transactions:
        </Typography>
        
        <LoomVideo 
          videoId="e195be1251e941d8a8945ffb0b81bfdb"
          sessionId="d6a17859-ca7a-4db3-9bcc-fa918d3060cc"
        />

        <Typography paragraph>
          Here's how to use this feature:
        </Typography>
        <Typography component="div" sx={{ pl: 2 }}>
          <ul>
            <li>Download your transactions as a CSV file from your bank</li>
            <li>Click the "Import Transactions" button in the transactions view</li>
            <li>Drag and drop your CSV file into the import window</li>
            <li>Match the columns in your CSV to the required transaction fields</li>
            <li>Review the imported transactions</li>
            <li>Drag transactions to the appropriate expense categories OR select and click to allocate the transaction to an expense, income or fund</li>
          </ul>
        </Typography>
        <Typography paragraph>
          Tips for importing:
        </Typography>
        <Typography component="div" sx={{ pl: 2 }}>
          <ul>
            <li>Make sure your CSV file includes transaction date, amount, and description</li>
            <li>Use the search box to quickly find matching expense categories</li>
            <li>You can import multiple files at once</li>
            <li>Transactions will be automatically sorted by date</li>
            <li>Duplicate transactions will be flagged for review</li>
          </ul>
        </Typography>
      </Box>
    </Box>
  );
}

export default HelpPage; 