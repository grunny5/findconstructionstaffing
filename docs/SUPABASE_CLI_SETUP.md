# Supabase CLI Setup Guide

## Installation

### Option 1: Using npm (Recommended)
```bash
npm install -g supabase
```

### Option 2: Using Homebrew (macOS/Linux)
```bash
brew install supabase/tap/supabase
```

### Option 3: Using Scoop (Windows)
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

## Verify Installation
```bash
supabase --version
```

## Initialize Supabase in Your Project

1. **Login to Supabase CLI**
   ```bash
   supabase login
   ```
   This will open a browser window for authentication.

2. **Initialize Supabase**
   ```bash
   supabase init
   ```
   This creates a `supabase` directory with config files.

3. **Link to Your Project**
   ```bash
   supabase link --project-ref chyaqualjbhkykgofcov
   ```
   You'll need your database password (from when you created the project).

## Benefits of Using CLI

- **Run migrations directly**: `supabase db push`
- **Generate TypeScript types**: `supabase gen types typescript`
- **Local development**: `supabase start` for local Supabase instance
- **Version control**: Track all schema changes in Git
- **Team collaboration**: Everyone uses the same migrations

## Next Steps

Once the CLI is set up, we can:
1. Push our existing migration files
2. Generate TypeScript types automatically
3. Run all future migrations via CLI