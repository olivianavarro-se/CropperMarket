-- Add location columns to profiles table for storing user's detected location
-- This allows us to cache IP-based location in the database (checking once per week)
-- instead of relying on localStorage which can be cleared

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC,
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the columns
COMMENT ON COLUMN profiles.latitude IS 'User latitude detected from IP address';
COMMENT ON COLUMN profiles.longitude IS 'User longitude detected from IP address';
COMMENT ON COLUMN profiles.location_updated_at IS 'When the location was last updated from IP API (refresh weekly)';
