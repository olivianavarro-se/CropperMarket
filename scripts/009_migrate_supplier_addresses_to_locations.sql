-- Migration script to move existing supplier addresses to the locations table
-- This preserves existing data and links inventory to the new locations

-- Step 1: Create a location for each supplier that has an address
INSERT INTO locations (supplier_id, name, address, city, state, zip_code, latitude, longitude)
SELECT 
  id as supplier_id,
  'Main Location' as name,
  address,
  city,
  state,
  zip_code,
  latitude,
  longitude
FROM suppliers
WHERE address IS NOT NULL 
  AND city IS NOT NULL 
  AND state IS NOT NULL;

-- Step 2: Update inventory items to link to the new locations
-- Match inventory to location based on supplier_id
UPDATE inventory i
SET location_id = l.id
FROM locations l
WHERE i.supplier_id = l.supplier_id
  AND i.location_id IS NULL;

-- Step 3: Remove address columns from suppliers table (run after verifying migration)
-- Note: Running this after verification to ensure data is preserved
ALTER TABLE suppliers DROP COLUMN IF EXISTS address;
ALTER TABLE suppliers DROP COLUMN IF EXISTS city;
ALTER TABLE suppliers DROP COLUMN IF EXISTS state;
ALTER TABLE suppliers DROP COLUMN IF EXISTS zip_code;
ALTER TABLE suppliers DROP COLUMN IF EXISTS latitude;
ALTER TABLE suppliers DROP COLUMN IF EXISTS longitude;
