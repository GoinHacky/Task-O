-- Fix Activities RLS to allow insertions from authenticated users
DROP POLICY IF EXISTS "Users can log activities in their projects" ON public.activities;
CREATE POLICY "Users can log activities in their projects"
    ON public.activities FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid() IN (
            SELECT user_id FROM public.project_members WHERE project_id = activities.project_id
            UNION
            SELECT owner_id FROM public.projects WHERE id = activities.project_id
        )
    );

-- Also ensure SELECT policy is robust
DROP POLICY IF EXISTS "Users can view activities in their projects" ON public.activities;
CREATE POLICY "Users can view activities in their projects"
    ON public.activities FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.project_members WHERE project_id = activities.project_id
            UNION
            SELECT owner_id FROM public.projects WHERE id = activities.project_id
        )
    );
