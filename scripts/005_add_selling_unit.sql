-- Add selling_unit column to inventory table
-- stock_unit = how supplier measures total inventory (Tons, Large Bales, Small Bales)
-- selling_unit = how they price/sell it (Per Ton, Per Large Bale, Per Small Bale)

-- Drop the existing check constraint first
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_unit_check;

-- First, rename 'unit' to 'stock_unit'
ALTER TABLE inventory RENAME COLUMN unit TO stock_unit;

-- Update existing 'bales' values to 'large_bales' as default
UPDATE inventory SET stock_unit = 'large_bales' WHERE stock_unit = 'bales';

-- Add the new selling_unit column
ALTER TABLE inventory ADD COLUMN selling_unit TEXT DEFAULT 'tons';

-- Set selling_unit to match stock_unit for existing records
UPDATE inventory SET selling_unit = stock_unit;

-- Add new check constraints for valid unit values
ALTER TABLE inventory ADD CONSTRAINT inventory_stock_unit_check 
  CHECK (stock_unit IN ('tons', 'large_bales', 'small_bales'));

ALTER TABLE inventory ADD CONSTRAINT inventory_selling_unit_check 
  CHECK (selling_unit IN ('tons', 'large_bales', 'small_bales'));
