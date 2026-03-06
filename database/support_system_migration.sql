-- Migration: Support System Tables and RLS
-- This migration creates the tables for the support module

-- 0. Add platform admin role to users (Required for policies)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT false;

-- 1. Create support_requests table
CREATE TABLE IF NOT EXISTS public.support_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id TEXT UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Bug', 'UI Issue', 'Performance', 'Suggestion', 'Other')),
  where_did_it_happen TEXT CHECK (where_did_it_happen IN ('Dashboard', 'Boards', 'Tasks', 'Inbox', 'Login', 'Settings', 'Other')),
  severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Reviewed', 'In Progress', 'Resolved', 'Closed')),
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  expected_result TEXT,
  screenshot_url TEXT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  page_url TEXT,
  browser_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create support_comments table
CREATE TABLE IF NOT EXISTS public.support_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.support_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_admin_note BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create support_activity_log table
CREATE TABLE IF NOT EXISTS public.support_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.support_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  from_value TEXT,
  to_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Function to generate ticket_id (SUP-XXXX)
CREATE OR REPLACE FUNCTION generate_ticket_id() 
RETURNS TRIGGER AS $$
DECLARE
  new_ticket_id TEXT;
  seq_val BIGINT;
BEGIN
  -- We'll use a sequence if it exists, or just a random number for simplicity in this migration
  -- In a production app, a sequence is better for sequential IDs
  seq_val := (SELECT count(*) + 1000 FROM public.support_requests);
  new_ticket_id := 'SUP-' || seq_val;
  NEW.ticket_id := new_ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket_id
DROP TRIGGER IF EXISTS tr_generate_ticket_id ON public.support_requests;
CREATE TRIGGER tr_generate_ticket_id
BEFORE INSERT ON public.support_requests
FOR EACH ROW
WHEN (NEW.ticket_id IS NULL)
EXECUTE FUNCTION generate_ticket_id();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_support_requests_user_id ON public.support_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON public.support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_comments_request_id ON public.support_comments(request_id);
CREATE INDEX IF NOT EXISTS idx_support_activity_request_id ON public.support_activity_log(request_id);

-- 6. RLS Policies
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_activity_log ENABLE ROW LEVEL SECURITY;

-- Support Requests
CREATE POLICY "Users can view their own support requests"
  ON public.support_requests FOR SELECT
  USING (auth.uid() = user_id OR (SELECT is_platform_admin FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own support requests"
  ON public.support_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all support requests"
  ON public.support_requests FOR UPDATE
  USING ((SELECT is_platform_admin FROM public.users WHERE id = auth.uid()));

-- Support Comments
CREATE POLICY "Users can view comments on their own requests"
  ON public.support_comments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.support_requests WHERE id = request_id AND user_id = auth.uid()) 
    OR 
    (SELECT is_platform_admin FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert comments on their own requests"
  ON public.support_comments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.support_requests WHERE id = request_id AND user_id = auth.uid()) 
    OR 
    (SELECT is_platform_admin FROM public.users WHERE id = auth.uid())
  );

-- Support Activity Log
CREATE POLICY "Users can view activity on their own requests"
  ON public.support_activity_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.support_requests WHERE id = request_id AND user_id = auth.uid()) 
    OR 
    (SELECT is_platform_admin FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Anyone can insert activity logs for their own actions"
  ON public.support_activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_requests;
  EXCEPTION WHEN duplicate_object THEN
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_comments;
  EXCEPTION WHEN duplicate_object THEN
  END;
END $$;
