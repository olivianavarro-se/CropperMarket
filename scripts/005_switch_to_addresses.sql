-- Add address fields to suppliers table
ALTER TABLE public.suppliers 
  ADD COLUMN address TEXT,
  ADD COLUMN city TEXT,
  ADD COLUMN state TEXT,
  ADD COLUMN zip_code TEXT;

-- Update the latitude and longitude columns to be nullable
ALTER TABLE public.suppliers 
  ALTER COLUMN latitude DROP NOT NULL,
  ALTER COLUMN longitude DROP NOT NULL;

-- Update index for address-based searching
DROP INDEX IF EXISTS idx_suppliers_location;
CREATE INDEX IF NOT EXISTS idx_suppliers_address ON public.suppliers(city, state);
