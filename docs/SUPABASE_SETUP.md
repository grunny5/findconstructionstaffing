# Supabase Project Setup Instructions

## Task 1.1: Create Supabase Project

### Steps to Create the Project:

1. **Go to Supabase Dashboard**
   - Navigate to https://supabase.com
   - Sign in or create an account

2. **Create New Project**
   - Click "New Project"
   - Enter the following details:
     - **Project Name**: `findconstructionstaffing`
     - **Database Password**: Use a strong, unique password (save this securely)
     - **Region**: Choose the closest region to your primary user base (e.g., `us-east-1` for East Coast US)
     - **Pricing Plan**: Start with Free tier (can upgrade later)

3. **Configure Project Settings**
   - After creation, go to Settings > General
   - Enable "Email Confirmations" for security
   - Note down the following credentials:
     - **Project URL**: `https://[YOUR_PROJECT_REF].supabase.co`
     - **Anon/Public Key**: Found in Settings > API
     - **Service Role Key**: Found in Settings > API (keep this extra secure)

4. **Save Credentials**
   - Create a secure password manager entry with:
     - Project URL
     - Anon Key
     - Service Role Key
     - Database Password

### Important Notes:
- The project reference (part of the URL) is unique and cannot be changed
- The anon key is safe to use in client-side code
- The service role key should NEVER be exposed to client-side code
- Database password is only needed for direct database connections

### Next Steps:
After completing this manual setup, proceed to Task 1.2 to configure environment variables in the application.

---

## Task 1.2: Configure Environment Variables

### Steps to Configure:

1. **Create .env.local file**
   ```bash
   cp .env.local.template .env.local
   ```

2. **Add your Supabase credentials**
   Edit `.env.local` and replace the placeholders:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
   ```

3. **Test the connection**
   ```bash
   node scripts/test-supabase-connection.js
   ```

4. **Verify in development**
   ```bash
   npm run dev
   ```
   The application should now connect to Supabase instead of using mock data.

### Security Notes:
- Never commit `.env.local` to version control
- The anon key is safe for client-side use
- Keep the service role key secret and only use server-side

---

## Task 2.1: Create Core Tables

### Steps to Create Tables:

1. **Run the table creation script**
   ```bash
   node scripts/create-tables.js
   ```
   This will display the SQL you need to run.

2. **Execute SQL in Supabase**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor (in the left sidebar)
   - Copy the SQL from the script output
   - Click "Run" to execute

3. **Verify tables were created**
   ```bash
   node scripts/verify-tables.js
   ```

### Tables Created:
- **agencies** - Main agency directory table
- **trades** - Construction trade specialties
- **regions** - Service areas/regions

### Features Included:
- UUID primary keys for all tables
- Automatic updated_at timestamps
- Proper constraints and data types
- Comments for documentation