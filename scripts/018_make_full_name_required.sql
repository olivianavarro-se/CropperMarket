-- Make full_name required in profiles table

-- Step 1: Update any profiles with empty or null full_name to use email prefix
UPDATE public.profiles
SET full_name = split_part(email, '@', 1)
WHERE full_name IS NULL OR full_name = '';

-- Step 2: Make full_name NOT NULL
ALTER TABLE public.profiles
ALTER COLUMN full_name SET NOT NULL;
