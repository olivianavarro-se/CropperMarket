-- Update user_type to support grower, broker, and buyer
-- First, drop the old constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- Migrate existing 'supplier' users to 'broker' (since they can grow and deliver)
UPDATE public.profiles 
SET user_type = 'broker' 
WHERE user_type = 'supplier';

-- Add migration for 'public' users to 'buyer'
UPDATE public.profiles 
SET user_type = 'buyer' 
WHERE user_type = 'public';

-- Now add the new constraint with the three account types
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type in ('grower', 'broker', 'buyer'));
