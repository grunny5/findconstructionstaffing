# Resend Email Service Setup Guide

**Last Updated:** December 16, 2025
**Status:** Setup Guide for Production Email Delivery
**Service:** [Resend](https://resend.com)

---

## Overview

This guide walks through setting up Resend as the email service provider for FindConstructionStaffing's authentication emails (verification, password reset, etc.).

### Why Resend?

- **Developer-friendly:** Modern API with excellent documentation
- **Generous free tier:** 3,000 emails/month, 100 emails/day
- **Fast delivery:** Optimized for transactional emails
- **Great deliverability:** Built-in best practices
- **React email support:** Native support for React email templates (optional upgrade)
- **Simple pricing:** $20/month for 50,000 emails after free tier

---

## Prerequisites

Before starting, ensure you have:

- [ ] Access to your domain's DNS settings
- [ ] A verified domain (e.g., `findconstructionstaffing.com`)
- [ ] Access to Supabase project dashboard (production project)
- [ ] Ability to wait ~24-48 hours for DNS propagation

---

## Step 1: Create Resend Account

### 1.1 Sign Up

1. Go to https://resend.com
2. Click "Start Building" or "Sign Up"
3. Sign up with your email or GitHub account
4. Verify your email address

### 1.2 Initial Setup

After signup, you'll land on the Resend dashboard.

**Note:** You can send emails immediately from `onboarding@resend.dev`, but for production you MUST verify your own domain.

---

## Step 2: Add and Verify Your Domain

### 2.1 Add Domain in Resend

1. In Resend dashboard, go to **Domains** (left sidebar)
2. Click **Add Domain**
3. Enter your domain: `findconstructionstaffing.com`
   - **Subdomain option:** For better organization, you can use `mail.findconstructionstaffing.com` or `email.findconstructionstaffing.com`
4. Click **Add**

### 2.2 Configure DNS Records

Resend will show you DNS records that need to be added. You'll need to add **3 types of records**:

#### SPF Record (Sender Policy Framework)

**Purpose:** Proves your domain authorizes Resend to send emails on your behalf

```
Type: TXT
Name: @ (or your root domain)
Value: v=spf1 include:_spf.resend.com ~all
```

**If you already have an SPF record:**
Don't create a duplicate! Instead, add `include:_spf.resend.com` to your existing record.

Example:

```
Before: v=spf1 include:_spf.google.com ~all
After:  v=spf1 include:_spf.google.com include:_spf.resend.com ~all
```

#### DKIM Records (DomainKeys Identified Mail)

**Purpose:** Cryptographic signatures that prove emails weren't tampered with

Resend will provide 3 DKIM records (they look like this):

```
Type: CNAME
Name: resend._domainkey.findconstructionstaffing.com
Value: resend._domainkey.resend.com

Type: CNAME
Name: resend2._domainkey.findconstructionstaffing.com
Value: resend2._domainkey.resend.com

Type: CNAME
Name: resend3._domainkey.findconstructionstaffing.com
Value: resend3._domainkey.resend.com
```

**Note:** The exact values will be shown in your Resend dashboard - copy them exactly.

#### DMARC Record (Optional but Recommended)

**Purpose:** Tells receiving servers what to do with emails that fail SPF/DKIM checks

```
Type: TXT
Name: _dmarc.findconstructionstaffing.com
Value: v=DMARC1; p=none; rua=mailto:dmarc@findconstructionstaffing.com
```

**DMARC Policy Levels:**

- `p=none` - Monitor only (recommended to start)
- `p=quarantine` - Send suspicious emails to spam
- `p=reject` - Reject emails that fail checks (use after monitoring shows good results)

### 2.3 Add DNS Records

**For most DNS providers (Cloudflare, Namecheap, GoDaddy, etc.):**

1. Log in to your DNS provider
2. Find DNS management / DNS settings
3. Add each record type (TXT and CNAME)
4. Copy values EXACTLY as shown in Resend dashboard
5. Save changes

**Common DNS Providers:**

- **Cloudflare:** DNS → Records → Add record
- **Namecheap:** Advanced DNS → Add New Record
- **GoDaddy:** DNS Management → Add → Select record type
- **Google Domains:** DNS → Custom records → Manage custom records

### 2.4 Wait for Verification

- DNS propagation typically takes **1-24 hours**
- Resend will automatically check your DNS records
- You can manually trigger verification by clicking **Verify** in the Resend dashboard

**Check DNS propagation:**

```bash
# Check SPF record
nslookup -type=TXT findconstructionstaffing.com

# Check DKIM records
nslookup -type=CNAME resend._domainkey.findconstructionstaffing.com
```

Or use online tools:

- https://mxtoolbox.com/SuperTool.aspx
- https://www.whatsmydns.net/

---

## Step 3: Get Resend API Key

### 3.1 Create API Key

1. In Resend dashboard, go to **API Keys** (left sidebar)
2. Click **Create API Key**
3. Configure the key:
   - **Name:** `FindConstructionStaffing Production`
   - **Permission:** `Sending access` (full access)
   - **Domain:** Select your verified domain
4. Click **Create**
5. **IMPORTANT:** Copy the API key immediately - it won't be shown again!

The API key will look like: `re_123abc456def789ghi012jkl345mno678`

### 3.2 Store API Key Securely

**DO NOT commit the API key to git!**

Store it in:

- Supabase project secrets (recommended)
- Environment variables in hosting platform (Vercel, etc.)
- Password manager for reference

---

## Step 4: Configure Supabase to Use Resend

Supabase supports custom SMTP settings. We'll configure it to use Resend's SMTP server.

### 4.1 Get Resend SMTP Credentials

Resend provides SMTP access using your API key:

```
SMTP Host: smtp.resend.com
SMTP Port: 465 (SSL) or 587 (TLS)
Username: resend
Password: <Your Resend API Key>
```

### 4.2 Configure in Supabase Dashboard

#### Option A: Supabase Dashboard (Recommended for Production)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Scroll down to **SMTP Settings**
4. Enable **Enable Custom SMTP**
5. Fill in the settings:

   ```
   Host: smtp.resend.com
   Port number: 465
   Username: resend
   Password: <Your Resend API Key from Step 3>
   Sender email: noreply@findconstructionstaffing.com
   Sender name: FindConstructionStaffing
   ```

6. Click **Save**

#### Option B: Supabase CLI (For Local Development)

Update `supabase/config.toml`:

```toml
[auth.email]
enable_signup = true
enable_confirmations = true
double_confirm_changes = true

[auth.email.smtp]
host = "smtp.resend.com"
port = 465
user = "resend"
pass = "env(RESEND_API_KEY)"
admin_email = "noreply@findconstructionstaffing.com"
sender_name = "FindConstructionStaffing"
```

**Note:** For security, use environment variables for the API key.

---

## Step 5: Update Email Templates

### 5.1 Configure "From" Email Address

Update your email templates to use your verified domain:

1. In Supabase dashboard: **Authentication** → **Email Templates**
2. Update the sender for each template type:
   - **Confirm signup:** `noreply@findconstructionstaffing.com`
   - **Reset password:** `noreply@findconstructionstaffing.com`
   - **Change email:** `noreply@findconstructionstaffing.com`

### 5.2 Test Email Templates

Use the Supabase template editor to verify:

- Variables render correctly (`{{ .ConfirmationURL }}`, `{{ .Email }}`, etc.)
- Styling looks good
- Links work

**Pro Tip:** Send test emails to multiple providers (Gmail, Outlook, Apple Mail) to check rendering.

---

## Step 6: Testing

### 6.1 Send Test Email

**Via Resend Dashboard:**

1. Go to **Emails** in Resend dashboard
2. Click **Send Test Email**
3. Fill in:
   ```
   From: noreply@findconstructionstaffing.com
   To: your-email@example.com
   Subject: Test Email
   Body: This is a test email from Resend
   ```
4. Click **Send**
5. Check your inbox (and spam folder)

**Via Supabase:**

1. Create a new user account in your app
2. Check email delivery for verification email
3. Test password reset flow
4. Verify all emails are delivered

### 6.2 Check Delivery Status

In Resend dashboard:

1. Go to **Emails** → **Logs**
2. View delivery status for each email:
   - ✅ **Delivered:** Successfully delivered
   - ⏳ **Sent:** Sent to recipient's server
   - ❌ **Bounced:** Email address doesn't exist
   - 🚫 **Complained:** Marked as spam by recipient

### 6.3 Test Checklist

- [ ] Test email sends successfully from Resend dashboard
- [ ] Signup verification email arrives (check inbox and spam)
- [ ] Password reset email arrives
- [ ] Email change verification email arrives (if implemented)
- [ ] All email links work correctly
- [ ] Emails don't land in spam folder
- [ ] Email formatting looks good on mobile and desktop
- [ ] Test with multiple email providers (Gmail, Outlook, Yahoo)

---

## Step 7: Monitoring & Maintenance

### 7.1 Monitor Email Delivery

**Resend Dashboard Metrics:**

- **Emails sent:** Total emails sent
- **Delivery rate:** Percentage successfully delivered
- **Bounce rate:** Emails that failed to deliver
- **Complaint rate:** Emails marked as spam

**Healthy Metrics:**

- Delivery rate: >95%
- Bounce rate: <5%
- Complaint rate: <0.1%

### 7.2 Set Up Webhooks (Optional)

Configure webhooks to track email events in your app:

1. In Resend dashboard: **Webhooks** → **Create Webhook**
2. Enter your endpoint URL (e.g., `https://findconstructionstaffing.com/api/webhooks/resend`)
3. Select events to track:
   - `email.sent`
   - `email.delivered`
   - `email.bounced`
   - `email.complained`
4. Save webhook URL and secret

### 7.3 Handle Bounces

**Hard Bounces** (permanent failures):

- Email address doesn't exist
- Domain doesn't exist
- **Action:** Mark email as invalid, prevent future sends

**Soft Bounces** (temporary failures):

- Mailbox full
- Server temporarily down
- **Action:** Retry automatically (Resend handles this)

### 7.4 Monitor Sender Reputation

Check your domain's email reputation:

- https://www.senderscore.org/
- https://postmaster.google.com/ (requires verification)
- https://postmaster.live.com/snds/ (Microsoft)

**Good reputation indicators:**

- Low complaint rate (<0.1%)
- Low bounce rate (<5%)
- Consistent sending patterns
- Proper authentication (SPF, DKIM, DMARC)

---

## Troubleshooting

### Problem: Emails Going to Spam

**Causes:**

1. Domain not verified (SPF/DKIM missing)
2. No DMARC policy
3. Low sender reputation (new domain)
4. Spammy content or links

**Solutions:**

- ✅ Verify all DNS records are correct
- ✅ Add DMARC record
- ✅ Start with low email volume, gradually increase
- ✅ Avoid spam trigger words ("free," "act now," etc.)
- ✅ Include unsubscribe link (if sending marketing emails)
- ✅ Use a warm-up service for new domains

### Problem: DNS Records Not Verifying

**Causes:**

1. DNS propagation delay (can take 24-48 hours)
2. Incorrect record values
3. Multiple SPF records (only one allowed)

**Solutions:**

- ✅ Wait 24 hours and check again
- ✅ Use DNS checker tools to verify records
- ✅ Ensure SPF record doesn't have duplicates
- ✅ Check for typos in CNAME values

### Problem: High Bounce Rate

**Causes:**

1. Invalid email addresses
2. Typos in email addresses
3. Purchased/scraped email lists (don't do this!)

**Solutions:**

- ✅ Implement email validation on signup
- ✅ Use double opt-in (email verification)
- ✅ Remove hard-bounced addresses from database
- ✅ Only email users who signed up directly

### Problem: Emails Not Sending

**Causes:**

1. Invalid API key
2. Unverified domain
3. Rate limiting (exceeded free tier)
4. SMTP credentials incorrect

**Solutions:**

- ✅ Regenerate API key and update in Supabase
- ✅ Verify domain in Resend dashboard
- ✅ Check Resend usage limits
- ✅ Double-check SMTP settings in Supabase

---

## Security Best Practices

### 7.1 API Key Security

- ✅ **Never** commit API keys to git
- ✅ Store in environment variables or secrets manager
- ✅ Rotate API keys every 90 days
- ✅ Use separate API keys for staging and production
- ✅ Revoke old keys after rotation

### 7.2 Email Security

- ✅ Enable SPF, DKIM, and DMARC
- ✅ Use HTTPS for all email links
- ✅ Include unsubscribe links for marketing emails
- ✅ Validate email addresses before sending
- ✅ Implement rate limiting to prevent abuse

### 7.3 Compliance

- ✅ **CAN-SPAM Act:** Include physical address and unsubscribe link
- ✅ **GDPR:** Get consent before sending emails (verification emails exempt)
- ✅ **Privacy Policy:** Explain how you use email addresses

---

## Cost Planning

### Resend Pricing (as of 2025)

**Free Tier:**

- 3,000 emails/month
- 100 emails/day
- 1 verified domain
- Email logs (7 days)

**Pro Plan: $20/month**

- 50,000 emails/month
- Unlimited emails/day
- 10 verified domains
- Email logs (30 days)
- Priority support

**Enterprise: Custom Pricing**

- Custom email volume
- Dedicated IP addresses
- SLA guarantees
- Advanced features

### Volume Estimation

**Current needs:**

- Signup verifications: ~100/month (early stage)
- Password resets: ~20/month
- Email changes: ~5/month
- **Total:** ~125/month ✅ Free tier sufficient

**Growth projections:**

- 1,000 users: ~500 emails/month (free tier)
- 10,000 users: ~5,000 emails/month (Pro plan recommended)
- 100,000 users: ~50,000 emails/month (Pro plan or negotiate Enterprise)

---

## Migration from Inbucket (Local) to Resend (Production)

### What Changes

**Local Development (Inbucket):**

- Emails captured locally at http://localhost:54324
- No actual email delivery
- Fast testing without DNS/domain setup

**Production (Resend):**

- Real email delivery to user inboxes
- Domain verification required
- Proper sender authentication
- Deliverability monitoring

### Deployment Checklist

Before deploying to production:

- [ ] Domain verified in Resend (green checkmark)
- [ ] DNS records propagated (24-48 hours wait)
- [ ] API key stored securely in Supabase
- [ ] SMTP settings configured in Supabase dashboard
- [ ] Email templates updated with verified domain
- [ ] Test emails sent and delivered successfully
- [ ] Email templates tested in multiple email clients
- [ ] Monitoring webhooks configured (optional)
- [ ] Environment variables set correctly
- [ ] Documentation updated with production settings

### Rollback Plan

If issues occur after deployment:

1. **Revert SMTP settings** in Supabase to Inbucket (local only)
2. **Check Resend logs** for error messages
3. **Verify DNS records** are correct
4. **Test with Resend test email** to isolate issue
5. **Contact Resend support** if needed

---

## Support Resources

### Resend Documentation

- **Main Docs:** https://resend.com/docs
- **SMTP Guide:** https://resend.com/docs/send-with-smtp
- **API Reference:** https://resend.com/docs/api-reference

### Supabase Documentation

- **Email Auth:** https://supabase.com/docs/guides/auth/auth-email
- **Custom SMTP:** https://supabase.com/docs/guides/auth/auth-smtp

### DNS/Email Tools

- **MXToolbox:** https://mxtoolbox.com/ (DNS checker)
- **Mail Tester:** https://www.mail-tester.com/ (spam score)
- **DNS Checker:** https://www.whatsmydns.net/

### Contact Support

- **Resend:** support@resend.com (or dashboard chat)
- **Supabase:** https://supabase.com/support

---

## Next Steps

After completing setup:

1. ✅ Complete Task X.2.2: Test email delivery in staging
2. ✅ Complete Task X.2.3: Deploy to production
3. ✅ Monitor delivery rates for first 7 days
4. ✅ Document any issues and resolutions
5. ✅ Set up automated monitoring/alerts
6. ✅ Schedule quarterly review of email metrics

---

**Setup completed?** Mark Task X.2 as complete in `tasks/007-production-ready-authentication-tasks.md`
