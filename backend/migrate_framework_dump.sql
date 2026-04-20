-- Migrate Bettercoal data into Veris schema
-- Run this after loading framework.sql into a temporary schema,
-- or as part of a script that extracts and transforms the data.
-- 
-- Since Bettercoal uses integer IDs and Veris uses UUIDs,
-- we'll create a mapping table and generate UUIDs.

-- Step 1: Create temp schema with bettercoal data
-- psql -U postgres -d veris -f framework.sql  -- load raw dump
-- Then run the migration queries below:

BEGIN;

-- Map users
-- Bettercoal users -> Veris users table
-- Both store email, name, password. Bettercoal had 4 users.
-- We'll insert users from users_user into our users table
-- skipping any that already exist.

-- Note: This migration requires the bettercoal dump to already be loaded
-- into a 'public' schema which will clobber the Veris schema.
-- So instead, we'll extract data directly using a Python script.

COMMIT;
