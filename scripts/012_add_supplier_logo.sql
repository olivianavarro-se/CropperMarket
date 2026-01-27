-- Add logo_url field to suppliers table
ALTER TABLE public.suppliers
ADD COLUMN logo_url TEXT;

-- Update the updated_at timestamp
UPDATE public.suppliers
SET updated_at = NOW()
WHERE logo_url IS NOT NULL;
