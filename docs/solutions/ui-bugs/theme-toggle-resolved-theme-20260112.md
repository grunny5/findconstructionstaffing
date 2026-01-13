---
title: Theme Toggle Not Reflecting Actual Visual State
date: 2026-01-12
problem_type: ui_bug
component: react_component
module: UI/UX - Theme System
symptoms:
  - "Theme toggle button doesn't reflect actual visual theme when system preference is set"
  - "Clicking toggle sets theme='dark' but no visual change when already in dark mode via system preference"
  - "Mismatch between toggle state and CSS dark: classes"
root_cause: using_theme_instead_of_resolved_theme
resolution_type: code_fix
severity: moderate
tags: [next-themes, dark-mode, theme-toggle, system-preference, ui-state]
related_prs:
  - "https://github.com/grunny5/findconstructionstaffing/pull/663"
author: Claude Code
---

# Theme Toggle Not Reflecting Actual Visual State

## Problem Description

When implementing dark mode with next-themes, the ThemeToggle component used `theme` state instead of `resolvedTheme`, causing a mismatch between the toggle button state and the actual visual theme displayed to users.

**Specific symptom**: When a user has their theme set to 'system' and their OS is in dark mode:
- The UI correctly shows dark mode (CSS `dark:` classes work correctly)
- But clicking the theme toggle button sets `theme='dark'` with no visual change
- The toggle button doesn't reflect what the user actually sees on screen

## Technical Context

**Component**: `components/ThemeToggle.tsx`
**Library**: next-themes v0.3.0
**Framework**: Next.js 13.5.1 with App Router
**Implementation Phase**: Phase 2 - Industrial Design Completion
**Discovery**: CodeRabbit PR review #663

## Root Cause Analysis

The issue stems from the difference between `theme` and `resolvedTheme` in next-themes:

- **`theme`**: The user's preference setting ('light', 'dark', or 'system')
- **`resolvedTheme`**: The actual theme being displayed ('light' or 'dark' only)

When `theme === 'system'`:
- CSS classes use `resolvedTheme` to apply `dark:` styles
- The visual UI is determined by `resolvedTheme` (which resolves to 'light' or 'dark')
- But the toggle logic was checking `theme === 'dark'`, which is false
- This created a disconnect: user sees dark mode, but button thinks it's in system mode

## Investigation Timeline

### Initial Implementation
```typescript
// ❌ WRONG - Uses theme for toggle logic
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Sun className="dark:-rotate-90 dark:scale-0" />
      <Moon className="dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

**Problem**: When `theme='system'` and OS is dark:
- User sees dark mode visually
- Button checks `theme === 'dark'` → false
- Clicking button sets `theme='dark'` → no visual change
- User confusion: "Why didn't it toggle?"

### CodeRabbit Review Caught It
PR #663 review comment:
> "Use `resolvedTheme` instead of `theme` for toggle logic to match visual theme behavior. When theme is 'system', the CSS classes (dark:) render based on resolvedTheme, but the toggle comparison uses theme."

## Solution

Use `resolvedTheme` for all visual state logic:

```typescript
// ✅ CORRECT - Uses resolvedTheme for toggle logic
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <Button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Sun className="dark:-rotate-90 dark:scale-0" />
      <Moon className="dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

**Key changes**:
1. Destructure `resolvedTheme` from `useTheme()`
2. Replace all `theme === 'dark'` checks with `resolvedTheme === 'dark'`
3. Update tooltip text to use `resolvedTheme`

## Why This Works

- `resolvedTheme` always returns 'light' or 'dark' (never 'system')
- It matches what CSS `dark:` classes are actually showing
- Toggle logic now aligns with visual state
- User experience is consistent: what you see is what you toggle

## Code Comparison

### Before (Broken)
```typescript
const { theme, setTheme } = useTheme();

// When theme='system' and OS is dark:
// - theme === 'dark' → false ❌
// - Visual state: dark mode ✓
// - Mismatch!

onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
// Clicking sets theme='dark' but already visually dark → no change
```

### After (Fixed)
```typescript
const { theme, setTheme, resolvedTheme } = useTheme();

// When theme='system' and OS is dark:
// - resolvedTheme === 'dark' → true ✓
// - Visual state: dark mode ✓
// - Aligned!

onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
// Clicking sets theme='light' and visual changes to light → works!
```

## Prevention Strategy

### Rule: Always Use resolvedTheme for Visual State Logic

When implementing theme toggles or any UI that reflects the current visual theme:

**Use `resolvedTheme`** when:
- Determining which icon to show (sun/moon)
- Setting ARIA labels based on current visual state
- Toggling between themes
- Displaying "Current theme: X" text

**Use `theme`** when:
- Showing user preference setting ("You prefer: system")
- Settings panel showing 'light' | 'dark' | 'system' options
- Saving user preference to database

### Testing Checklist

When adding theme toggle functionality:

- [ ] Test with theme='light' - toggle works
- [ ] Test with theme='dark' - toggle works
- [ ] Test with theme='system' + OS light - toggle works
- [ ] Test with theme='system' + OS dark - toggle works ⚠️ **Most important**
- [ ] Verify toggle button reflects actual visual state in all cases
- [ ] Check ARIA labels match visual state
- [ ] Confirm no visual change when clicking in same-state edge cases

## Related Issues

- **Similar pattern**: Any component that needs to reflect actual visual state should use `resolvedTheme`
- **Framework**: next-themes provides `resolvedTheme` specifically for this use case
- **CSS classes**: Remember that `dark:` classes respond to `resolvedTheme`, not `theme`

## Additional Context

### Why This Matters

Dark mode with system preference support is a modern UX best practice:
- Users expect their OS preference to be respected
- But they also expect manual toggle to work correctly
- Getting this wrong creates confusing UX where buttons seem broken

### Implementation Notes from Phase 2

This issue was discovered during PR review of Phase 2 (Industrial Design Completion):
- We implemented full dark mode support with next-themes
- Added ThemeToggle component to header
- Initial implementation looked correct but had this subtle bug
- CodeRabbit automated review caught it before merge

**Lesson**: Even when implementation "looks right" and "works", subtle state mismatches can create poor UX. Automated reviews and testing edge cases (especially system preference) are crucial.

## Files Modified

**Fix commit**: `df3f3e7`

```
components/ThemeToggle.tsx:
- Line 33: Added resolvedTheme to destructuring
- Line 57: Updated onClick to use resolvedTheme
- Line 59: Updated aria-label to use resolvedTheme
- Line 68: Updated tooltip text to use resolvedTheme
```

## References

- [next-themes documentation](https://github.com/pacocoursey/next-themes#resolvetheme)
- PR #663: Phase 2 - Industrial Design Completion & Dark Mode
- CodeRabbit review comment thread

---

**Status**: ✅ Resolved
**Verified**: Yes - Tested with all theme combinations
**Merged**: Commit df3f3e7 in PR #663
