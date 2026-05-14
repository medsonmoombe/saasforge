-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organizations table
CREATE POLICY org_isolation_policy ON organizations
  USING (clerk_org_id = current_setting('app.current_org_id', true));

-- Create RLS policies for projects table
CREATE POLICY project_isolation_policy ON projects
  USING (org_id::text = current_setting('app.current_org_id', true));

-- Create RLS policies for memberships table
CREATE POLICY membership_isolation_policy ON memberships
  USING (org_id::text = current_setting('app.current_org_id', true));
