-- Create profiles table for user management
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  user_type text not null check (user_type in ('public', 'supplier')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create suppliers table
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  business_name text not null,
  supplier_type text not null check (supplier_type in ('broker', 'grower')),
  description text,
  phone text,
  latitude decimal(10, 8) not null,
  longitude decimal(11, 8) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Create inventory table
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  product_name text not null,
  quantity decimal(10, 2) not null,
  unit text not null check (unit in ('tons', 'bales')),
  price_per_unit decimal(10, 2) not null,
  delivery_available boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.suppliers enable row level security;
alter table public.inventory enable row level security;

-- RLS Policies for profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- RLS Policies for suppliers
create policy "Suppliers are viewable by everyone"
  on public.suppliers for select
  using (true);

create policy "Users can insert their own supplier profile"
  on public.suppliers for insert
  with check (auth.uid() in (select id from public.profiles where id = user_id));

create policy "Users can update their own supplier profile"
  on public.suppliers for update
  using (auth.uid() in (select id from public.profiles where id = user_id));

create policy "Users can delete their own supplier profile"
  on public.suppliers for delete
  using (auth.uid() in (select id from public.profiles where id = user_id));

-- RLS Policies for inventory
create policy "Inventory is viewable by everyone"
  on public.inventory for select
  using (true);

create policy "Suppliers can insert their own inventory"
  on public.inventory for insert
  with check (auth.uid() in (
    select user_id from public.suppliers where id = supplier_id
  ));

create policy "Suppliers can update their own inventory"
  on public.inventory for update
  using (auth.uid() in (
    select user_id from public.suppliers where id = supplier_id
  ));

create policy "Suppliers can delete their own inventory"
  on public.inventory for delete
  using (auth.uid() in (
    select user_id from public.suppliers where id = supplier_id
  ));

-- Create indexes for better query performance
create index if not exists idx_suppliers_user_id on public.suppliers(user_id);
create index if not exists idx_suppliers_location on public.suppliers(latitude, longitude);
create index if not exists idx_inventory_supplier_id on public.inventory(supplier_id);
