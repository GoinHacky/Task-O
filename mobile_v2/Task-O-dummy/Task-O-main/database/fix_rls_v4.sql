-- 1. CLEANUP: Drop all possible conflicting policies to start from a clean state
DO $$ 
BEGIN
    -- Projects
    DROP POLICY IF EXISTS "Projects Visibility" ON public.projects;
    DROP POLICY IF EXISTS "Projects Management" ON public.projects;
    DROP POLICY IF EXISTS "Projects Deletion" ON public.projects;
    
    -- Teams
    DROP POLICY IF EXISTS "Teams Visibility" ON public.teams;
    DROP POLICY IF EXISTS "Teams Management" ON public.teams;
    
    -- Team Members
    DROP POLICY IF EXISTS "Team Members Visibility" ON public.team_members;
    
    -- Project Members
    DROP POLICY IF EXISTS "Project Members Visibility" ON public.project_members;
    
    -- Tasks
    DROP POLICY IF EXISTS "Tasks Visibility" ON public.tasks;
    DROP POLICY IF EXISTS "Tasks Create/Update/Delete" ON public.tasks;
    DROP POLICY IF EXISTS "Tasks Members Status Update" ON public.tasks;
END $$;

-- 2. HELPER FUNCTIONS (SECURITY DEFINER to bypass RLS and break recursion)

-- Check project access: Owner, Member, or Team Member/Owner
CREATE OR REPLACE FUNCTION public.check_project_access_v4(p_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_id
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p_id AND pm.user_id = auth.uid() AND pm.status = 'accepted') OR
      EXISTS (SELECT 1 FROM public.teams t WHERE t.project_id = p_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = t.id AND tm.user_id = auth.uid())))
    )
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Check team access: Owner, Member, or Project Admin/Manager
CREATE OR REPLACE FUNCTION public.check_team_access_v4(t_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = t_id
    AND (
      t.owner_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = t_id AND tm.user_id = auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = t.project_id 
        AND pm.user_id = auth.uid() 
        AND pm.role IN ('admin', 'manager')
        AND pm.status = 'accepted'
      ) OR
      EXISTS (SELECT 1 FROM public.projects p WHERE p.id = t.project_id AND p.owner_id = auth.uid())
    )
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Get project role
CREATE OR REPLACE FUNCTION public.get_project_role_v4(p_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.project_members
  WHERE project_id = p_id
  AND user_id = auth.uid()
  AND status = 'accepted'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 3. APPLY POLICIES (Using helpers only to avoid recursion)

-- PROJECTS
CREATE POLICY "Projects Visibility" ON public.projects FOR SELECT USING (public.check_project_access_v4(id));
CREATE POLICY "Projects Management" ON public.projects FOR UPDATE USING (owner_id = auth.uid() OR public.get_project_role_v4(id) = 'admin');
CREATE POLICY "Projects Deletion" ON public.projects FOR DELETE USING (owner_id = auth.uid());

-- TEAMS
CREATE POLICY "Teams Visibility" ON public.teams FOR SELECT USING (public.check_team_access_v4(id));
CREATE POLICY "Teams Management" ON public.teams FOR ALL 
  USING (owner_id = auth.uid() OR public.get_project_role_v4(project_id) IN ('admin', 'manager'))
  WITH CHECK (owner_id = auth.uid() OR public.get_project_role_v4(project_id) IN ('admin', 'manager'));

-- TEAM MEMBERS
CREATE POLICY "Team Members Visibility" ON public.team_members FOR SELECT USING (public.check_team_access_v4(team_id));

-- PROJECT MEMBERS
CREATE POLICY "Project Members Visibility" ON public.project_members FOR SELECT USING (public.check_project_access_v4(project_id));

-- TASKS
CREATE POLICY "Tasks Visibility" ON public.tasks FOR SELECT USING (public.check_project_access_v4(project_id));
CREATE POLICY "Tasks Create/Update/Delete" ON public.tasks FOR ALL 
  USING (
    public.get_project_role_v4(project_id) IN ('admin', 'manager') OR
    public.check_project_access_v4(project_id) AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid()))
  )
  WITH CHECK (
    public.get_project_role_v4(project_id) IN ('admin', 'manager') OR
    public.check_project_access_v4(project_id) AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid()))
  );
