-- Create the locations table to store multiple locations per supplier
-- Each location has its own address and coordinates
-- Inventory items will be linked to locations instead of directly to suppliers

-- Create the locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Main Location',
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the locations table
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for locations
-- Anyone can view locations (for map display)
CREATE POLICY "Locations are viewable by everyone" ON locations
  FOR SELECT USING (true);

-- Suppliers can insert their own locations
CREATE POLICY "Suppliers can insert their own locations" ON locations
  FOR INSERT WITH CHECK (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  );

-- Suppliers can update their own locations
CREATE POLICY "Suppliers can update their own locations" ON locations
  FOR UPDATE USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  );

-- Suppliers can delete their own locations
CREATE POLICY "Suppliers can delete their own locations" ON locations
  FOR DELETE USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  );

-- Add location_id column to inventory table
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_locations_supplier ON locations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations(latitude, longitude);
