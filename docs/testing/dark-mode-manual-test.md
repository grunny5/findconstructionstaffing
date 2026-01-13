# Dark Mode Manual Testing Instructions

**Branch**: `ui/057-updates`
**Date**: 2026-01-12
**Scope**: Proof of Concept - Header component dark mode

---

## What Was Changed

### Files Modified
1. **components/Header.tsx** (Line 137)
   - Changed: `text-slate-500` → `text-industrial-graphite-400`
   - Element: User email in dropdown menu
   - Impact: Email text now adapts to dark mode

2. **docs/development/color-mapping-dark-mode.md** (NEW)
   - Comprehensive color mapping reference for future refactoring
   - Maps hardcoded Tailwind colors to industrial variables

### Files Verified (Already Using Industrial Colors)
- **components/AgencyCard.tsx** ✅ No changes needed

---

## Testing Procedure

### Prerequisites
```bash
# Ensure you're on the correct branch
git checkout ui/057-updates

# Start development server
npm run dev

# Server will start on http://localhost:3001 (or 3000)
```

### Test 1: Theme Toggle Functionality

1. **Open the site** in your browser (http://localhost:3001)
2. **Locate the theme toggle button** in the header (sun/moon icon)
3. **Click the theme toggle**
4. **Expected behavior**:
   - Icon transitions (sun → moon or moon → sun)
   - Page background changes (cream → dark or dark → cream)
   - Text colors invert appropriately
   - Header maintains contrast and readability

### Test 2: Header Component Specific

**Focus**: User dropdown menu (must be logged in)

1. **Prerequisite**: Log into the application
2. **Click your user avatar/menu** in the header
3. **Check the dropdown menu**:
   - User name should be readable
   - **User email** should be clearly visible in both modes

4. **Toggle theme while dropdown is open**
   - Email text color should change
   - Light mode: Email appears as medium-dark gray
   - Dark mode: Email appears as light gray
   - Both modes: Text is readable against background

### Test 3: Overall Visual Check

Check these Header elements in both modes:

#### Light Mode
- [ ] Header background is light/white
- [ ] Navigation links are dark gray
- [ ] Theme toggle shows sun icon
- [ ] Buttons have clear borders and text
- [ ] Logo/branding is clearly visible

#### Dark Mode
- [ ] Header background is dark
- [ ] Navigation links are light gray
- [ ] Theme toggle shows moon icon
- [ ] Buttons maintain clear borders and text
- [ ] Logo/branding remains visible

### Test 4: Contrast & Readability

Using browser DevTools or contrast checker:

1. **Inspect user email element** (`<p class="text-xs text-industrial-graphite-400">`)
2. **Check contrast ratios**:
   - Light mode: Should meet WCAG AA (4.5:1 for small text)
   - Dark mode: Should meet WCAG AA (4.5:1 for small text)

3. **Visual test**: Can you easily read all text in both modes without strain?

---

## Expected Results

### What Should Work ✅

1. **Theme toggle changes visual appearance**
   - Entire page responds to theme change
   - Industrial CSS variables update automatically
   - No need to refresh page

2. **Header maintains design consistency**
   - Industrial design aesthetic preserved in both modes
   - Sharp corners, bold typography remain
   - Orange accent color visible in both modes

3. **User dropdown menu**
   - Email text is readable in light mode
   - Email text is readable in dark mode
   - Dropdown background contrasts with page background

### What's Expected (Known Limitations) ⚠️

This is a **Proof of Concept** focusing on Header component only:

1. **Other components may not fully adapt to dark mode yet**
   - Footer, forms, admin pages, modals may have limited dark mode support
   - This is expected - we're validating the approach before full refactor

2. **Some hardcoded colors may remain**
   - Pages and components outside Header/AgencyCard scope
   - Will be addressed in future iterations

---

## Troubleshooting

### Theme Toggle Doesn't Change Anything

**Check:**
1. DevTools → Elements → `<html>` tag
2. When you toggle, does it add/remove `class="dark"`?
3. If yes, but no visual change: Industrial CSS variables might not be defined
4. If no: ThemeProvider may not be working

**Fix**:
```bash
# Restart dev server
npm run dev
```

### Email Text Not Changing in Dropdown

**Check:**
1. Inspect the email element
2. Does it have `class="text-industrial-graphite-400"`?
3. If yes: Check if CSS variable is defined in globals.css
4. If no: File wasn't saved correctly

**Fix**:
```bash
# Verify the change
git diff components/Header.tsx

# Should show: text-industrial-graphite-400
```

### Colors Look Wrong

**Check contrast in DevTools:**
1. Right-click email text → Inspect
2. Click color swatch in Styles panel
3. Contrast ratio should show (must be ≥ 4.5:1)

**If contrast fails:**
- Light mode: Variable might be too light
- Dark mode: Variable might be too dark
- Report this - we may need to adjust CSS variables

---

## Success Criteria

### Minimal (Must Pass)
- [ ] Theme toggle button works (changes icon)
- [ ] Page background changes between light and dark
- [ ] Header text is readable in both modes
- [ ] User email in dropdown is visible in both modes

### Optimal (Should Pass)
- [ ] All text meets WCAG AA contrast (4.5:1)
- [ ] Theme change feels smooth and intentional
- [ ] Industrial design aesthetic maintained
- [ ] No jarring color shifts

### Bonus (Nice to Have)
- [ ] Dark mode feels polished, not auto-generated
- [ ] Orange accent color stands out in both modes
- [ ] Transition feels professional

---

## Next Steps

If this Proof of Concept works well:

1. **Expand to Footer component**
2. **Refactor form components** (Input, Select, Textarea)
3. **Update page components** (homepage, agency profiles)
4. **Tackle admin components**
5. **Final polish and testing**

Estimated effort for full refactor: 6-8 additional hours

---

## Reporting Issues

If you find issues during testing:

### Format
```markdown
**Component**: Header > User Dropdown
**Theme**: Dark mode
**Issue**: Email text not visible
**Expected**: Light gray text
**Actual**: White text on white background
**Contrast**: Failed (1.2:1, needs 4.5:1)
```

### What to Check
- Browser: Chrome/Firefox/Safari
- Viewport: Desktop/Mobile
- User state: Logged in/out
- Specific element affected

---

## References

- Color Mapping Guide: `docs/development/color-mapping-dark-mode.md`
- Industrial Design Tokens: `app/globals.css` (lines 144-205)
- Tailwind Config: `tailwind.config.ts` (lines 89-126)
- ThemeProvider Setup: `app/layout.tsx` (lines 67-72)
