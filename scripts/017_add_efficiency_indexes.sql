-- Add indexes for better query performance
-- These indexes speed up common queries on order_requests, locations, and inventory tables

-- Order requests indexes (speeds up dashboard order queries)
CREATE INDEX IF NOT EXISTS idx_order_requests_supplier ON order_requests(supplier_id);
CREATE INDEX IF NOT EXISTS idx_order_requests_requester ON order_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_order_requests_status ON order_requests(status);
CREATE INDEX IF NOT EXISTS idx_order_requests_created ON order_requests(created_at DESC);

-- Location indexes (speeds up map and search queries)
CREATE INDEX IF NOT EXISTS idx_locations_supplier ON locations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations(latitude, longitude);

-- Inventory indexes (speeds up filtering)
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_name);
CREATE INDEX IF NOT EXISTS idx_inventory_cutting ON inventory(cutting);
