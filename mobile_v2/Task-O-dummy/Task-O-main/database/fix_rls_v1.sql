-- Consolidation and Fix for Project & Team Visibility RLS

-- 1. Ensure projects are visible to all members (project_members OR team_members)
DROP POLICY IF EXISTS "Members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own projects or team projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;

CREATE POLICY "Members can view projects"
  ON public.projects FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = public.projects.id
      AND user_id = auth.uid()
      AND status = 'accepted'
    ) OR
    EXISTS (
      SELECT 1 FROM public.teams
      INNER JOIN public.team_members ON teams.id = team_members.team_id
      WHERE teams.project_id = public.projects.id
      AND team_members.user_id = auth.uid()
    )
  );

-- 2. Ensure teams are visible to project members
DROP POLICY IF EXISTS "Users can view teams they are members of" ON public.teams;
DROP POLICY IF EXISTS "Project members can view project teams" ON public.teams;

CREATE POLICY "Users can view teams in their projects"
  ON public.teams FOR SELECT
  USING (
    owner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = public.teams.id
      AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = public.teams.project_id
      AND user_id = auth.uid()
      AND status = 'accepted'
    ) OR
    -- Owners of the project should see all teams
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = public.teams.project_id
      AND owner_id = auth.uid()
    )
  );

-- 3. Ensure team members can view other members
DROP POLICY IF EXISTS "Members can view other members of their teams" ON public.team_members;
CREATE POLICY "Members can view team members if they have team/project access"
  ON public.team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = public.team_members.team_id
      AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.team_members tm2
          WHERE tm2.team_id = public.teams.id
          AND tm2.user_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_id = public.teams.project_id
          AND user_id = auth.uid()
        )
      )
    )
  );
