-- 1. DROP ALL OLD POLICIES (Explicitly to resolve dependencies and recursion)
-- Projects
DROP POLICY IF EXISTS "Members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own projects or team projects" ON public.projects;
DROP POLICY IF EXISTS "Projects Visibility" ON public.projects;
DROP POLICY IF EXISTS "Projects Management" ON public.projects;
DROP POLICY IF EXISTS "Projects Deletion" ON public.projects;

-- Teams
DROP POLICY IF EXISTS "Users can view teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams in their projects" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams they are members of" ON public.teams;
DROP POLICY IF EXISTS "Project members can view project teams" ON public.teams;
DROP POLICY IF EXISTS "Teams Visibility" ON public.teams;
DROP POLICY IF EXISTS "Teams CRUD" ON public.teams;
DROP POLICY IF EXISTS "Teams Management" ON public.teams;

-- Team Members
DROP POLICY IF EXISTS "View team members" ON public.team_members;
DROP POLICY IF EXISTS "Members can view other members of their teams" ON public.team_members;
DROP POLICY IF EXISTS "Members can view team members if they have team/project access" ON public.team_members;
DROP POLICY IF EXISTS "Team Members Visibility" ON public.team_members;

-- Project Members
DROP POLICY IF EXISTS "View project members" ON public.project_members;
DROP POLICY IF EXISTS "Project Members Visibility" ON public.project_members;

-- Tasks
DROP POLICY IF EXISTS "Members can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins and Managers can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins and Managers can update any task" ON public.tasks;
DROP POLICY IF EXISTS "Members can update their own tasks status" ON public.tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Tasks Visibility" ON public.tasks;
DROP POLICY IF EXISTS "Tasks Create/Update/Delete" ON public.tasks;
DROP POLICY IF EXISTS "Tasks Members Status Update" ON public.tasks;

-- 2. DROP OLD FUNCTIONS (With CASCADE as safety to break recursion loops)
DROP FUNCTION IF EXISTS public.check_team_membership(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_project_role(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_project_access_via_team(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_project_role_v3(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_team_member_v3(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_team_owner_v3(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_project_owner_v3(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.has_project_access_v3(UUID) CASCADE;

-- 3. CREATE BASE HELPERS (SECURITY DEFINER to bypass RLS during checks)

-- Check if user is the direct owner of a project
CREATE OR REPLACE FUNCTION public.is_project_owner_v3(p_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_id
    AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Get user's role in a project (admin, manager, member)
CREATE OR REPLACE FUNCTION public.get_project_role_v3(p_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.project_members
  WHERE project_id = p_id
  AND user_id = auth.uid()
  AND status = 'accepted'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is a member of a specific team
CREATE OR REPLACE FUNCTION public.is_team_member_v3(t_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = t_id
    AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user owns a specific team
CREATE OR REPLACE FUNCTION public.is_team_owner_v3(t_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = t_id
    AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user has access to a project WITHOUT calling projects table (to avoid recursion)
-- This checks memberships and teams directly
CREATE OR REPLACE FUNCTION public.has_project_non_recursive_access_v3(p_id UUID)
RETURNS BOOLEAN AS $$
  SELECT (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p_id AND user_id = auth.uid() AND status = 'accepted') OR
    EXISTS (SELECT 1 FROM public.teams t WHERE t.project_id = p_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = t.id AND tm.user_id = auth.uid())))
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. APPLY NEW POLICIES

-- PROJECTS
-- Policy uses direct owner check + non-recursive helper to avoid loops
CREATE POLICY "Projects Visibility" ON public.projects FOR SELECT USING (
    owner_id = auth.uid() OR 
    public.has_project_non_recursive_access_v3(id)
);
CREATE POLICY "Projects Management" ON public.projects FOR UPDATE USING (owner_id = auth.uid() OR public.get_project_role_v3(id) = 'admin');
CREATE POLICY "Projects Deletion" ON public.projects FOR DELETE USING (owner_id = auth.uid());

-- TEAMS
CREATE POLICY "Teams Visibility" ON public.teams FOR SELECT USING (
    owner_id = auth.uid() OR
    public.is_team_member_v3(id) OR
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (owner_id = auth.uid() OR public.has_project_non_recursive_access_v3(id)))
);
CREATE POLICY "Teams Management" ON public.teams FOR ALL 
  USING (owner_id = auth.uid() OR public.get_project_role_v3(project_id) IN ('admin', 'manager'))
  WITH CHECK (owner_id = auth.uid() OR public.get_project_role_v3(project_id) IN ('admin', 'manager'));

-- TEAM MEMBERS
CREATE POLICY "Team Members Visibility" ON public.team_members FOR SELECT USING (
    public.is_team_member_v3(team_id) OR 
    public.is_team_owner_v3(team_id) OR
    EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = t.project_id AND (p.owner_id = auth.uid() OR public.has_project_non_recursive_access_v3(p.id))))
);

-- PROJECT MEMBERS
CREATE POLICY "Project Members Visibility" ON public.project_members FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.owner_id = auth.uid() OR public.has_project_non_recursive_access_v3(p.id)))
);

-- TASKS
CREATE POLICY "Tasks Visibility" ON public.tasks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.owner_id = auth.uid() OR public.has_project_non_recursive_access_v3(p.id)))
);
CREATE POLICY "Tasks Create/Update/Delete" ON public.tasks FOR ALL 
  USING (
    public.get_project_role_v3(project_id) IN ('admin', 'manager') OR
    public.is_project_owner_v3(project_id) OR
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid())
  )
  WITH CHECK (
    public.get_project_role_v3(project_id) IN ('admin', 'manager') OR
    public.is_project_owner_v3(project_id) OR
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid())
  );

CREATE POLICY "Tasks Members Status Update" ON public.tasks FOR UPDATE
  USING (assigned_to = auth.uid() AND public.get_project_role_v3(project_id) = 'member')
  WITH CHECK (assigned_to = auth.uid() AND public.get_project_role_v3(project_id) = 'member');
