# Fix: Agency Edit Modal Save Button Not Activating on Region/Trade Changes

**Created**: 2026-01-14
**Status**: Planning
**Priority**: High
**Type**: Bug Fix
**Affected Component**: `components/admin/AgencyFormModal.tsx`

---

## Overview

The Save Changes button in the agency edit modal fails to activate when users modify service regions, trades, and potentially other fields. Despite recent fixes for the verified toggle (commits fee8908, 36222ec, 81f978b), which implemented `hasExternalChanges` tracking, the button remains disabled after users make legitimate changes.

This is a **critical UX blocker** preventing admins from updating agency information.

---

## Problem Statement

### User-Reported Behavior

1. Admin opens edit modal for an existing agency
2. Admin clicks "Edit Regions" and adds/removes states
3. Admin clicks "Save" in the region selector modal
4. **Expected**: Main "Save Changes" button enables
5. **Actual**: "Save Changes" button remains disabled

### Scope of Issue

- ❌ **Broken**: Modifying service regions via RegionSelector
- ❌ **Broken**: Modifying trades via TradeSelector
- ❓ **Unknown**: Form field changes (name, email, etc.)
- ❓ **Unknown**: Logo upload/removal
- ✅ **Working**: Verified toggle (per recent fix)

---

## Root Cause Analysis

### Current Implementation

The Save Changes button uses this disabled logic (`AgencyFormModal.tsx:816-820`):

```typescript
disabled={
  isSubmitting ||
  !form.formState.isValid ||
  (isEditMode && !form.formState.isDirty && !hasExternalChanges)
}
```

**Button enables when**:
- In edit mode: `form.formState.isDirty` (form fields changed) **OR** `hasExternalChanges` (trades/regions/logo changed)
- In create mode: `form.formState.isValid` (all validation passes)

### The `hasExternalChanges` Logic

Implemented in commit 36222ec to track non-form state (`AgencyFormModal.tsx:104-125`):

```typescript
const hasExternalChanges = useMemo(() => {
  if (!isEditMode || !agency) return false;

  // Check if trades have changed
  const initialTradeIds = (agency.trades || []).map((t) => t.id).sort();
  const currentTradeIds = selectedTrades.map((t) => t.id).sort();
  const tradesChanged =
    initialTradeIds.length !== currentTradeIds.length ||
    !initialTradeIds.every((id, i) => id === currentTradeIds[i]);

  // Check if regions have changed
  const initialRegionIds = (agency.regions || []).map((r) => r.id).sort();
  const currentRegionIds = selectedRegions.map((r) => r.id).sort();
  const regionsChanged =
    initialRegionIds.length !== currentRegionIds.length ||
    !initialRegionIds.every((id, i) => id === currentRegionIds[i]);

  // Check if logo has changed
  const logoChanged = !!pendingLogoFile || logoRemoved;

  return tradesChanged || regionsChanged || logoChanged;
}, [isEditMode, agency, selectedTrades, selectedRegions, pendingLogoFile, logoRemoved]);
```

**This logic SHOULD work**, but clearly doesn't.

### Potential Root Causes

Based on research into React Hook Form v7.69.0 behavior and the SpecFlow analysis:

#### 1. **React Hook Form Proxy Subscription Issue** (Most Likely)

React Hook Form wraps `formState` in a Proxy for performance. **You must directly access properties before rendering** to enable subscription.

**Current code issue**: Line 819 accesses `form.formState.isDirty` for the first time inside the disabled expression:

```typescript
(isEditMode && !form.formState.isDirty && !hasExternalChanges)
```

If this is the **only** place `isDirty` is accessed, the Proxy subscription might not be established properly, preventing re-renders when `isDirty` changes.

