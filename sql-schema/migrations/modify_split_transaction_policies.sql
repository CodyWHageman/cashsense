-- Drop the existing policy
DROP POLICY "Users can view their own split transactions" ON split_transactions;

-- Create both policies
CREATE POLICY "Users can view their own split transactions through parent" ON split_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transactions t
      JOIN budget_expenses e ON t.expense_id = e.id
      JOIN budgets b ON e.budget_id = b.id
      WHERE t.id = split_transactions.parent_transaction_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own split transactions through expense" ON split_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM budget_expenses e
      JOIN budgets b ON e.budget_id = b.id
      WHERE e.id = split_transactions.expense_id
      AND b.user_id = auth.uid()
    )
  );