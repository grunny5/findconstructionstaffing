# Keyboard Testing Checklist - Phase 3 Accessibility Excellence

## Overview

This checklist ensures all interactive elements are keyboard accessible according to WCAG 2.1 AA standards.

**Testing Method**: Use keyboard only (no mouse). Tab through the entire page and test all interactive elements.

---

## Global Keyboard Shortcuts

### Search Focus (`/` key)
- [ ] Press `/` from anywhere on the page
- [ ] Search input receives focus
- [ ] Shortcut does NOT trigger when typing in input fields
- [ ] Screen reader announces "Search input focused"

### Clear Focus (`Esc` key)
- [ ] Press `Esc` from any focused element
- [ ] Focus is removed from current element
- [ ] Open modals are closed
- [ ] Search input text remains (not cleared)

### Help Modal (`?` key)
- [ ] Press `?` from anywhere on the page
- [ ] Keyboard shortcuts help modal opens
- [ ] Focus moves to modal
- [ ] Shortcut does NOT trigger when typing in input fields
- [ ] All shortcuts are documented in modal

---

## Focus Management

### Page Navigation
- [ ] Navigate to new page using link
- [ ] Page h1 receives focus automatically
- [ ] Screen reader announces page title
- [ ] Focus indicator is visible (orange outline)

### Dialog/Modal Behavior
- [ ] Click button to open modal
- [ ] Focus moves inside modal
- [ ] Tab cycles through modal elements only (focus trap)
- [ ] Press `Esc` to close modal
- [ ] Focus returns to trigger button
- [ ] Click X button to close modal
- [ ] Focus returns to trigger button

---

## Navigation (Header Component)

### Desktop Navigation
- [ ] Tab to logo link
- [ ] Focus indicator visible
- [ ] Press `Enter` to navigate home
- [ ] Tab through main navigation links:
  - [ ] Browse Directory
  - [ ] Request Labor
  - [ ] Resources
- [ ] Each link shows focus indicator
- [ ] `Enter` activates navigation

### Theme Toggle
- [ ] Tab to theme toggle button
- [ ] Focus indicator visible
- [ ] Press `Enter` or `Space` to toggle theme
- [ ] Theme changes (light/dark)
- [ ] No page reload occurs

### Account Menu (when logged in)
- [ ] Tab to account dropdown button
- [ ] Press `Enter` or `Space` to open menu
- [ ] Tab through menu items
- [ ] `Enter` activates menu item
- [ ] `Esc` closes menu
- [ ] Focus returns to dropdown button

### Mobile Menu
- [ ] Tab to mobile menu button (on small screens)
- [ ] Press `Enter` or `Space` to open
- [ ] Focus moves inside sheet
- [ ] Tab through all menu items
- [ ] `Esc` closes menu
- [ ] Focus returns to menu button

---

## Homepage

### Hero Section
- [ ] Tab through hero search inputs
- [ ] All inputs show focus indicator
- [ ] `Enter` in search field triggers search
- [ ] Select dropdowns open with `Space` or `Enter`
- [ ] Arrow keys navigate dropdown options
- [ ] `Enter` selects option
- [ ] `Esc` closes dropdown

### CTA Buttons
- [ ] Tab to "Request Labor" button
- [ ] Focus indicator visible
- [ ] `Enter` or `Space` activates button
- [ ] Tab to "Claim Your Listing" button
- [ ] Focus indicator visible
- [ ] `Enter` or `Space` activates button

---

## Directory Filters (Main Content)

### Search Input
- [ ] Tab to search input
- [ ] Focus indicator visible
- [ ] Can type search query
- [ ] Results update as typing
- [ ] Screen reader announces result count changes (ARIA live region)

### Filter Popovers
- [ ] Tab to "Trade Specialties" button
- [ ] Press `Enter` or `Space` to open popover
- [ ] Tab through checkboxes
- [ ] `Space` toggles checkbox
- [ ] Filter updates immediately
- [ ] Result count updates
- [ ] Screen reader announces count change

- [ ] Repeat for:
  - [ ] Service Areas filter
  - [ ] Compliance filter
  - [ ] Company Size filter

