-- Create budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID NOT NULL,
  UNIQUE(month, year, user_id)
);

-- Create expense_categories table
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID NOT NULL
);

-- Create budget_categories association table
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  sequence_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(budget_id, category_id)
);

-- Create budget_expenses table
CREATE TABLE budget_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  fund_id UUID,
  sequence_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for efficient ordering
CREATE INDEX idx_budget_categories_sequence ON budget_categories(budget_id, sequence_number);
CREATE INDEX idx_budget_expenses_sequence ON budget_expenses(category_id, sequence_number);

-- Create budget_incomes table
CREATE TABLE budget_incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'weekly', 'bi-weekly')),
  expected_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hash_id TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  account TEXT NOT NULL,
  income_id UUID REFERENCES budget_incomes(id) ON DELETE RESTRICT,
  expense_id UUID REFERENCES budget_expenses(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CHECK (income_id IS NOT NULL OR expense_id IS NOT NULL)
);

-- Create funds table
CREATE TABLE funds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID NOT NULL
);

-- Create fund_transactions table
CREATE TABLE fund_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE RESTRICT,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  transfer_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create RLS policies
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for budgets
CREATE POLICY "Users can view their own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for expense_categories
CREATE POLICY "Users can view their own categories"
  ON expense_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON expense_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON expense_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON expense_categories FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for budget_categories
CREATE POLICY "Users can view categories in their budgets"
  ON budget_categories FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_categories.budget_id
    AND budgets.user_id = auth.uid()
  ));

CREATE POLICY "Users can create categories in their budgets"
  ON budget_categories FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_categories.budget_id
    AND budgets.user_id = auth.uid()
  ));

CREATE POLICY "Users can update categories in their budgets"
  ON budget_categories FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_categories.budget_id
    AND budgets.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete categories from their budgets"
  ON budget_categories FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_categories.budget_id
    AND budgets.user_id = auth.uid()
  ));

-- Create policies for budget_expenses
CREATE POLICY "Users can view expenses in their budgets"
  ON budget_expenses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_expenses.budget_id
    AND budgets.user_id = auth.uid()
  ));

CREATE POLICY "Users can create expenses in their budgets"
  ON budget_expenses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_expenses.budget_id
    AND budgets.user_id = auth.uid()
  ));

CREATE POLICY "Users can update expenses in their budgets"
  ON budget_expenses FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_expenses.budget_id
    AND budgets.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete expenses in their budgets"
  ON budget_expenses FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_expenses.budget_id
    AND budgets.user_id = auth.uid()
  ));

-- Create policies for budget_incomes
CREATE POLICY "Users can view incomes in their budgets"
  ON budget_incomes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_incomes.budget_id
    AND budgets.user_id = auth.uid()
  ));

CREATE POLICY "Users can create incomes in their budgets"
  ON budget_incomes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_incomes.budget_id
    AND budgets.user_id = auth.uid()
  ));

CREATE POLICY "Users can update incomes in their budgets"
  ON budget_incomes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_incomes.budget_id
    AND budgets.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete incomes in their budgets"
  ON budget_incomes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM budgets
    WHERE budgets.id = budget_incomes.budget_id
    AND budgets.user_id = auth.uid()
  ));

-- Create policies for transactions
CREATE POLICY "Users can view transactions in their budgets"
  ON transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM budget_expenses
    JOIN budgets ON budget_expenses.budget_id = budgets.id
    WHERE (budget_expenses.id = transactions.expense_id OR transactions.expense_id IS NULL)
    AND budgets.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM budget_incomes
    JOIN budgets ON budget_incomes.budget_id = budgets.id
    WHERE (budget_incomes.id = transactions.income_id OR transactions.income_id IS NULL)
    AND budgets.user_id = auth.uid()
  ));

CREATE POLICY "Users can create transactions in their budgets"
  ON transactions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM budget_expenses
    JOIN budgets ON budget_expenses.budget_id = budgets.id
    WHERE (budget_expenses.id = transactions.expense_id OR transactions.expense_id IS NULL)
    AND budgets.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM budget_incomes
    JOIN budgets ON budget_incomes.budget_id = budgets.id
    WHERE (budget_incomes.id = transactions.income_id OR transactions.income_id IS NULL)
    AND budgets.user_id = auth.uid()
  ));

CREATE POLICY "Users can update transactions in their budgets"
  ON transactions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM budget_expenses
    JOIN budgets ON budget_expenses.budget_id = budgets.id
    WHERE (budget_expenses.id = transactions.expense_id OR transactions.expense_id IS NULL)
    AND budgets.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM budget_incomes
    JOIN budgets ON budget_incomes.budget_id = budgets.id
    WHERE (budget_incomes.id = transactions.income_id OR transactions.income_id IS NULL)
    AND budgets.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete transactions in their budgets"
  ON transactions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM budget_expenses
    JOIN budgets ON budget_expenses.budget_id = budgets.id
    WHERE (budget_expenses.id = transactions.expense_id OR transactions.expense_id IS NULL)
    AND budgets.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM budget_incomes
    JOIN budgets ON budget_incomes.budget_id = budgets.id
    WHERE (budget_incomes.id = transactions.income_id OR transactions.income_id IS NULL)
    AND budgets.user_id = auth.uid()
  ));

-- Create policies for funds
CREATE POLICY "Users can view their own funds"
  ON funds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own funds"
  ON funds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own funds"
  ON funds FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own funds"
  ON funds FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for fund_transactions
CREATE POLICY "Users can view transactions in their funds"
  ON fund_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM funds
    WHERE funds.id = fund_transactions.fund_id
    AND funds.user_id = auth.uid()
  ));

CREATE POLICY "Users can create transactions in their funds"
  ON fund_transactions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM funds
    WHERE funds.id = fund_transactions.fund_id
    AND funds.user_id = auth.uid()
  ));

CREATE POLICY "Users can update transactions in their funds"
  ON fund_transactions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM funds
    WHERE funds.id = fund_transactions.fund_id
    AND funds.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete transactions in their funds"
  ON fund_transactions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM funds
    WHERE funds.id = fund_transactions.fund_id
    AND funds.user_id = auth.uid()
  )); 