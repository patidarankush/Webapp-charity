-- Setup Authentication User
-- Run this in Supabase SQL Editor to create a user manually
-- Replace the email and password with your desired credentials

-- Note: This script shows how to create a user, but Supabase Auth users
-- should be created through the Supabase Dashboard or Auth API

-- Method 1: Create user through Supabase Dashboard
-- 1. Go to Authentication > Users in your Supabase Dashboard
-- 2. Click "Add user" 
-- 3. Enter email and password
-- 4. Set email_confirmed to true
-- 5. Save the user

-- Method 2: Use Supabase Auth API (recommended for production)
-- You can create users programmatically using the Supabase Auth API
-- or through the Supabase Dashboard

-- Example user creation (this is just for reference):
-- INSERT INTO auth.users (
--   instance_id,
--   id,
--   aud,
--   role,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at,
--   confirmation_token,
--   email_change,
--   email_change_token_new,
--   recovery_token
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   gen_random_uuid(),
--   'authenticated',
--   'authenticated',
--   'admin@templetrust.com',
--   crypt('your_password_here', gen_salt('bf')),
--   now(),
--   now(),
--   now(),
--   '',
--   '',
--   '',
--   ''
-- );

-- For security, it's recommended to:
-- 1. Create users through the Supabase Dashboard
-- 2. Use strong passwords
-- 3. Enable email confirmation if needed
-- 4. Set up proper RLS policies

-- RLS (Row Level Security) policies for your tables
-- These policies ensure users can only access their own data

-- Enable RLS on your tables
ALTER TABLE ticket_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_allotments ENABLE ROW LEVEL SECURITY;
ALTER TABLE issuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed for your use case)
-- For now, we'll allow authenticated users to access all data
-- You can make these more restrictive based on your needs

-- Ticket Sales Policy
CREATE POLICY "Allow authenticated users to access ticket_sales" ON ticket_sales
  FOR ALL USING (auth.role() = 'authenticated');

-- Diary Allotments Policy  
CREATE POLICY "Allow authenticated users to access diary_allotments" ON diary_allotments
  FOR ALL USING (auth.role() = 'authenticated');

-- Issuers Policy
CREATE POLICY "Allow authenticated users to access issuers" ON issuers
  FOR ALL USING (auth.role() = 'authenticated');

-- Diaries Policy
CREATE POLICY "Allow authenticated users to access diaries" ON diaries
  FOR ALL USING (auth.role() = 'authenticated');

-- Audit Logs Policy
CREATE POLICY "Allow authenticated users to access audit_logs" ON audit_logs
  FOR ALL USING (auth.role() = 'authenticated');


