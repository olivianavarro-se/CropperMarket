-- Create order_requests table to store customer requests for inventory
CREATE TABLE IF NOT EXISTS order_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT,
  items JSONB NOT NULL, -- Array of {inventory_id, product_name, quantity, unit}
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for faster queries
CREATE INDEX idx_order_requests_supplier_id ON order_requests(supplier_id);
CREATE INDEX idx_order_requests_location_id ON order_requests(location_id);
CREATE INDEX idx_order_requests_requester_id ON order_requests(requester_id);
CREATE INDEX idx_order_requests_status ON order_requests(status);
CREATE INDEX idx_order_requests_created_at ON order_requests(created_at DESC);

-- Enable RLS
ALTER TABLE order_requests ENABLE ROW LEVEL SECURITY;

-- Suppliers can view their own orders
CREATE POLICY "Suppliers can view their own order requests"
ON order_requests FOR SELECT
USING (
  supplier_id IN (
    SELECT id FROM suppliers WHERE user_id = auth.uid()
  )
);

-- Requesters can view their own requests
CREATE POLICY "Requesters can view their own requests"
ON order_requests FOR SELECT
USING (requester_id = auth.uid());

-- Authenticated users can create order requests
CREATE POLICY "Authenticated users can create order requests"
ON order_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Suppliers can update their own order requests (status changes)
CREATE POLICY "Suppliers can update their own order requests"
ON order_requests FOR UPDATE
USING (
  supplier_id IN (
    SELECT id FROM suppliers WHERE user_id = auth.uid()
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_order_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_order_requests_timestamp
BEFORE UPDATE ON order_requests
FOR EACH ROW
EXECUTE FUNCTION update_order_requests_updated_at();
