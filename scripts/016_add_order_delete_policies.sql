-- Add delete policies for order_requests table

-- Policy: Requesters can delete their own requests
CREATE POLICY "Users can delete their own requests"
  ON order_requests FOR DELETE
  USING (auth.uid() = requester_id);

-- Policy: Suppliers can delete requests to their business
CREATE POLICY "Suppliers can delete their order requests"
  ON order_requests FOR DELETE
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  );
