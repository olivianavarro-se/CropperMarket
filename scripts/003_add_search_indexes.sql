-- Add full-text search capability for product names
create index if not exists idx_inventory_product_name on public.inventory using gin(to_tsvector('english', product_name));

-- Add index for filtering by delivery availability
create index if not exists idx_inventory_delivery on public.inventory(delivery_available);

-- Add composite index for efficient querying by supplier and unit
create index if not exists idx_inventory_supplier_unit on public.inventory(supplier_id, unit);
