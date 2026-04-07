-- 1. NUCLEAR CLEANUP: Drop all custom policies across core tables
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('projects', 'teams', 'team_members', 'project_members', 'tasks', 'team_invitations')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ' || quote_ident(pol.tablename);
    END LOOP;
END $$;

-- 2. DROP OLD FUNCTIONS (CASCADE TO ENSURE CLEAN STATE)
DROP FUNCTION IF EXISTS public.gatekeeper_project_access(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.gatekeeper_team_access(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.gatekeeper_project_role(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_project_access_v4(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_team_access_v4(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_project_role_v4(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.has_project_non_recursive_access_v3(UUID) CASCADE;

-- 3. PURE LOGIC GATEKEEPERS (SECURITY DEFINER)

-- Project Access: Owner OR Member OR Team Member/Owner
CREATE OR REPLACE FUNCTION public.gatekeeper_project_access(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = p_id
        AND (
            p.owner_id = auth.uid() OR
            EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p_id AND pm.user_id = auth.uid() AND pm.status = 'accepted') OR
            EXISTS (SELECT 1 FROM public.teams t WHERE t.project_id = p_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = t.id AND tm.user_id = auth.uid())))
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Team Access: Owner OR Member OR Project Admin/Manager
CREATE OR REPLACE FUNCTION public.gatekeeper_team_access(t_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_project_id UUID;
BEGIN
    -- Get project ID first
    SELECT project_id INTO v_project_id FROM public.teams WHERE id = t_id;
    
    RETURN EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = t_id
        AND (
            t.owner_id = auth.uid() OR
            EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = t_id AND tm.user_id = auth.uid()) OR
            (v_project_id IS NOT NULL AND public.gatekeeper_project_access(v_project_id))
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Project Role Resolver
CREATE OR REPLACE FUNCTION public.gatekeeper_project_role(p_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.project_members WHERE project_id = p_id AND user_id = auth.uid() AND status = 'accepted';
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. APPLY POLICIES (Using helpers only)

-- PROJECTS
CREATE POLICY "Projects - Select" ON public.projects FOR SELECT USING (public.gatekeeper_project_access(id));
CREATE POLICY "Projects - Modify" ON public.projects FOR ALL USING (owner_id = auth.uid() OR public.gatekeeper_project_role(id) = 'admin');

-- TEAMS
CREATE POLICY "Teams - Select" ON public.teams FOR SELECT USING (public.gatekeeper_team_access(id));
CREATE POLICY "Teams - All" ON public.teams FOR ALL 
  USING (owner_id = auth.uid() OR public.gatekeeper_project_role(project_id) IN ('admin', 'manager'))
  WITH CHECK (owner_id = auth.uid() OR public.gatekeeper_project_role(project_id) IN ('admin', 'manager'));

-- TEAM MEMBERS
CREATE POLICY "Team Members - Select" ON public.team_members FOR SELECT USING (public.gatekeeper_team_access(team_id));
CREATE POLICY "Team Members - Insert" ON public.team_members FOR INSERT WITH CHECK (public.gatekeeper_team_access(team_id));
CREATE POLICY "Team Members - Delete" ON public.team_members FOR DELETE USING (public.gatekeeper_team_access(team_id));

-- PROJECT MEMBERS
CREATE POLICY "Project Members - Select" ON public.project_members FOR SELECT USING (public.gatekeeper_project_access(project_id));
CREATE POLICY "Project Members - All" ON public.project_members FOR ALL 
  USING (public.gatekeeper_project_role(project_id) = 'admin' OR EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()))
  WITH CHECK (public.gatekeeper_project_role(project_id) = 'admin' OR EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()));

-- TASKS
CREATE POLICY "Tasks - Select" ON public.tasks FOR SELECT USING (public.gatekeeper_project_access(project_id));
CREATE POLICY "Tasks - All" ON public.tasks FOR ALL USING (
    public.gatekeeper_project_role(project_id) IN ('admin', 'manager') OR
    (created_by = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid())
) WITH CHECK (
    public.gatekeeper_project_role(project_id) IN ('admin', 'manager') OR
    (created_by = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid())
);
