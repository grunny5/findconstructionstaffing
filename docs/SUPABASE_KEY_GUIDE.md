# Supabase API Key Guide

## Where to Find Your Anon Key

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Log in to your account

2. **Select Your Project**
   - Click on your project from the dashboard

3. **Navigate to API Settings**
   - Click on "Settings" in the left sidebar
   - Click on "API" under the Configuration section

4. **Find the Correct Key**
   - Look for a section called "Project API keys"
   - You need the **"anon public"** key (NOT "service_role")
   - It should start with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - It's a very long string (200+ characters)

## What the Keys Look Like

- **Anon/Public Key**: Safe for client-side use
  - Example format: `eyJhbGci…<redacted>…gp6I`

- **Service Role Key**: NEVER use client-side
  - Similar format but with "service_role" in the payload

## How to Copy the Key

1. Click the "Copy" button next to the anon key
2. Or select the entire key and copy with Ctrl+C
3. Make sure you get the ENTIRE key (it's long!)

## Troubleshooting

If you're getting a 401 error, check:

- ✅ You're copying the "anon public" key, not "service_role"
- ✅ You're copying the ENTIRE key (check for truncation)
- ✅ Your project is active (not paused)
- ✅ The key matches your project URL
