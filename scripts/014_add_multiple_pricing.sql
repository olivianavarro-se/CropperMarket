-- Add pricing_options column to inventory table to support multiple price points
-- Each inventory item can have multiple pricing options (e.g., $50/small bale, $100/ton)

-- Add new column for pricing options (JSON array)
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS pricing_options JSONB DEFAULT '[]'::jsonb;

-- Update existing inventory items to migrate current pricing to new format
UPDATE public.inventory
SET pricing_options = jsonb_build_array(
  jsonb_build_object(
    'unit', selling_unit,
    'price', price_per_unit
  )
)
WHERE pricing_options = '[]'::jsonb;

-- Add a check to ensure pricing_options is always a valid array
ALTER TABLE public.inventory
ADD CONSTRAINT pricing_options_is_array 
CHECK (jsonb_typeof(pricing_options) = 'array');

COMMENT ON COLUMN public.inventory.pricing_options IS 'Array of pricing options: [{unit: "tons"|"large_bales"|"small_bales", price: number}]';
