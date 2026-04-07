# Task-O - Professional Task Management Application

A full-stack task management application built with Next.js 14, Tailwind CSS, and Supabase. This application provides a complete solution for managing projects, tasks, and team collaboration with real-time updates, Kanban boards, and comprehensive analytics.

## Features

- 🔐 **Authentication**: Secure user authentication with Supabase Auth
- 📊 **Dashboard**: Overview of projects, tasks, and deadlines
- 📁 **Project Management**: Create, edit, and manage projects
- ✅ **Task Management**: Full CRUD operations for tasks with priorities and due dates
- 📋 **Kanban Board**: Drag-and-drop Kanban board with real-time updates
- 💬 **Comments**: Task comments with real-time synchronization
- 🔔 **Notifications**: Real-time notifications for task updates
- 📈 **Reports & Analytics**: Comprehensive charts and statistics
- ⚙️ **User Settings**: Profile management and preferences
- 📱 **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Realtime**: Supabase Realtime
- **Storage**: Supabase Storage (for file attachments)
- **Deployment**: Vercel

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18+ and npm/yarn
- Git
- A Supabase account (free tier is sufficient)

## Step-by-Step Setup Guide

### Step 0: Prerequisites

1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Create a Supabase account at [supabase.com](https://supabase.com/)
3. Create a new Supabase project

### Step 1: Project Setup

1. Clone or download this repository:
```bash
cd Task-O
npm install
```

2. Copy the environment variables file:
```bash
cp .env.example .env.local
```

### Step 2: Database Setup (Supabase)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database/schema.sql`
4. Click **Run** to execute the schema
5. This will create all necessary tables, indexes, and RLS policies

#### Verify Database Setup

After running the schema, verify that these tables were created:
- `users`
- `projects`
- `tasks`
- `comments`
- `notifications`

### Step 3: Configure Supabase

1. In Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon/public key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role key** (SUPABASE_SERVICE_ROLE_KEY) - Keep this secret!

3. Update your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Enable Realtime (Optional but Recommended)

1. In Supabase dashboard, go to **Database** > **Replication**
2. Enable replication for these tables:
   - `tasks`
   - `comments`
   - `notifications`

### Step 5: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 6: Create Your First Account

1. Navigate to the signup page
2. Create a new account
3. The user profile will be automatically created via the database trigger

## Project Structure

```
Task-O/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── projects/          # Project pages (list, detail, new)
│   ├── tasks/             # Task pages (list, detail, new)
│   ├── kanban/            # Kanban board page
│   ├── reports/           # Reports & analytics page
│   ├── settings/          # User settings page
│   ├── login/             # Login page
│   └── signup/            # Signup page
├── components/            # React components
│   ├── Navbar.tsx         # Navigation bar
│   ├── DashboardLayout.tsx # Layout wrapper
│   ├── TaskList.tsx       # Task list component
│   ├── TaskComments.tsx   # Comments component
│   ├── KanbanBoard.tsx    # Kanban board component
│   ├── SettingsForm.tsx   # Settings form
│   └── ReportsCharts.tsx  # Analytics charts
├── lib/                   # Utility libraries
│   └── supabase/          # Supabase client configurations
│       ├── client.ts      # Client-side Supabase client
│       ├── server.ts      # Server-side Supabase client
│       └── middleware.ts  # Middleware for auth
├── database/              # Database schema
│   └── schema.sql         # Complete database schema
├── middleware.ts          # Next.js middleware for auth
└── README.md             # This file
```

## Key Features Implementation

### Authentication

- Supabase Auth handles user authentication
- Middleware protects routes automatically
- RLS (Row Level Security) ensures data privacy

### Real-time Updates

- Kanban board updates in real-time
- Comments sync across all clients
- Notifications appear instantly

### Data Security

- Row Level Security (RLS) policies protect user data
- Only authenticated users can access their own data
- Secure API routes for server-side operations

## Deployment to Vercel

### Step 10: Deploy to Vercel

1. Push your code to GitHub/GitLab/Bitbucket

2. Go to [vercel.com](https://vercel.com/) and sign in

3. Click **New Project**

4. Import your repository

5. Configure environment variables:
   - Add all variables from `.env.local`
   - Make sure to use production values

6. Click **Deploy**

7. Update your Supabase project settings:
   - Add your Vercel domain to allowed origins
   - Update redirect URLs in Supabase Auth settings

### Environment Variables for Production

In Vercel, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Best Practices Implemented

1. **Security**:
   - Row Level Security (RLS) on all tables
   - Secure authentication with Supabase Auth
   - Environment variables for sensitive data

2. **Performance**:
   - Database indexes on frequently queried columns
   - Optimistic UI updates
   - Efficient data fetching

3. **Scalability**:
   - Serverless architecture
   - Horizontal scaling with Vercel
   - Database connection pooling

4. **Code Quality**:
   - TypeScript for type safety
   - Consistent code formatting
   - Component-based architecture

## Troubleshooting

### Database Connection Issues

- Verify your Supabase URL and keys are correct
- Check that RLS policies are properly set up
- Ensure your IP is not blocked by Supabase

### Authentication Not Working

- Check Supabase Auth settings
- Verify redirect URLs are configured correctly
- Ensure middleware is properly set up

### Realtime Not Working

- Enable replication for necessary tables in Supabase
- Check that Realtime is enabled in your Supabase project
- Verify WebSocket connections are not blocked

## Support

For issues or questions:
1. Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
2. Check Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)
3. Review the code comments in this repository

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

