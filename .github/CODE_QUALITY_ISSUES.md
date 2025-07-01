# Code Quality Issues to Address

This document tracks ESLint and Prettier issues that need to be resolved for full code quality compliance.

## ESLint Issues

### React Unescaped Entities (3 errors)
- **Files**: `app/not-found.tsx`, `app/recruiters/[slug]/not-found.tsx`
- **Issue**: Apostrophes need to be escaped in JSX
- **Solution**: Replace `'` with `&apos;` or use template literals

### Missing Display Name (1 error)
- **File**: `components/__tests__/AgencyCard.navigation.test.tsx`
- **Issue**: Component definition missing display name
- **Solution**: Add displayName to component or use named function

### Image Optimization Warning (1 warning)
- **File**: `app/recruiters/[slug]/page.tsx`
- **Issue**: Using `<img>` instead of Next.js `<Image />`
- **Solution**: Import and use `next/image` for better performance

## Prettier Issues

### Formatting Inconsistencies (240 files)
- **Issue**: Code formatting doesn't match Prettier configuration
- **Solution**: Run `npm run format` to auto-fix all formatting issues

## CI/CD Impact
The CI pipeline will fail on:
- Any ESLint errors (not warnings)
- Any Prettier formatting issues

This ensures consistent code quality across the codebase.

## Resolution Commands
```bash
# Auto-fix Prettier issues
npm run format

# Check ESLint issues
npm run lint

# Check Prettier issues
npm run format:check
```