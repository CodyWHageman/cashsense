# CashSense

A modern zero-based budgeting application that helps you give every dollar a purpose. Inspired by popular budgeting methods, CashSense provides a straightforward way to plan your monthly finances and track your spending.

## Features
- Zero-based budgeting methodology
- Monthly budget planning
- Expense tracking and categorization
- Income management
- Real-time budget updates
- Clean, intuitive user interface

## Tech Stack
- React
- TypeScript
- Material-UI
- Firebase (Backend & Authentication)
- Vite

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/budget-app.git
cd budget-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Setting up Supabase

1. Create a new project in Supabase
2. Go to the SQL editor in your Supabase dashboard
3. Copy the contents of `schema.sql` and run it in the SQL editor
4. This will create all necessary tables and set up Row Level Security (RLS) policies

The schema includes the following tables:
- `budgets`: Stores monthly budgets
- `expense_categories`: Stores expense categories
- `budget_expenses`: Stores budget expenses
- `budget_incomes`: Stores budget incomes
- `transactions`: Stores actual transactions
- `funds`: Stores savings funds
- `fund_transactions`: Stores fund transactions

### Running the App

```bash
npm run dev
# or
yarn dev
```

The app will be available at `http://localhost:5173`

## Database Schema

### budgets
- `id`: UUID (Primary Key)
- `month`: INTEGER
- `year`: INTEGER
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `user_id`: UUID

### expense_categories
- `id`: UUID (Primary Key)
- `name`: TEXT
- `color`: TEXT
- `created_at`: TIMESTAMP
- `user_id`: UUID

### budget_expenses
- `id`: UUID (Primary Key)
- `budget_id`: UUID (Foreign Key)
- `category_id`: UUID (Foreign Key)
- `name`: TEXT
- `amount`: DECIMAL(10,2)
- `due_date`: TIMESTAMP
- `fund_id`: UUID
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### budget_incomes
- `id`: UUID (Primary Key)
- `budget_id`: UUID (Foreign Key)
- `name`: TEXT
- `amount`: DECIMAL(10,2)
- `frequency`: TEXT ('monthly', 'weekly', 'bi-weekly')
- `expected_date`: TIMESTAMP
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### transactions
- `id`: UUID (Primary Key)
- `hash_id`: TEXT
- `date`: TIMESTAMP
- `description`: TEXT
- `amount`: DECIMAL(10,2)
- `account`: TEXT
- `income_id`: UUID (Foreign Key)
- `expense_id`: UUID (Foreign Key)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### funds
- `id`: UUID (Primary Key)
- `name`: TEXT
- `description`: TEXT
- `target_amount`: DECIMAL(10,2)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `user_id`: UUID

### fund_transactions
- `id`: UUID (Primary Key)
- `fund_id`: UUID (Foreign Key)
- `transaction_id`: UUID (Foreign Key)
- `type`: TEXT ('deposit', 'withdrawal')
- `transfer_complete`: BOOLEAN
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

## Security

The database uses Row Level Security (RLS) to ensure users can only access their own data. Each table has policies that:
- Allow users to view only their own data
- Allow users to create data only for themselves
- Allow users to update only their own data
- Allow users to delete only their own data

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
