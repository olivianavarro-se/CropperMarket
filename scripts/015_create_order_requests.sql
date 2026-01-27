-- Add phone column to profiles table (for buyers to optionally add their phone)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;

-- Create order_requests table
CREATE TABLE IF NOT EXISTS order_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Who is making the request (the buyer/requester)
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Which supplier receives the request
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  
  -- Which location the request is for
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Requested items (array of objects with inventory_id, product_name, quantity, unit)
  requested_items jsonb NOT NULL,
  
  -- Optional message from requester
  message text,
  
  -- Status: pending, accepted, rejected, completed
  status text NOT NULL DEFAULT 'pending',
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE order_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Requesters can view their own requests (sent orders)
CREATE POLICY "Users can view their own requests"
  ON order_requests FOR SELECT
  USING (auth.uid() = requester_id);

-- Policy: Suppliers can view requests made to them (received orders)
CREATE POLICY "Suppliers can view requests to their business"
  ON order_requests FOR SELECT
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  );

-- Policy: Any authenticated user can create a request
CREATE POLICY "Authenticated users can create requests"
  ON order_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Policy: Suppliers can update status of requests to their business
CREATE POLICY "Suppliers can update their order requests"
  ON order_requests FOR UPDATE
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_requests_requester ON order_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_order_requests_supplier ON order_requests(supplier_id);
CREATE INDEX IF NOT EXISTS idx_order_requests_status ON order_requests(status);