### Select Dropdowns
- [ ] Tab to "Per Diem" select
- [ ] Press `Space` or `Enter` to open
- [ ] Arrow keys navigate options
- [ ] `Enter` selects option
- [ ] Filter updates

- [ ] Repeat for:
  - [ ] Union Status select
  - [ ] Sort By select

### Verification Checkbox
- [ ] Tab to "Verified Only" checkbox
- [ ] Press `Space` to toggle
- [ ] Filter updates
- [ ] Focus indicator visible

### Active Filters (Filter Badges)
- [ ] Tab to active filter badge
- [ ] Press `Enter` or `Space` on X button
- [ ] Filter removed
- [ ] Result count updates
- [ ] Screen reader announces change

### Clear All Filters Button
- [ ] Tab to "Clear All Filters" button
- [ ] Press `Enter` or `Space`
- [ ] All filters cleared
- [ ] Result count updates to total

---

## Agency Cards

### Card Focus
- [ ] Tab to agency card
- [ ] Entire card receives focus
- [ ] Focus indicator visible around card
- [ ] Card title/link announced by screen reader

### Card Actions
- [ ] Tab to "View Profile" button
- [ ] Focus indicator visible
- [ ] `Enter` or `Space` navigates to profile
- [ ] Tab to specialty badges (if clickable)
- [ ] `Enter` activates badge filter

---

## Footer

### Footer Links
- [ ] Tab through all footer links:
  - [ ] Add Your Listing
  - [ ] Premium Features
  - [ ] Success Stories
  - [ ] Help Center
  - [ ] Contact Us
  - [ ] Privacy Policy
- [ ] Each link shows focus indicator
- [ ] `Enter` navigates to page

### Keyboard Shortcuts Hint
- [ ] Keyboard shortcuts hint visible
- [ ] "Press ? for keyboard shortcuts" displayed
- [ ] Visual `?` key styled as kbd element

---

## Form Error Announcements

### Test with Login/Contact Form
- [ ] Submit form with empty required field
- [ ] Error message appears
- [ ] Screen reader announces error (ARIA alert)
- [ ] Focus moves to first error field
- [ ] Error message linked via `aria-describedby`
- [ ] Fix error and resubmit
- [ ] Error message disappears
- [ ] Screen reader announces success

---

## Screen Reader Testing

### Recommended Screen Readers
- **Windows**: NVDA (free) or JAWS
- **macOS**: VoiceOver (built-in)
- **Linux**: Orca

### Key Landmarks
- [ ] Navigate by landmarks (header, main, navigation, footer)
- [ ] Each landmark announced correctly
- [ ] Heading levels in correct order (h1 → h2 → h3)
- [ ] Lists announced with item counts

### ARIA Live Regions
- [ ] Filter results count changes announced
- [ ] "Updating..." status announced while loading
- [ ] New results count announced when ready

### Interactive Elements
- [ ] All buttons announced with "button" role
- [ ] All links announced with "link" role
- [ ] Form labels read before input fields
- [ ] Required fields announced as "required"
- [ ] Error messages announced immediately (assertive)

---

## Testing Environment

### Browsers to Test
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest on macOS)

### Devices to Test
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## Success Criteria

All checkboxes must pass for Phase 3 completion:

- ✅ All global keyboard shortcuts work
- ✅ Focus management works on page navigation
- ✅ Modal/dialog focus trap and return works
- ✅ All navigation links keyboard accessible
- ✅ All filters keyboard accessible
- ✅ ARIA live regions announce changes
- ✅ Form errors announced immediately
- ✅ No keyboard traps (can tab out of everything)
- ✅ Focus indicators visible on all interactive elements
- ✅ Screen reader announces all content correctly

---

## Known Issues / Notes

_Document any accessibility issues found during testing here._

---

## Testing Log

| Date | Tester | Browser | Screen Reader | Pass/Fail | Notes |
|------|--------|---------|---------------|-----------|-------|
| 2026-01-12 | Claude | - | - | Pending | Initial checklist creation |

---

## References

- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Keyboard Accessibility](https://webaim.org/articles/keyboard/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
