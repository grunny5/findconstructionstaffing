# Environment Configuration Guide

This guide covers environment setup for the FindConstructionStaffing platform, including local development, staging, and production environments.

## Quick Start

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials
3. Restart your development server

## Environment Variables

### Required Variables

| Variable                        | Description                       | Example                      |
| ------------------------------- | --------------------------------- | ---------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL         | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key for Supabase | `eyJhbGc...`                 |

### Optional Variables (Future)

| Variable                       | Description                         | Default                 |
| ------------------------------ | ----------------------------------- | ----------------------- |
| `NEXT_PUBLIC_APP_URL`          | Application URL                     | `http://localhost:3000` |
| `SUPABASE_SERVICE_ROLE_KEY`    | Service role key (server-side only) | -                       |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics tracking           | `false`                 |

## Setup by Environment

### Local Development

1. Create `.env.local` file:

```bash
cp .env.example .env.local
```

2. Add your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Verify setup:

```bash
node scripts/test-supabase-connection.js
```

### Staging Environment

For Vercel deployment:

1. Go to Project Settings → Environment Variables
2. Add each variable for "Preview" environment
3. Redeploy to apply changes

### Production Environment

1. Use separate Supabase project for production
2. Set environment variables in hosting platform
3. Enable additional security measures:
   - Rate limiting
   - IP allowlisting (if applicable)
   - Monitoring alerts

## Security Best Practices

### DO:

- ✅ Keep `.env.local` in `.gitignore`
- ✅ Use different credentials per environment
- ✅ Rotate keys periodically
- ✅ Use `NEXT_PUBLIC_` prefix only for client-safe variables
- ✅ Store service role keys securely (never in client code)

### DON'T:

- ❌ Commit real credentials to version control
- ❌ Share credentials in public channels
- ❌ Use production credentials in development
- ❌ Expose service role keys to client
- ❌ Hard-code credentials in source files

## Loading Environment Variables

### Next.js (Automatic)

Next.js automatically loads from `.env.local`:

```javascript
// Automatically available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
```

### Node.js Scripts

For standalone scripts, load manually:

```javascript
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;

    const equalIndex = line.indexOf('=');
    if (equalIndex > 0) {
      const key = line.substring(0, equalIndex).trim();
      const value = line.substring(equalIndex + 1).trim();
      process.env[key] = value;
    }
  });
}
```

## Debugging Environment Issues

### Check Loaded Variables

```javascript
// Debug script
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Has Anon Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
```

### Common Issues

1. **Variables undefined in browser**
   - Ensure variables start with `NEXT_PUBLIC_`
   - Restart Next.js dev server after changes

2. **Scripts can't find variables**
   - Check file path to `.env.local`
   - Verify file exists and has correct content

3. **Different behavior in production**
   - Verify environment variables in hosting platform
   - Check for typos in variable names

## CI/CD Configuration

### GitHub Actions

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

### Vercel

Set in Project Settings → Environment Variables

### Docker

```dockerfile
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Validation Script

Create `scripts/validate-env.js`:

```javascript
const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing environment variables:');
  missing.forEach((key) => console.error(`  - ${key}`));
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set');
}
```

## Migration Guide

When adding new environment variables:

1. Add to `.env.example` with description
2. Update this documentation
3. Add to validation script
4. Notify team of required action
5. Update CI/CD configurations

---

**Last Updated**: 2025-06-25
**Version**: 1.0.0
