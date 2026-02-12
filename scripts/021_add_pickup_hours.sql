-- Add pickup_hours to suppliers table
-- Structure: array of objects with days and time slots
-- Example: [{"days": ["monday", "tuesday"], "slots": [{"start": "09:00", "end": "17:00"}]}]

ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS pickup_hours JSONB DEFAULT '[]'::jsonb;
