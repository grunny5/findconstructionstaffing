# Supabase CLI Manual Installation

## Steps:

1. **Download the file**
   - Download: `supabase_windows_amd64.tar.gz`

2. **Extract the file**
   - You'll need a tool like 7-Zip or WinRAR to extract .tar.gz files
   - Extract it to a folder like `C:\tools\supabase\`

3. **Add to PATH (Option A - Project Only)**
   - Copy `supabase.exe` to your project root folder
   - You can then use: `.\supabase --version`

4. **Add to PATH (Option B - System Wide)**
   - Add the folder containing `supabase.exe` to your system PATH
   - Windows Settings → System → About → Advanced system settings
   - Environment Variables → Path → Edit → New
   - Add the folder path (e.g., `C:\tools\supabase`)
   - Restart your terminal

5. **Verify installation**
   ```powershell
   supabase --version
   ```

## After Installation:

```powershell
# Login to Supabase
supabase login

# Initialize in your project folder
cd C:\Users\tedgr\findconstructionstaffing-1
supabase init

# Link to your project
supabase link --project-ref chyaqualjbhkykgofcov

# Push the migration
supabase db push
```