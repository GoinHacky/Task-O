-- RLS Recursion Fix (v2) for Task-O

-- 1. Helper Function: Check Team Membership (Security Definer breaks recursion)
CREATE OR REPLACE FUNCTION public.check_team_membership(t_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = t_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper Function: Get Project Role (Security Definer breaks recursion)
CREATE OR REPLACE FUNCTION public.get_project_role(p_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.project_members
    WHERE project_id = p_id
    AND user_id = auth.uid()
    AND status = 'accepted'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Helper Function: Check Project Access via Team (Security Definer breaks recursion)
CREATE OR REPLACE FUNCTION public.check_project_access_via_team(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.teams t
    INNER JOIN public.team_members tm ON t.id = tm.team_id
    WHERE t.project_id = p_id
    AND tm.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply Fixed Policies for PROJECTS
DROP POLICY IF EXISTS "Members can view projects" ON public.projects;
CREATE POLICY "Members can view projects"
  ON public.projects FOR SELECT
  USING (
    owner_id = auth.uid() OR
    public.get_project_role(id) IS NOT NULL OR
    public.check_project_access_via_team(id)
  );

-- 5. Apply Fixed Policies for TEAMS
DROP POLICY IF EXISTS "Users can view teams in their projects" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams they are members of" ON public.teams;
CREATE POLICY "Users can view teams"
  ON public.teams FOR SELECT
  USING (
    owner_id = auth.uid() OR
    public.check_team_membership(id) OR
    public.get_project_role(project_id) IS NOT NULL
  );

-- 6. Apply Fixed Policies for TEAM_MEMBERS
DROP POLICY IF EXISTS "Members can view team members if they have team/project access" ON public.team_members;
DROP POLICY IF EXISTS "Members can view other members of their teams" ON public.team_members;
CREATE POLICY "View team members"
  ON public.team_members FOR SELECT
  USING (
    user_id = auth.uid() OR -- Always see self
    public.check_team_membership(team_id) OR -- See others in same team
    EXISTS ( -- See team members if admin/owner of project
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id
      AND (
        t.owner_id = auth.uid() OR
        public.get_project_role(t.project_id) IN ('admin', 'manager')
      )
    )
  );

-- 7. Apply Fixed Policies for PROJECT_MEMBERS
DROP POLICY IF EXISTS "Members can view project_members" ON public.project_members;
CREATE POLICY "View project members"
  ON public.project_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    public.get_project_role(project_id) IS NOT NULL OR
    public.check_project_access_via_team(project_id)
  );
