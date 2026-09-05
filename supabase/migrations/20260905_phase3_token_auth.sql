-- =========================================================================
-- NexLearn Phase 3 — Teacher Auth, Student Tokens & Analytics Streak Schema
-- =========================================================================
-- Run this in your Supabase SQL Editor to enable dedicated columns:
-- https://supabase.com/dashboard/project/_/sql
-- =========================================================================

-- 1. Add teacher profile metadata columns
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. Add student access token column & index for fast token logins
ALTER TABLE students ADD COLUMN IF NOT EXISTS access_token TEXT;
CREATE INDEX IF NOT EXISTS idx_students_access_token ON students(access_token);

-- 3. Add streak column to analytics table
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;

-- 4. Notify schema cache reload
NOTIFY pgrst, 'reload schema';
