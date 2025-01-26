-- Add isSplit column to transactions table
ALTER TABLE transactions 
ADD COLUMN is_split BOOLEAN NOT NULL DEFAULT false;

-- Update existing transactions that have splits
UPDATE transactions 
SET is_split = true 
WHERE id IN (
  SELECT DISTINCT parent_transaction_id 
  FROM split_transactions
);