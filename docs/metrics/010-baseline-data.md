# Baseline Metrics for Industrial Design System

> **Feature:** 010-industrial-design-system
> **Purpose:** Collect baseline metrics before design changes to measure success
> **Collection Period:** [START_DATE] to [END_DATE] (2 weeks)
> **Status:** PENDING DATA COLLECTION

## Overview

This document records baseline metrics for the Industrial Design System rollout (Feature 010). These metrics will be compared against post-launch data to measure the success of the design update per the FSD success criteria.

### Target Improvements (from FSD)

| Metric                    | Current Baseline | Target Change | Target Value |
| ------------------------- | ---------------- | ------------- | ------------ |
| Lead form conversion rate | TBD              | +15-25%       | TBD          |
| Agency claim requests     | TBD              | +20%          | TBD          |
| Time on site              | TBD              | +30%          | TBD          |
| Pages per session         | TBD              | +20%          | TBD          |

---

## 1. Conversion Metrics

### 1.1 Lead Form Conversion Rate

**Source:** Google Analytics 4 / Database
**Definition:** Number of lead form submissions / Number of unique visitors to lead form page

| Week             | Unique Visitors | Form Submissions | Conversion Rate |
| ---------------- | --------------- | ---------------- | --------------- |
| Week 1           | -               | -                | -%              |
| Week 2           | -               | -                | -%              |
| **2-Week Total** | -               | -                | **-% baseline** |

**Database Query:**

```sql
-- Lead form submissions (last 2 weeks)
SELECT
  DATE(created_at) as date,
  COUNT(*) as submissions
FROM lead_submissions
WHERE created_at >= NOW() - INTERVAL '14 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

### 1.2 Agency Claim Requests

**Source:** Database
**Definition:** Number of agency claim requests submitted

| Week             | Claim Requests | Approved | Pending |
| ---------------- | -------------- | -------- | ------- |
| Week 1           | -              | -        | -       |
| Week 2           | -              | -        | -       |
| **2-Week Total** | -              | -        | -       |

**Database Query:**

```sql
-- Agency claim requests (last 2 weeks)
SELECT
  DATE(created_at) as date,
  status,
  COUNT(*) as count
