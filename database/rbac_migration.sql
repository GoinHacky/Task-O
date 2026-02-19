-- Migration: Implement Project roles and permissions

-- 1. Create project_members table
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'tech_lead', 'manager', 'member')),
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'rejected')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Ensure status column exists even if table was already created
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='project_members' AND column_name='status') THEN
    ALTER TABLE public.project_members ADD COLUMN status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'rejected'));
  END IF;
END $$;

-- 2. Create helper functions for RLS to avoid recursion
CREATE OR REPLACE FUNCTION public.get_project_role(p_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.project_members
    WHERE project_id = p_id
    AND user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Migrate existing owners to admins
INSERT INTO public.project_members (project_id, user_id, role)
SELECT id, owner_id, 'admin' FROM public.projects
ON CONFLICT (project_id, user_id) DO NOTHING;

-- 4. Update Projects RLS Policies
DROP POLICY IF EXISTS "Users can view their own projects or team projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;

CREATE POLICY "Members can view projects"
  ON public.projects FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = public.projects.id
      AND user_id = auth.uid()
      AND status = 'accepted'
    )
  );

CREATE POLICY "Admins can update projects"
  ON public.projects FOR UPDATE
  USING (
    public.get_project_role(id) = 'admin'
  );

CREATE POLICY "Admins can delete projects"
  ON public.projects FOR DELETE
  USING (
    public.get_project_role(id) = 'admin'
  );

-- 5. Update Tasks RLS Policies
DROP POLICY IF EXISTS "Users can view tasks assigned to them or in their projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks in their projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks assigned to them or in their projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their projects" ON public.tasks;
DROP POLICY IF EXISTS "Members can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins and Managers can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins and Managers can update any task" ON public.tasks;
DROP POLICY IF EXISTS "Members can update their own tasks status" ON public.tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;

CREATE POLICY "Members can view tasks"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = public.tasks.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and Managers can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    public.get_project_role(project_id) IN ('admin', 'manager')
  );

CREATE POLICY "Admins and Managers can update any task"
  ON public.tasks FOR UPDATE
  USING (
    public.get_project_role(project_id) IN ('admin', 'manager')
  )
  WITH CHECK (
    public.get_project_role(project_id) IN ('admin', 'manager')
  );

CREATE POLICY "Members can update their own tasks status"
  ON public.tasks FOR UPDATE
  USING (
    assigned_to = auth.uid() AND
    public.get_project_role(project_id) = 'member'
  )
  WITH CHECK (
    assigned_to = auth.uid() AND
    public.get_project_role(project_id) = 'member'
    -- Limit updates to status only would be better here but SQL check is tricky for partial updates
  );

CREATE POLICY "Admins can delete tasks"
  ON public.tasks FOR DELETE
  USING (
    public.get_project_role(project_id) = 'admin'
  );

-- Enable Realtime for project_members
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;
  EXCEPTION WHEN duplicate_object THEN
  END;
END $$;