**Evidence**: [GitHub Issue #13017](https://github.com/react-hook-form/react-hook-form/issues/13017) documents this exact problem.

#### 2. **State Propagation Delay** (Possible)

When RegionSelector or TradeSelector calls `onChange(newRegions)`, this triggers `setSelectedRegions(newRegions)`. However:

- React 18's automatic batching might delay the re-render
- If the parent component doesn't re-render, `hasExternalChanges` won't recalculate
- The selector modals might close before state updates propagate

#### 3. **Stale Agency Prop Reference** (Possible)

The `hasExternalChanges` memo compares `selectedRegions` against `agency.regions`. If the parent re-renders and creates a new `agency` object (even with the same data), the comparison could break.

#### 4. **Validation Blocking Button** (Less Likely)

If `form.formState.isValid` is false (perhaps due to unrelated validation errors), the button stays disabled regardless of `isDirty` or `hasExternalChanges`.

---

## Proposed Solution

### Phase 1: Diagnostic Logging (Immediate)

**Goal**: Identify which condition is causing the button to remain disabled.

**Implementation**: Add comprehensive logging to track form state and external state changes.

#### File: `components/admin/AgencyFormModal.tsx`

**Add after line 125** (after `hasExternalChanges` memo):

```typescript
// DEBUG: Form state tracking (remove after fix)
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.group('🔍 AgencyFormModal State Debug');
    console.log('Form State:', {
      isDirty: form.formState.isDirty,
      isValid: form.formState.isValid,
      dirtyFields: Object.keys(form.formState.dirtyFields),
      errors: Object.keys(form.formState.errors),
      defaultValues: form.formState.defaultValues,
    });
    console.log('External State:', {
      selectedTradesCount: selectedTrades.length,
      selectedRegionsCount: selectedRegions.length,
      agencyTradesCount: agency?.trades?.length || 0,
      agencyRegionsCount: agency?.regions?.length || 0,
      hasExternalChanges,
      pendingLogoFile: !!pendingLogoFile,
      logoRemoved,
    });
    console.log('Button Disabled Conditions:', {
      isSubmitting,
      isInvalid: !form.formState.isValid,
      editModeCheck: isEditMode && !form.formState.isDirty && !hasExternalChanges,
      buttonDisabled: isSubmitting ||
        !form.formState.isValid ||
        (isEditMode && !form.formState.isDirty && !hasExternalChanges),
    });
    console.groupEnd();
  }
}, [
  form.formState.isDirty,
  form.formState.isValid,
  form.formState.dirtyFields,
  form.formState.errors,
  selectedTrades,
  selectedRegions,
  hasExternalChanges,
  pendingLogoFile,
  logoRemoved,
  isSubmitting,
  isEditMode,
  agency,
]);
```

**Add logging to RegionSelector callback** (line ~797-802):

```typescript
<RegionSelector
  selectedRegions={selectedRegions}
  onChange={(regions) => {
    console.log('📍 RegionSelector onChange called:', {
      previousCount: selectedRegions.length,
      newCount: regions.length,
      regionIds: regions.map(r => r.id),
    });
    setSelectedRegions(regions);
  }}
  maxRegions={50}
/>
```

**Add logging to TradeSelector callback** (line ~784-790):

```typescript
<TradeSelector
  selectedTrades={selectedTrades}
  onChange={(trades) => {
    console.log('🔧 TradeSelector onChange called:', {
      previousCount: selectedTrades.length,
      newCount: trades.length,
      tradeIds: trades.map(t => t.id),
    });
    setSelectedTrades(trades);
  }}
  maxTrades={100}
/>
```

### Phase 2: Fix React Hook Form Subscription (Based on Findings)

**Fix 1: Destructure formState properties early**

Move `isDirty` and `isValid` destructuring to component top level to ensure Proxy subscription:

```typescript
// Add after line 102 (after form initialization)
const { isDirty, isValid, dirtyFields, errors } = form.formState;

// Update button disabled logic (line 816-820)
disabled={
  isSubmitting ||
  !isValid ||
  (isEditMode && !isDirty && !hasExternalChanges)
}
```

**Fix 2: Add explicit formState read in render**

If Fix 1 doesn't work, add explicit access before button render:

```typescript
// Force Proxy subscription by reading all needed properties
const formStateSnapshot = {
  isDirty: form.formState.isDirty,
  isValid: form.formState.isValid,
  dirtyFields: form.formState.dirtyFields,
};

// Use snapshot in button logic
disabled={
  isSubmitting ||
  !formStateSnapshot.isValid ||
  (isEditMode && !formStateSnapshot.isDirty && !hasExternalChanges)
}
```

### Phase 3: Fix State Propagation (If Needed)

**Fix 3: Use flushSync for immediate state updates**

If state updates are delayed by React batching:

```typescript
import { flushSync } from 'react-dom';

<RegionSelector
  selectedRegions={selectedRegions}
  onChange={(regions) => {
    flushSync(() => {
      setSelectedRegions(regions);
    });
  }}
  maxRegions={50}
/>
```

**Fix 4: Add useEffect to sync external changes to form**

If external state needs to explicitly mark form as dirty:

```typescript
// Add after hasExternalChanges memo
useEffect(() => {
  if (hasExternalChanges) {
    // Mark a hidden field as dirty to trigger form state update
    form.setValue('_externalChangeMarker', Date.now(), {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    });
  }
}, [hasExternalChanges, form]);

// Add to form schema (lib/validations/agency-creation.ts)
_externalChangeMarker: z.number().optional(),
```

### Phase 4: Validation Fix (If Applicable)

**Fix 5: Improve validation logic**

If validation is incorrectly blocking the button:

```typescript
// Add mode-aware validation
disabled={
  isSubmitting ||
  (!isEditMode && !isValid) ||  // Only check validity in create mode
  (isEditMode && !isDirty && !hasExternalChanges)  // Only check changes in edit mode
}
```

### Phase 5: Cleanup Diagnostic Logging

Remove all `console.log` statements added in Phase 1.

---

## Acceptance Criteria

### Functional Requirements

- [ ] Save Changes button **enables immediately** when user modifies service regions
- [ ] Save Changes button **enables immediately** when user modifies trades
- [ ] Save Changes button **enables immediately** when user modifies form fields (name, email, etc.)
- [ ] Save Changes button **enables immediately** when user uploads/removes logo
- [ ] Save Changes button **remains disabled** when no changes are made
- [ ] Save Changes button **remains disabled** when form has validation errors
- [ ] Button state updates **within 100ms** of user action (no perceivable delay)

### Edge Cases

- [ ] Opening region selector and canceling (no changes) → button stays disabled
- [ ] Making a change and reverting it → button returns to disabled
- [ ] Changing multiple fields simultaneously → button enables
- [ ] Changing regions while form validation is running → button state correct
- [ ] Opening and closing modal quickly → no race conditions

### Technical Requirements

- [ ] Remove all diagnostic logging before commit
- [ ] No performance regression (modal should render in <100ms)
- [ ] React Hook Form Proxy subscription working correctly
- [ ] State updates propagate synchronously
- [ ] All existing tests pass
- [ ] Add regression tests for region/trade changes

---

## Testing Strategy

### Manual Testing Checklist

**Test 1: Region-Only Change**
1. Open edit modal for agency with 2 regions
2. Click "Edit Regions"
3. Add California
4. Click "Save" in region modal
5. ✅ **Verify**: Main "Save Changes" button is enabled
6. ✅ **Verify**: Console logs show `hasExternalChanges: true`
7. Click "Save Changes"
8. ✅ **Verify**: API receives updated region list

**Test 2: Trade-Only Change**
1. Open edit modal for agency with 3 trades
2. Click "Add Trades"
3. Add "Plumber"
4. Click "Save" in trade modal
5. ✅ **Verify**: Main "Save Changes" button is enabled
6. ✅ **Verify**: Console logs show `hasExternalChanges: true`
7. Click "Save Changes"
8. ✅ **Verify**: API receives updated trade list

**Test 3: Form Field Change**
1. Open edit modal
2. Change agency name
3. ✅ **Verify**: "Save Changes" button enables immediately
4. ✅ **Verify**: Console logs show `isDirty: true`

**Test 4: Combined Changes**
1. Open edit modal
2. Change name AND add a region
3. ✅ **Verify**: Button enabled (both `isDirty` and `hasExternalChanges` true)

**Test 5: Cancel Changes**
1. Open edit modal
2. Click "Edit Regions"
3. Add California
4. Click "Cancel" in region modal
5. ✅ **Verify**: Button remains disabled (no changes saved)

**Test 6: Revert Changes**
1. Open edit modal
2. Change name to "Test"
3. ✅ **Verify**: Button enabled
4. Change name back to original
5. ✅ **Verify**: Button disabled (`isDirty` back to false)

### Automated Test Cases

**File**: `components/admin/__tests__/AgencyFormModal.test.tsx`

```typescript
describe('Save Changes Button - External State', () => {
  it('enables when regions are modified', async () => {
    const { getByRole, getByTestId } = render(
      <AgencyFormModal
        isOpen={true}
        agency={mockAgency}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );

    const submitButton = getByTestId('submit-button');
    expect(submitButton).toBeDisabled();

    // Simulate region change
    const regionSelector = getByRole('button', { name: /edit regions/i });
    await userEvent.click(regionSelector);

    // Add California
    const californiaOption = getByRole('option', { name: /california/i });
    await userEvent.click(californiaOption);

    const saveRegionsButton = getByRole('button', { name: /save/i });
    await userEvent.click(saveRegionsButton);

    // Button should now be enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('enables when trades are modified', async () => {
    // Similar test for trades
  });

  it('remains disabled when changes are canceled', async () => {
    // Test cancel flow
  });

  it('enables when form fields AND external state change', async () => {
    // Test combined changes
  });
});
```

---

## Success Metrics

### Before Fix
- 🔴 Save button activation: **0%** success rate (broken)
- 🔴 User frustration: High (cannot save region/trade changes)
- 🔴 Admin productivity: Blocked

### After Fix
- ✅ Save button activation: **100%** success rate
- ✅ Response time: <100ms from user action to button enable
- ✅ Zero console errors or warnings
- ✅ All edge cases handled correctly

---

## Dependencies & Risks

### Dependencies

- React Hook Form v7.69.0 (already installed)
- React 18 (already installed)
- Zod validation (already installed)

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| React 18 batching causes state delay | Medium | High | Use `flushSync` if needed |
| Proxy subscription still doesn't work | Low | High | Add explicit subscription via useFormState |
| Breaking existing form behavior | Low | High | Comprehensive regression testing |
| Performance regression with extra logging | Low | Low | Remove all logging before commit |

---

## Implementation Plan

### Step 1: Setup & Diagnosis (30 min)
1. Create branch `ui/061-agency-dash`
2. Add diagnostic logging (Phase 1)
3. Start dev server and test manually
4. Review console logs to identify root cause

### Step 2: Implement Fix (1-2 hours)
1. Apply appropriate fix based on diagnostic findings
2. Test manually with all scenarios
3. Verify console logs show correct state

### Step 3: Testing (1 hour)
1. Run full manual test checklist
2. Write automated regression tests
3. Verify all existing tests pass

### Step 4: Cleanup & Documentation (30 min)
1. Remove all diagnostic logging
2. Update this plan with actual root cause found
3. Document learnings for future reference

### Step 5: Review & Deploy
1. Create PR with detailed description
2. Request code review
3. Merge to main
4. Monitor production for issues

---

## References & Research

### Internal References

- **Main Component**: `components/admin/AgencyFormModal.tsx` (850 lines)
- **Validation Schema**: `lib/validations/agency-creation.ts:159-177`
- **Region Selector**: `components/dashboard/RegionSelector.tsx:32-46`
- **Trade Selector**: `components/dashboard/TradeSelector.tsx:34-46`
- **Previous Fix Plan**: `plans/fix-verified-toggle-save-button-activation.md`

### Related Commits

- `fee8908` - Original verified toggle fix (5 issues fixed)
- `36222ec` - Added `hasExternalChanges` for trades/regions/logo
- `81f978b` - Fixed validation logic for edit mode

### External References

#### React Hook Form Documentation
- [formState Proxy Behavior](https://react-hook-form.com/docs/useform/formstate)
- [useFormState Hook](https://react-hook-form.com/docs/useformstate)
- [setValue API](https://www.react-hook-form.com/api/useform/setvalue/)

#### GitHub Issues
- [Issue #13017: isDirty not updating without subscription](https://github.com/react-hook-form/react-hook-form/issues/13017)
- [Issue #4597: isDirty not true onChange with watch()](https://github.com/react-hook-form/react-hook-form/issues/4597)
- [Discussion #3948: Can I manually set isDirty to true?](https://github.com/orgs/react-hook-form/discussions/3948)

#### Best Practices
- [React Query and Forms - TkDodo](https://tkdodo.eu/blog/react-query-and-forms)
- [Best Practices for Handling Forms in React (2025)](https://medium.com/@farzanekazemi8517/best-practices-for-handling-forms-in-react-2025-edition-62572b14452f)

---

## Notes for Implementation

### Key Insights from Research

1. **React Hook Form Proxy is the likely culprit**: The most common issue with `isDirty` not updating is improper Proxy subscription. Accessing `formState.isDirty` conditionally or late in render prevents subscription.

2. **React 18 automatic batching**: State updates in event handlers are automatically batched. For immediate updates, use `flushSync()`.

3. **useMemo dependencies are correct**: The `hasExternalChanges` memo has all necessary dependencies and should recalculate properly.

4. **Validation mode is correct**: Using `mode: 'onChange'` for edit forms is the recommended pattern for real-time feedback.

### What We Learned from Verified Toggle Fix

The verified toggle fix journey (commits 087beb8 → 6fd3205 → fee8908) revealed:
- Custom state tracking with `useEffect` lags behind form changes
- React Hook Form's Proxy requires direct access in render
- `useEffect` dependency arrays must be minimal to avoid reset loops
- Edit mode and create mode need different validation logic

### Questions for User After Diagnosis

After adding diagnostic logging and testing manually:
1. Which condition is false when regions are changed?
2. Does `selectedRegions` state update immediately?
3. Does `hasExternalChanges` recalculate after region change?
4. Are there any console errors or warnings?

---

## Future Considerations

### Potential Improvements

1. **Add React Hook Form DevTools** for easier debugging:
   ```bash
   npm install -D @hookform/devtools
   ```

2. **Extract button disabled logic** into a custom hook:
   ```typescript
   const useSaveButtonState = (form, hasExternalChanges, isEditMode) => {
     // Centralized logic
   };
   ```

3. **Add visual feedback** when external state changes:
   ```typescript
   {hasExternalChanges && (
     <Badge>Unsaved changes to trades/regions</Badge>
   )}
   ```

4. **Consider using `useFormState`** for better performance in large forms:
   ```typescript
   const { isDirty, isValid } = useFormState({ control: form.control });
   ```

---

## AI-Generated Code Review

This plan was created with assistance from:
- **repo-research-analyst**: Analyzed existing codebase patterns and previous fixes
- **best-practices-researcher**: Researched React Hook Form v7 best practices and common pitfalls
- **framework-docs-researcher**: Gathered official documentation and known issues
- **spec-flow-analyzer**: Mapped user flows and identified potential failure points

**Key AI Insights**:
- React Hook Form Proxy subscription is a documented edge case that matches symptoms
- The `hasExternalChanges` implementation follows best practices but may not be triggering re-renders
- Diagnostic logging is essential before attempting fixes (measure twice, cut once)

---

**Last Updated**: 2026-01-14
**Plan Version**: 1.0
**Next Review**: After Phase 1 diagnostic findings
