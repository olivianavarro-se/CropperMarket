-- Add delivery_available to suppliers table
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN DEFAULT false;

-- Remove delivery_available from inventory table
ALTER TABLE inventory DROP COLUMN IF EXISTS delivery_available;
