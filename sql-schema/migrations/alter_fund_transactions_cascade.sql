-- First drop the existing foreign key constraints
ALTER TABLE fund_transactions 
  DROP CONSTRAINT IF EXISTS fund_transactions_transaction_id_fkey,
  DROP CONSTRAINT IF EXISTS fund_transactions_transfer_transaction_id_fkey,
  DROP CONSTRAINT IF EXISTS fund_transactions_fund_id_fkey;

-- Add back the constraints with the new delete behaviors
ALTER TABLE fund_transactions
  ADD CONSTRAINT fund_transactions_transaction_id_fkey 
    FOREIGN KEY (transaction_id) 
    REFERENCES transactions(id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT fund_transactions_transfer_transaction_id_fkey 
    FOREIGN KEY (transfer_transaction_id) 
    REFERENCES transactions(id) 
    ON DELETE SET NULL,
  ADD CONSTRAINT fund_transactions_fund_id_fkey
    FOREIGN KEY (fund_id)
    REFERENCES funds(id)
    ON DELETE CASCADE; 