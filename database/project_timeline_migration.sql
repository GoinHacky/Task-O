-- Migration to add timeline fields and update status constraints for projects
-- 1. Add timeline columns if they don't exist
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS end_date DATE;

-- 2. DROP old constraints first to allow status updates
-- Postgres generates different names if not specified; let's try the common ones
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check1;

-- 3. Map existing statuses to the new lifecycle
-- Current: ('active', 'on_hold', 'completed')
-- New: ('planning', 'active', 'archived')
UPDATE public.projects SET status = 'planning' WHERE status = 'on_hold' OR status = 'active';
UPDATE public.projects SET status = 'archived' WHERE status = 'completed';

-- 4. Apply new status check constraint
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK (status IN ('planning', 'active', 'archived'));

-- 5. Ensure default status is planning for future inserts
ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT 'planning';
