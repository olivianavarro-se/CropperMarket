-- Add delivery_available column to locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN DEFAULT false;

-- Copy existing delivery_available from suppliers to their locations
UPDATE locations l
SET delivery_available = s.delivery_available
FROM suppliers s
WHERE l.supplier_id = s.id;

-- Remove delivery_available from suppliers table (optional - keeping for backward compatibility)
-- ALTER TABLE suppliers DROP COLUMN IF EXISTS delivery_available;
