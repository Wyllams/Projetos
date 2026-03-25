-- ============================================
-- Fix: Add start_date to projects table
-- Run this in Supabase SQL Editor
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN start_date DATE;
  END IF;
END $$;
