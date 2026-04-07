-- Consolidated Messaging System Setup (Base + Updates)
-- Includes: Conversations, DMs, Team Chats, and File Attachments

-- 1. BASE TABLES
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_team BOOLEAN DEFAULT false,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    name TEXT,
    avatar_url TEXT
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_type TEXT
);

-- 2. SECURITY (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations Policy
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their conversations or team conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations or team conversations"
    ON public.conversations FOR SELECT
    USING (
        id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()) OR
        (is_team = true AND team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()))
    );

-- Participants Policy
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
CREATE POLICY "Users can view conversation participants"
    ON public.conversation_participants FOR SELECT
    USING (conversation_id IN (
        SELECT id FROM public.conversations 
        WHERE id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()) OR
        (is_team = true AND team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()))
    ));

-- Messages Policy (Select)
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations or team conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations or team conversations"
    ON public.messages FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM public.conversations 
            WHERE id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()) OR
            (is_team = true AND team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()))
        )
    );

-- Messages Policy (Insert)
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
CREATE POLICY "Users can send messages in conversations they belong to"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND 
        conversation_id IN (
            SELECT id FROM public.conversations 
            WHERE id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()) OR
            (is_team = true AND team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()))
        )
    );

-- 3. TRIGGERS & AUTOMATION

-- Handle Team Conversation Creation
CREATE OR REPLACE FUNCTION public.handle_team_conversation_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.conversations (is_team, team_id, name)
  VALUES (true, NEW.id, NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_team_conversation_created ON public.teams;
CREATE TRIGGER on_team_conversation_created
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_team_conversation_creation();

-- 4. REALTIME CONFIGURATION
-- Ensure tables are in the realtime publication
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversation_participants') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
    END IF;
END $$;
