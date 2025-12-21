-- Add visibility settings for suppliers
ALTER TABLE suppliers
ADD COLUMN visible_to_buyers BOOLEAN DEFAULT true,
ADD COLUMN visible_to_brokers BOOLEAN DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN suppliers.visible_to_buyers IS 'Whether this supplier''s offers are visible to buyers';
COMMENT ON COLUMN suppliers.visible_to_brokers IS 'Whether this supplier''s offers are visible to brokers';
