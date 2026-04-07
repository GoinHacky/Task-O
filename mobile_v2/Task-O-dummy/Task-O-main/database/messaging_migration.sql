-- Enable Realtime for messaging
-- Note: You may need to run this in the Supabase SQL Editor if it's already enabled for other tables.

-- Create Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Conversation Participants table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(conversation_id, user_id)
);

-- Create Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_read BOOLEAN DEFAULT false
);

-- RLS for messaging
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
    ON public.conversations FOR SELECT
    USING (id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()));

CREATE POLICY "Users can view conversation participants"
    ON public.conversation_participants FOR SELECT
    USING (conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()));

CREATE POLICY "Users can view messages in their conversations"
    ON public.messages FOR SELECT
    USING (conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()));

CREATE POLICY "Users can send messages in their conversations"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id AND conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()));

-- UPDATE RLS for projects to support members
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view projects they are members of"
    ON public.projects FOR SELECT
    USING (
        auth.uid() = owner_id OR 
        id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
    );

-- UPDATE RLS for tasks to support project members
DROP POLICY IF EXISTS "Users can view tasks assigned to them or in their projects" ON public.tasks;
CREATE POLICY "Users can view tasks in their projects"
    ON public.tasks FOR SELECT
    USING (
        auth.uid() = assigned_to OR
        project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid()) OR
        auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = project_id)
    );

-- Add to Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
