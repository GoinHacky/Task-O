-- Activity Tracking and Lifecycle Expansion

-- Update tasks status check constraint
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'in_progress', 'review', 'completed'));

-- Activities table for immutable audit log
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view activities in their projects" ON public.activities;
CREATE POLICY "Users can view activities in their projects"
    ON public.activities FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.project_members WHERE project_id = public.activities.project_id
            UNION
            SELECT owner_id FROM public.projects WHERE id = public.activities.project_id
        )
    );

-- Activities are IMMUTABLE: No INSERT/UPDATE/DELETE policies for general users
-- Server side actions will handle insertions via service role or defined triggers if needed

-- Indexing
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON public.activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_task_id ON public.activities(task_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at);

-- Trigger for comments to log activity
CREATE OR REPLACE FUNCTION public.handle_comment_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.activities (project_id, user_id, task_id, type, message)
    VALUES (
        (SELECT project_id FROM public.tasks WHERE id = NEW.task_id),
        NEW.user_id,
        NEW.task_id,
        'comment_added',
        'Added a comment to the task'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_comment_activity();
