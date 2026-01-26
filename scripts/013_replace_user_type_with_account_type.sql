-- Migrate from user_type to account_type with three types: buyer, grower, broker

-- Step 1: Add new account_type column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_type text;

-- Step 2: Migrate existing data
-- Users with user_type 'supplier' need to check their supplier_type
UPDATE public.profiles p
SET account_type = COALESCE(
  (SELECT s.supplier_type FROM public.suppliers s WHERE s.user_id = p.id),
  'buyer'
)
WHERE account_type IS NULL;

-- Step 3: Set buyer for any remaining public users
UPDATE public.profiles
SET account_type = 'buyer'
WHERE account_type IS NULL;

-- Step 4: Add constraint
ALTER TABLE public.profiles
ADD CONSTRAINT check_account_type 
CHECK (account_type IN ('buyer', 'grower', 'broker'));

-- Step 5: Make account_type NOT NULL
ALTER TABLE public.profiles
ALTER COLUMN account_type SET NOT NULL;

-- Step 6: Drop old user_type column
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS user_type;
