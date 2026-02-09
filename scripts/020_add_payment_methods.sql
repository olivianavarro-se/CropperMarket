-- Add payment_methods column to suppliers table
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_methods text[] DEFAULT '{}';

-- Update the column comment
COMMENT ON COLUMN suppliers.payment_methods IS 'Array of accepted payment methods: cash, credit, debit, zelle, venmo, check, apple_pay';