FROM agency_claims
WHERE created_at >= NOW() - INTERVAL '14 days'
GROUP BY DATE(created_at), status
ORDER BY date;
```

---

## 2. Engagement Metrics

### 2.1 Average Session Duration

**Source:** Google Analytics 4
**GA4 Path:** Reports > Engagement > Overview

| Week               | Avg Session Duration | Sessions |
| ------------------ | -------------------- | -------- |
| Week 1             | -                    | -        |
| Week 2             | -                    | -        |
| **2-Week Average** | **- baseline**       | -        |

### 2.2 Pages Per Session

**Source:** Google Analytics 4
**GA4 Path:** Reports > Engagement > Overview

| Week               | Pages/Session  | Total Pageviews |
| ------------------ | -------------- | --------------- |
| Week 1             | -              | -               |
| Week 2             | -              | -               |
| **2-Week Average** | **- baseline** | -               |

### 2.3 Bounce Rate

**Source:** Google Analytics 4
**GA4 Path:** Reports > Engagement > Overview

| Week               | Bounce Rate     | Entry Pages |
| ------------------ | --------------- | ----------- |
| Week 1             | -%              | -           |
| Week 2             | -%              | -           |
| **2-Week Average** | **-% baseline** | -           |

---

## 3. Device Metrics

### 3.1 Mobile vs Desktop Engagement

**Source:** Google Analytics 4
**GA4 Path:** Reports > Tech > Tech Details > Device Category

| Device  | Sessions | Avg Duration | Pages/Session | Bounce Rate |
| ------- | -------- | ------------ | ------------- | ----------- |
| Desktop | -        | -            | -             | -%          |
| Mobile  | -        | -            | -             | -%          |
| Tablet  | -        | -            | -             | -%          |

### 3.2 Mobile-Specific Metrics

| Metric                 | Value |
| ---------------------- | ----- |
| Mobile Traffic %       | -%    |
| Mobile Conversion Rate | -%    |
| Mobile Bounce Rate     | -%    |

---

## 4. Page-Specific Metrics

### 4.1 Homepage Performance

| Metric             | Value |
| ------------------ | ----- |
| Pageviews          | -     |
| Avg Time on Page   | -     |
| Exit Rate          | -%    |
| Scroll Depth (50%) | -%    |
| Scroll Depth (90%) | -%    |

### 4.2 Directory Page Performance

| Metric            | Value |
| ----------------- | ----- |
| Pageviews         | -     |
| Avg Time on Page  | -     |
| Filter Usage Rate | -%    |
| Search Usage Rate | -%    |

### 4.3 Agency Profile Performance

| Metric                   | Value |
| ------------------------ | ----- |
| Avg Pageviews            | -     |
| Avg Time on Page         | -     |
| Contact CTA Click Rate   | -%    |
| Claim Listing Click Rate | -%    |

---

## 5. Technical Performance

### 5.1 Core Web Vitals (Lighthouse)

**Test Conditions:** Simulated 3G, Mobile device

| Metric                         | Homepage | Directory | Profile |
| ------------------------------ | -------- | --------- | ------- |
| LCP (Largest Contentful Paint) | -        | -         | -       |
| FID (First Input Delay)        | -        | -         | -       |
| CLS (Cumulative Layout Shift)  | -        | -         | -       |
| Performance Score              | -        | -         | -       |

### 5.2 Font Loading Performance

| Metric              | Value |
| ------------------- | ----- |
| Total Font Payload  | - KB  |
| Font Load Time (3G) | - ms  |
| FOUT Occurrences    | -     |

---

## Collection Methodology

### Data Sources

1. **Google Analytics 4**
   - Property ID: [GA4_PROPERTY_ID]
   - Date Range: [START_DATE] to [END_DATE]
   - Filters: Exclude internal traffic

2. **Database (Supabase)**
   - Connection: Production database
   - Queries: See SQL snippets above
   - Run Date: [QUERY_RUN_DATE]

3. **Lighthouse**
   - Tool: Chrome DevTools or PageSpeed Insights
   - Device: Mobile (simulated)
   - Connection: 3G throttling
   - Runs: 3 per page, averaged

### Data Collection Schedule

| Date             | Task                                  | Status  |
| ---------------- | ------------------------------------- | ------- |
| [START_DATE]     | Begin baseline period                 | Pending |
| [START_DATE + 7] | Week 1 data snapshot                  | Pending |
| [END_DATE]       | Week 2 data snapshot & final baseline | Pending |
| [END_DATE + 1]   | Compile baseline report               | Pending |

### Statistical Considerations

- **Sample Size:** Minimum 1,000 sessions for statistical validity
- **Seasonality:** Note any holidays or unusual traffic patterns
- **Exclusions:** Bot traffic, internal testing, staging environments
- **Confidence Level:** 95% for all conversion metrics

---

## Notes & Observations

### Traffic Patterns

_Document any unusual traffic patterns observed during baseline period:_

- [ ] No unusual patterns observed
- [ ] Holiday traffic impact: [describe]
- [ ] Marketing campaign impact: [describe]
- [ ] Technical issues impact: [describe]

### Data Quality Issues

_Document any data quality concerns:_

- [ ] No data quality issues
- [ ] GA4 tracking gaps: [describe]
- [ ] Database query anomalies: [describe]

---

## Post-Launch Comparison Template

After the design system launches, copy the baseline values and compare:

| Metric               | Baseline | Post-Launch | Change | Target Met? |
| -------------------- | -------- | ----------- | ------ | ----------- |
| Lead conversion rate | -%       | -%          | -%     |             |
| Claim requests       | -        | -           | -%     |             |
| Session duration     | -        | -           | -%     |             |
| Pages/session        | -        | -           | -%     |             |
| Bounce rate          | -%       | -%          | -%     |             |

---

## Stakeholder Sign-off

| Role            | Name | Date | Signature |
| --------------- | ---- | ---- | --------- |
| Product Manager |      |      |           |
| Developer Lead  |      |      |           |
| Design Lead     |      |      |           |

---

**Document History:**

- Created: [DATE] - Initial baseline template
- Updated: [DATE] - [Description of update]
