-- Migration to add metadata column to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update RLS if necessary (usually not needed for just adding a column unless policies are very restrictive)
COMMENT ON COLUMN notifications.metadata IS 'Extra contextual data for the notification (e.g. project name, due date)';
