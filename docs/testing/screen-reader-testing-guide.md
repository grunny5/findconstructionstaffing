# Screen Reader Testing Guide - Phase 3 Accessibility Excellence

## Overview

This guide documents how to test the application with screen readers to ensure WCAG 2.1 AA compliance.

## Recommended Screen Readers

### Windows
- **NVDA** (Free, Open Source) - [Download](https://www.nvaccess.org/download/)
- **JAWS** (Commercial) - Industry standard

### macOS
- **VoiceOver** (Built-in) - Press `Cmd + F5` to activate

### Linux
- **Orca** (Free, Open Source) - Included with GNOME desktop

## Quick Start

### VoiceOver (macOS)
```bash
# Enable VoiceOver
Cmd + F5

# Basic navigation
Ctrl + Option + Right Arrow  # Next item
Ctrl + Option + Left Arrow   # Previous item
Ctrl + Option + Space        # Activate item
Ctrl + Option + U            # Rotor menu (navigate by headings, links, etc.)
```

### NVDA (Windows)
```bash
# Enable NVDA
Ctrl + Alt + N (when installed)

# Basic navigation
Down Arrow       # Next item
Up Arrow         # Previous item
Enter or Space   # Activate item
Insert + F7      # Elements list (headings, links, etc.)
H                # Next heading
Shift + H        # Previous heading
```

## Testing Checklist

### Page Structure
- [ ] Page title announced correctly
- [ ] Main heading (h1) announced on page load
- [ ] Heading hierarchy is logical (h1 → h2 → h3)
- [ ] Landmarks announced (header, nav, main, footer)
- [ ] Navigation between landmarks works

### Navigation
- [ ] All navigation links announced with role
- [ ] Link purpose is clear from link text
- [ ] Current page indicated in navigation
- [ ] Skip link works (if implemented)

### Forms
- [ ] All inputs have accessible labels
- [ ] Required fields announced as "required"
- [ ] Error messages announced immediately (ARIA alerts)
- [ ] Error messages linked to fields (aria-describedby)
- [ ] Form instructions clear and announced

### Interactive Elements
- [ ] Buttons announced with role and label
- [ ] Links distinguished from buttons
- [ ] Dropdowns/selects announce options
- [ ] Modals trap focus and announce role
- [ ] Modal close returns focus to trigger

### Dynamic Content
- [ ] Filter results count changes announced (ARIA live)
- [ ] Loading states announced
- [ ] Success/error notifications announced
- [ ] Page updates without reload announced

### Images and Media
- [ ] Decorative images have empty alt text
- [ ] Informative images have descriptive alt text
- [ ] Icons with meaning have accessible labels

## Common Issues to Check

### Missing Labels
```html
<!-- ❌ Bad -->
<button><Icon /></button>

<!-- ✅ Good -->
<button aria-label="Open menu"><Icon /></button>
```

### Poor Link Text
```html
<!-- ❌ Bad -->
<a href="/profile">Click here</a>

<!-- ✅ Good -->
<a href="/profile">View agency profile</a>
```

### Missing Live Regions
```html
<!-- ❌ Bad -->
<p>{resultsCount} results</p>

<!-- ✅ Good -->
<p aria-live="polite" aria-atomic="true">
  {resultsCount} results
</p>
```

## Testing Scenarios

### Scenario 1: Homepage Navigation
1. Enable screen reader
2. Navigate to homepage
3. Verify page title announced
4. Tab through navigation
5. Verify all links announced with clear labels
6. Test theme toggle (should announce state)

### Scenario 2: Search and Filter
1. Press `/` to focus search
2. Verify search input focused and announced
3. Type search query
4. Verify results count update announced
5. Tab to filter buttons
6. Verify filters announced and operable
7. Apply filter
8. Verify results count update announced

### Scenario 3: Agency Cards
1. Tab to first agency card
2. Verify card title announced
3. Tab through card actions
4. Verify buttons/links announced clearly
5. Activate "View Profile"
6. Verify navigation announced

### Scenario 4: Modal Interaction
1. Tab to button that opens modal
2. Activate button
3. Verify focus moves to modal
4. Verify modal role announced
5. Tab through modal content
6. Press Esc or activate close button
7. Verify focus returns to trigger button

### Scenario 5: Form Submission
1. Navigate to form
2. Verify all labels announced
3. Submit with empty required field
4. Verify error announced immediately
5. Verify focus moves to error
6. Fix error and resubmit
7. Verify success announced

## Test Results Log

| Date | Tester | Screen Reader | Browser | Pass/Fail | Issues Found |
|------|--------|---------------|---------|-----------|--------------|
| 2026-01-12 | - | - | - | Pending | Manual testing required |

## Known Limitations

### Third-Party Components
Some third-party components (Radix UI) may have minor aria-hidden-focus issues that don't affect actual screen reader usability. These are false positives in automated testing.

### Browser Differences
Screen reader behavior may vary by browser:
- Best support: Chrome + NVDA, Safari + VoiceOver
- Good support: Firefox + NVDA, Chrome + VoiceOver
- Variable: Edge + NVDA

## Automated vs Manual Testing

### Automated Testing (axe-core)
✅ Catches:
- Missing alt text
- Invalid ARIA
- Color contrast issues
- Missing labels
- Heading hierarchy problems

❌ Misses:
- Unclear link text (technically valid but confusing)
- Poor focus order
- Awkward screen reader experience
- Context that doesn't make sense

### Manual Testing Required
Always test manually to ensure:
- Content makes sense when read linearly
- Focus order is logical
- Interactions work smoothly
- Users can complete tasks independently

## Resources

- [WebAIM Screen Reader Guide](https://webaim.org/articles/screenreader_testing/)
- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [VoiceOver Guide](https://support.apple.com/guide/voiceover/welcome/mac)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

## Next Steps

After manual screen reader testing:
1. Document all issues found
2. Prioritize by severity (critical/moderate/minor)
3. Fix critical issues immediately
4. Plan fixes for moderate/minor issues
5. Retest after fixes
6. Update this guide with results

---

**Status**: Manual testing pending
**Last Updated**: 2026-01-12
**Tested By**: Pending QA team review
