---
title: "Avoid Over-Engineering: Quick Reference Checklist"
date: 2026-01-13
category: architecture-decisions
problem_type: process_improvement
components:
  - planning
  - architecture
  - process
status: active
tags:
  - yagni
  - minimal-implementation
  - lean-startup
  - decision-framework
related_docs:
  - "docs/solutions/implementation-patterns/minimal-verified-field-implementation.md"
search_keywords:
  - over-engineering
  - yagni
  - minimal viable
  - simplicity
  - planning
---

# Avoid Over-Engineering: Quick Reference Checklist

## When Planning New Features

### 🔴 Red Flags (Stop and Simplify)

- [ ] Estimate is >1 week for "simple" feature
- [ ] Plan introduces new architectural pattern used only here
- [ ] Adding "just in case" features nobody requested
- [ ] Building for "what if" scenarios without evidence
- [ ] Creating multiple phases for straightforward feature
- [ ] Duplicating existing functionality instead of extending it

### ✅ Green Lights (Proceed)

- [ ] Can ship in <1 day
- [ ] Uses existing patterns (no new architecture)
- [ ] Solves ONE specific user problem
- [ ] Can be added to existing UI/components
- [ ] Zero new dependencies
- [ ] All features explicitly requested

## The 5-Minute Simplification Exercise

**Before writing code, answer:**

1. **What's the ONE thing user needs?**
   - Example: "Toggle verified status"
   - Not: "Full edit page with audit trail and confirmations"

2. **Can we add to existing UI?**
   - Check: Does a form/modal/page already exist?
   - If YES: Add field there (don't create new page)

3. **What's the absolute minimum?**
   - Add field to form ✓
   - New page? ❌
   - Audit trail? ❌ (not requested)
   - Confirmation modal? ❌ (can undo)

4. **Are we matching existing patterns?**
   - Look at similar features (other boolean toggles)
   - Copy that pattern exactly

5. **Can we ship in <1 hour?**
   - If NO: You're building too much

## Decision Framework

```
User Request
    ↓
Can existing UI do this? ───YES──→ Add to existing UI
    ↓ NO                           (15 minutes)
    │
Is it ACTUALLY needed now? ──NO──→ Defer until requested
    ↓ YES                          (save weeks)
    │
Minimal implementation ────────────→ Ship it
    ↓                              (hours, not days)
    │
Observe usage for 2-4 weeks
    ↓
Users request more? ───NO──→ You saved time!
    ↓ YES                   (didn't build unused features)
    │
Iterate based on ACTUAL feedback
(build exactly what users need)
```

## Real Example: Verified Field

### ❌ Over-Engineered Plan

**Proposed**: 500 lines, 1 week, 5 phases
- New edit page route
- Server Actions (new pattern)
- Audit trail system
- Concurrent edit detection
- Confirmation modals

**Result**: Would have created maintenance burden

### ✅ Minimal Implementation

**Shipped**: 20 lines, 15 minutes
- Added toggle to existing modal
- Used existing API route
- Matched pattern of other toggles

**Result**: Feature complete, zero tech debt

## Quick Questions to Ask

### Before Planning
- "Can I add this to existing UI?" (probably yes)
- "What's the simplest version?" (usually 10% of first idea)
- "Is this requested or assumed?" (kill assumed features)

### During Planning
- "What can I cut?" (usually 70%)
- "Am I introducing new patterns?" (don't, unless required)
- "Can users accomplish goal without this?" (if yes, cut it)

### After Initial Plan
- "Would I bet $100 users will use this feature?" (if no, defer)
- "Can I ship in <4 hours?" (if no, simplify more)
- "Does this match how we do X elsewhere?" (consistency > perfection)

## Common Over-Engineering Patterns

### Pattern 1: "Proper" Architecture
**Symptom**: "The proper way is to create a service layer..."
**Fix**: Use existing patterns, even if "less proper"
**Why**: Consistency > architectural purity

### Pattern 2: Future-Proofing
**Symptom**: "We'll need bulk operations eventually..."
**Fix**: Build bulk operations when needed, not before
**Why**: YAGNI - 80% of "future" features never materialize

### Pattern 3: Defensive Features
**Symptom**: "What if two admins edit at once?"
**Fix**: Let it happen, fix if it becomes a problem
**Why**: Build for actual problems, not theoretical ones

### Pattern 4: Audit Everything
**Symptom**: "We should track who changed this..."
**Fix**: Add audit trail when compliance requires it
**Why**: Logs are maintenance burden without clear need

### Pattern 5: Confirmation Modals
**Symptom**: "Users might accidentally click..."
**Fix**: Let them click, they can undo
**Why**: Confirmation fatigue is worse than mistakes

## The 80/20 Rule

**80% of features are used 20% of the time**

Ship the 20% that matters:
- Core user need ✓
- Basic happy path ✓
- Existing pattern match ✓

Defer the 80% until requested:
- Edge cases ❌
- Audit trails ❌
- Bulk operations ❌
- Confirmation modals ❌
- Advanced features ❌

## Validation Checklist

Before committing to plan:

- [ ] **Necessity**: Is every feature explicitly requested?
- [ ] **Simplicity**: Can I cut 50% and still meet requirements?
- [ ] **Patterns**: Am I reusing existing code/patterns?
- [ ] **Speed**: Can I ship in <1 day?
- [ ] **Evidence**: Do I have proof this problem exists?

**If any answer is NO**: Simplify plan

## Metrics to Track

**Good Indicators**:
- Average feature ships in <4 hours
- 90%+ features use existing patterns
- Low bug rate (simple code = fewer bugs)
- Fast code reviews (less code to review)

**Bad Indicators**:
- Features taking weeks
- New patterns for each feature
- Growing complexity
- Slow reviews

## When to Build Complex

**Build more ONLY when:**
1. ✅ Users explicitly request it
2. ✅ You have metrics showing problem exists
3. ✅ Compliance/legal requires it
4. ✅ Current solution measurably fails

**NOT when:**
- ❌ "Might need it someday"
- ❌ "Best practice says..."
- ❌ "Proper architecture is..."
- ❌ "It would be nice to..."

## Tools to Use

**Before implementing:**
```bash
/workflows:plan    # Create plan
/workflows:review  # Review plan for over-engineering
```

**Review will catch:**
- New patterns not used elsewhere
- YAGNI violations
- Complexity that can be cut
- Mismatched architectural patterns

## Success Stories

### Case Study: Verified Field

**Original Plan**: 500 lines, 1 week
- New page architecture
- Server Actions pattern
- Audit trail system
- 5 implementation phases

**After Review + Simplification**: 20 lines, 15 minutes
- Added to existing modal
- Used existing API route
- Zero new patterns

**Time Saved**: 39 hours, 45 minutes
**Code Saved**: 480 lines (96% reduction)
**Outcome**: Same functionality, zero tech debt

## Remember

> "Perfection is achieved, not when there is nothing more to add,
> but when there is nothing left to take away."
> - Antoine de Saint-Exupéry

**The best code is no code.**
**The best architecture is existing architecture.**
**The best feature is the one you didn't have to build.**

---

**Last Updated**: 2026-01-13
**Apply This**: Every time you plan a feature
**Review Frequency**: Before starting any feature work
