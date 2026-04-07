-- Team Management Schema for Task-O

-- Teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  team_type TEXT DEFAULT 'General',
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'member', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Team invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'member', 'viewer')),
  inviter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  token UUID DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, email)
);

-- Add team_id to projects (Existing)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='team_id') THEN
    ALTER TABLE public.projects ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add project_id to teams (New Requirement)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='project_id') THEN
    ALTER TABLE public.teams ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add team_id to tasks
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='team_id') THEN
    ALTER TABLE public.tasks ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.check_team_membership(t_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = t_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_team_role(t_id UUID, required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = t_id
    AND user_id = auth.uid()
    AND role = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
DROP POLICY IF EXISTS "Users can view teams they are members of" ON public.teams;
CREATE POLICY "Users can view teams they are members of"
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    auth.uid() = owner_id OR 
    public.check_team_membership(id) OR
    EXISTS (
      SELECT 1 FROM public.team_invitations
      WHERE team_id = public.teams.id
      AND email = (SELECT email FROM public.users WHERE id = auth.uid())
      AND status = 'pending'
    )
  );

DROP POLICY IF EXISTS "Owners can update their teams" ON public.teams;
CREATE POLICY "Owners can update their teams"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their teams" ON public.teams;
CREATE POLICY "Owners can delete their teams"
  ON public.teams FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Function to handle team invitations (create notification)
CREATE OR REPLACE FUNCTION public.handle_team_invitation()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  team_name TEXT;
BEGIN
  -- Get the team name
  SELECT name INTO team_name FROM public.teams WHERE id = NEW.team_id;

  -- Try to find the user by email
  SELECT id INTO target_user_id FROM public.users WHERE email = NEW.email;

  -- If user exists, create a notification
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, message, related_id)
    VALUES (
      target_user_id,
      'team_invitation',
      'You have been invited to join the team: ' || team_name,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for team invitations
DROP TRIGGER IF EXISTS on_team_invitation ON public.team_invitations;
CREATE TRIGGER on_team_invitation
  AFTER INSERT ON public.team_invitations
  FOR EACH ROW EXECUTE FUNCTION public.handle_team_invitation();

DROP POLICY IF EXISTS "Members can view other members of their teams" ON public.team_members;
CREATE POLICY "Members can view other members of their teams"
  ON public.team_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    public.check_team_membership(team_id)
  );

DROP POLICY IF EXISTS "Owners and admins can manage members" ON public.team_members;
CREATE POLICY "Owners and admins can manage members"
  ON public.team_members FOR ALL
  USING (public.check_team_role(team_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.check_team_role(team_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Users can join teams via invitation" ON public.team_members;
CREATE POLICY "Users can join teams via invitation"
  ON public.team_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.team_invitations
      WHERE team_id = public.team_members.team_id
      AND email = (SELECT email FROM public.users WHERE id = auth.uid())
      AND status = 'pending'
    )
  );

-- RLS Policies for team_invitations
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON public.team_invitations;
CREATE POLICY "Users can view invitations sent to their email"
  ON public.team_invitations FOR SELECT
  USING (
    email = (SELECT email FROM public.users WHERE id = auth.uid()) OR
    public.check_team_role(team_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Owners and admins can create/delete invitations" ON public.team_invitations;
CREATE POLICY "Owners and admins can create/delete invitations"
  ON public.team_invitations FOR ALL
  USING (public.check_team_role(team_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.check_team_role(team_id, ARRAY['owner', 'admin']));

-- Function to handle team creation (add owner as member)
CREATE OR REPLACE FUNCTION public.handle_team_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for team creation
DROP TRIGGER IF EXISTS on_team_created ON public.teams;
CREATE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_team_creation();

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Update projects RLS to include team access
DROP POLICY IF EXISTS "Users can view their own projects or team projects" ON public.projects;
CREATE POLICY "Users can view their own projects or team projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    auth.uid() = owner_id OR
    (team_id IS NOT NULL AND public.check_team_membership(team_id))
  );
