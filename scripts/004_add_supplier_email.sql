-- Add email column to suppliers table
alter table public.suppliers add column if not exists email text;

-- Create index for email lookups
create index if not exists idx_suppliers_email on public.suppliers(email);
