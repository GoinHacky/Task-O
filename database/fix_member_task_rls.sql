-- Fix Task RLS to allow assigned users to update status/boards
DROP POLICY IF EXISTS "Tasks - Modify" ON public.tasks;
CREATE POLICY "Tasks - Modify" ON public.tasks FOR ALL 
USING (
    created_by = auth.uid() OR 
    assigned_to = auth.uid() OR 
    public.is_project_admin_or_manager(project_id)
);

-- Allow authenticated users to insert notifications for colleagues
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" ON public.notifications FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
