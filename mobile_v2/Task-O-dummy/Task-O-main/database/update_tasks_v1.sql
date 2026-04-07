-- Add missing columns to the tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_time TIME;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_tag TEXT;
