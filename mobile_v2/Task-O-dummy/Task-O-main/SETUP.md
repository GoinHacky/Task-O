# Task-O Setup Guide

This guide will walk you through setting up the Task-O application step by step.

## Table of Contents

- [Step 0: Prerequisites](#step-0-prerequisites)
- [Step 1: Project Setup](#step-1-project-setup)
- [Step 2: Database Setup (Supabase)](#step-2-database-setup-supabase)
- [Step 3: Configure Supabase](#step-3-configure-supabase)
- [Step 4: Enable Realtime](#step-4-enable-realtime)
- [Step 5: Storage Setup (Buckets)](#step-5-storage-setup-buckets)
- [Step 6: Run the Development Server](#step-6-run-the-development-server)
- [Step 6: Create Your First Account](#step-6-create-your-first-account)
- [Step 10: Deploy to Vercel](#step-10-deploy-to-vercel)

## Step 0: Prerequisites

Before you begin, ensure you have:

1. **Node.js 18+** installed
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm or yarn** package manager
   - npm comes with Node.js
   - Verify installation: `npm --version`

3. **Git** installed (optional, for version control)
   - Download from [git-scm.com](https://git-scm.com/)

4. **A Supabase account** (free tier works)
   - Sign up at [supabase.com](https://supabase.com/)
   - Create a new project (takes about 2 minutes)

## Step 1: Project Setup

1. **Install Dependencies**

```bash
npm install
```

This will install all required packages:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Supabase client libraries
- And more...

2. **Create Environment File**

Copy `env.example.txt` to `.env.local`:

```bash
# On Windows (PowerShell)
Copy-Item env.example.txt .env.local

# On macOS/Linux
cp env.example.txt .env.local
```

Or manually create `.env.local` with these variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 2: Database Setup (Supabase)

1. **Open Supabase Dashboard**

   - Go to [app.supabase.com](https://app.supabase.com/)
   - Select your project

2. **Navigate to SQL Editor**

   - Click on **SQL Editor** in the left sidebar
   - Click **New query**

3. **Run the Schema**

   - Open `database/schema.sql` from this project
   - Copy all the contents
   - Paste into the SQL Editor
   - Click **Run** (or press Ctrl+Enter)

4. **Verify Tables Were Created**

   - Go to **Table Editor** in the sidebar
   - You should see these tables:
     - `users`
     - `projects`
     - `tasks`
     - `comments`
     - `notifications`

## Step 3: Configure Supabase

1. **Get Your Supabase Credentials**

   - In Supabase dashboard, go to **Settings** > **API**
   - You'll need these values:

2. **Copy Project URL**

   - Look for **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - Copy this value

3. **Copy Anon Key**

   - Look for **anon/public key**
   - Copy this value

4. **Copy Service Role Key** (Keep Secret!)

   - Look for **service_role key**
   - **Warning**: This key has admin privileges. Never commit it to version control.
   - Copy this value

5. **Update `.env.local`**

   Open `.env.local` and replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Enable Realtime (Optional but Recommended)

For real-time updates in the Kanban board and notifications:

1. **Go to Database > Replication** in Supabase dashboard

2. **Enable Replication** for these tables:
   - `tasks`
   - `comments`
   - `notifications`

3. **Click the toggle** next to each table to enable replication

## Step 5: Storage Setup (Buckets)

For profile picture uploads to work:

1. **Go to Storage** in Supabase dashboard
2. **Create a New Bucket** named `avatars`
3. **Set the Bucket to Public** (this allows images to be viewed without a token)
4. **Configure RLS Policies** for the `avatars` bucket:
   - Click **Storage** > **Configuration** > **Policies**
   - Click **New Policy** for the `objects` table:
     - **Select**: Allow public access to all objects (check "READ")
     - **Insert**: Allow authenticated users to upload their own file (check "INSERT" and "authenticated" role)
     - **Update/Delete**: Allow users to manage their own objects

   **Alternatively, run this SQL in the SQL Editor**:

   ```sql
   -- Create the bucket
   insert into storage.buckets (id, name, public)
   values ('avatars', 'avatars', true);

   -- Allow public access to avatars
   create policy "Public Access"
   on storage.objects for select
   using ( bucket_id = 'avatars' );

   -- Allow authenticated users to upload their own avatar
   create policy "Authenticated users can upload an avatar"
   on storage.objects for insert
   with check (
     bucket_id = 'avatars' 
     AND auth.role() = 'authenticated'
   );

   -- Allow users to update/delete their own avatar
   create policy "Users can update their own avatar"
   on storage.objects for update
   using ( auth.uid() = (storage.foldername(name))[1]::uuid AND bucket_id = 'avatars' );

   create policy "Users can delete their own avatar"
   on storage.objects for delete
   using ( auth.uid() = (storage.foldername(name))[1]::uuid AND bucket_id = 'avatars' );
   ```

## Step 5: Run the Development Server

1. **Start the Development Server**

```bash
npm run dev
```

2. **Open Your Browser**

   - Navigate to [http://localhost:3000](http://localhost:3000)
   - You should be redirected to the login page

## Step 6: Create Your First Account

1. **Navigate to Signup Page**

   - Click **Sign up** or go to [http://localhost:3000/signup](http://localhost:3000/signup)

2. **Fill in the Form**

   - Enter your full name
   - Enter your email address
   - Enter a password (minimum 6 characters)

3. **Create Account**

   - Click **Sign up**
   - You'll be redirected to the dashboard

4. **Verify Profile Created**

   - Your user profile should be automatically created
   - You can check in Supabase **Table Editor** > `users`

## Step 10: Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard

1. **Push Code to GitHub**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Import Project in Vercel**

   - Go to [vercel.com](https://vercel.com/)
   - Sign in with GitHub
   - Click **Add New...** > **Project**
   - Import your repository

3. **Configure Environment Variables**

   In Vercel project settings:
   - Go to **Settings** > **Environment Variables**
   - Add each variable from `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NEXT_PUBLIC_APP_URL` (use your Vercel URL)

4. **Deploy**

   - Click **Deploy**
   - Wait for deployment to complete

5. **Update Supabase Settings**

   - In Supabase dashboard, go to **Authentication** > **URL Configuration**
   - Add your Vercel URL to **Redirect URLs**:
     - `https://your-app.vercel.app/**`
   - Add your Vercel URL to **Site URL**:
     - `https://your-app.vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts
```

## Troubleshooting

### Issue: Database Connection Error

**Solution:**
- Verify your Supabase URL and keys in `.env.local`
- Check that the schema was run successfully
- Ensure your IP is not blocked in Supabase

### Issue: Authentication Not Working

**Solution:**
- Check Supabase **Authentication** > **URL Configuration**
- Add `http://localhost:3000` to allowed URLs
- Verify redirect URLs are configured correctly

### Issue: Realtime Not Updating

**Solution:**
- Ensure replication is enabled for necessary tables
- Check Supabase **Database** > **Replication** settings
- Verify WebSocket connections are not blocked

### Issue: Build Errors

**Solution:**
- Clear `.next` folder: `rm -rf .next` (or `rmdir /s .next` on Windows)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: should be 18+

## Next Steps

Once setup is complete:

1. Create your first project
2. Add tasks to your project
3. Use the Kanban board to organize tasks
4. Invite team members (when implemented)
5. Explore reports and analytics

## Support

For issues or questions:
- Check the [README.md](README.md) for more details
- Review Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Review Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)

Happy task managing! 🚀

