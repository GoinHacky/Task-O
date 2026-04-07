-- 1. NUCLEAR CLEANUP: Drop all previous policies
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

-- 2. SECURITY DEFINER HELPER FUNCTIONS (To break recursion)
CREATE OR REPLACE FUNCTION public.is_project_owner(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_id
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_accepted_project_member(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_id
    AND user_id = auth.uid()
    AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_project_admin_or_manager(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    public.is_project_owner(p_id) OR
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = p_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'manager', 'tech_lead')
      AND status = 'accepted'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_team_member(t_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = t_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. PROJECTS RLS
CREATE POLICY "Projects - Select" ON public.projects FOR SELECT 
USING (owner_id = auth.uid() OR public.is_accepted_project_member(id));

CREATE POLICY "Projects - Admin" ON public.projects FOR ALL 
USING (
    owner_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.project_members 
        WHERE project_id = public.projects.id 
        AND user_id = auth.uid() 
        AND role = 'admin' 
        AND status = 'accepted'
    )
);

-- 4. PROJECT MEMBERS RLS
CREATE POLICY "Project Members - Select" ON public.project_members FOR SELECT 
USING (
    user_id = auth.uid() OR 
    public.is_project_owner(project_id) OR
    public.is_accepted_project_member(project_id)
);

CREATE POLICY "Project Members - Admin" ON public.project_members FOR ALL
USING (public.is_project_admin_or_manager(project_id));

CREATE POLICY "Project Members - Self Update" ON public.project_members FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. TASKS RLS
CREATE POLICY "Tasks - Select" ON public.tasks FOR SELECT 
USING (
    public.is_project_admin_or_manager(project_id) OR 
    (public.is_accepted_project_member(project_id) AND (team_id IS NULL OR public.is_team_member(team_id)))
);

CREATE POLICY "Tasks - Modify" ON public.tasks FOR ALL 
USING (
    created_by = auth.uid() OR 
    assigned_to = auth.uid() OR 
    public.is_project_admin_or_manager(project_id) OR
    (team_id IS NOT NULL AND public.is_team_member(team_id))
);

-- 6. TEAMS RLS
CREATE POLICY "Teams - Select" ON public.teams FOR SELECT 
USING (
    owner_id = auth.uid() OR
    public.is_team_member(id) OR
    (project_id IS NOT NULL AND public.is_project_admin_or_manager(project_id))
);

CREATE POLICY "Teams - Insert" ON public.teams FOR INSERT 
WITH CHECK (
    auth.uid() = owner_id AND
    (project_id IS NULL OR public.is_project_admin_or_manager(project_id))
);

CREATE POLICY "Teams - Modify" ON public.teams FOR ALL 
USING (owner_id = auth.uid());

-- 7. TEAM MEMBERS RLS
CREATE POLICY "Team Members - Select" ON public.team_members FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.teams 
        WHERE id = team_members.team_id
    )
);

CREATE POLICY "Team Members - Admin" ON public.team_members FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.teams 
        WHERE id = team_members.team_id 
        AND owner_id = auth.uid()
    )
);

-- 8. TEAM INVITATIONS RLS
CREATE POLICY "Team Invitations - Select" ON public.team_invitations FOR SELECT 
USING (
    email = (SELECT email FROM public.users WHERE id = auth.uid()) OR
    inviter_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.teams 
        WHERE id = team_invitations.team_id 
        AND owner_id = auth.uid()
    )
);

CREATE POLICY "Team Invitations - Admin" ON public.team_invitations FOR ALL
USING (
    inviter_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.teams 
        WHERE id = team_invitations.team_id 
        AND owner_id = auth.uid()
    )
);

-- 9. USERS RLS
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
