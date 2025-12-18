# Resend Setup Checklist

Quick reference checklist for setting up Resend with FindConstructionStaffing.

**📖 Full Guide:** See `RESEND_SETUP_GUIDE.md` for detailed instructions

---

## ☑️ Pre-Setup

- [ ] Have access to DNS settings for `findconstructionstaffing.com`
- [ ] Have access to Supabase production project dashboard
- [ ] Decided on sender email (recommended: `noreply@findconstructionstaffing.com`)

---

## 1️⃣ Resend Account Setup

- [ ] Created account at https://resend.com
- [ ] Verified email address
- [ ] Logged into Resend dashboard

---

## 2️⃣ Domain Verification

### Add Domain

- [ ] Navigated to **Domains** in Resend dashboard
- [ ] Clicked **Add Domain**
- [ ] Added domain: `findconstructionstaffing.com` (or subdomain)

### Configure DNS Records

- [ ] Added SPF record to DNS:

  ```
  Type: TXT
  Name: @
  Value: v=spf1 include:_spf.resend.com ~all
  ```

  (Or added `include:_spf.resend.com` to existing SPF record)

- [ ] Added 3 DKIM CNAME records (exact values from Resend dashboard)
  - [ ] `resend._domainkey`
  - [ ] `resend2._domainkey`
  - [ ] `resend3._domainkey`

- [ ] Added DMARC record (optional but recommended):
  ```
  Type: TXT
  Name: _dmarc
  Value: v=DMARC1; p=none; rua=mailto:dmarc@findconstructionstaffing.com
  ```

### Verify Domain

- [ ] Waited 1-24 hours for DNS propagation
- [ ] Clicked **Verify** in Resend dashboard
- [ ] Domain shows ✅ Verified status

---

## 3️⃣ API Key

- [ ] Navigated to **API Keys** in Resend dashboard
- [ ] Clicked **Create API Key**
- [ ] Named key: `FindConstructionStaffing Production`
- [ ] Selected permission: **Sending access**
- [ ] Selected verified domain
- [ ] Copied API key (starts with `re_`)
- [ ] Stored API key securely (password manager, env vars)
- [ ] **Did NOT commit API key to git** ⚠️

---

## 4️⃣ Supabase Configuration

### SMTP Settings

- [ ] Logged into Supabase project dashboard
- [ ] Navigated to **Authentication** → **Email Templates**
- [ ] Scrolled to **SMTP Settings**
- [ ] Enabled **Enable Custom SMTP**
- [ ] Configured settings:
  - Host: `smtp.resend.com`
  - Port: `465`
  - Username: `resend`
  - Password: `<Your Resend API Key>`
  - Sender email: `noreply@findconstructionstaffing.com`
  - Sender name: `FindConstructionStaffing`
- [ ] Clicked **Save**

### Update Email Templates

- [ ] Confirmed sender address in all templates:
  - [ ] Confirm signup template
  - [ ] Reset password template
  - [ ] Change email template

---

## 5️⃣ Testing

### Send Test Email (Resend Dashboard)

- [ ] Navigated to **Emails** in Resend dashboard
- [ ] Clicked **Send Test Email**
- [ ] Sent test from `noreply@findconstructionstaffing.com`
- [ ] Received test email (checked inbox AND spam folder)

### Test Authentication Flows

- [ ] Created new test user account
- [ ] Received signup verification email ✅
- [ ] Email didn't land in spam ✅
- [ ] Verification link works correctly ✅

- [ ] Tested password reset flow
- [ ] Received password reset email ✅
- [ ] Reset link works correctly ✅

### Multi-Client Testing

- [ ] Tested email rendering in Gmail
- [ ] Tested email rendering in Outlook
- [ ] Tested email rendering on mobile
- [ ] All links work on all platforms ✅

---

## 6️⃣ Monitoring Setup

- [ ] Checked Resend **Emails** → **Logs** for delivery status
- [ ] Confirmed delivery rate >95%
- [ ] Set up webhook for email events (optional)
- [ ] Added Resend dashboard to bookmarks for monitoring

---

## 7️⃣ Documentation

- [ ] Updated environment variables documentation
- [ ] Documented API key location
- [ ] Added Resend to runbook/ops docs
- [ ] Shared DNS records with team (for reference)

---

## 8️⃣ Production Deployment

- [ ] All tests passing ✅
- [ ] DNS fully propagated (48 hours elapsed)
- [ ] Staging environment tested successfully
- [ ] Production Supabase SMTP configured
- [ ] Deployed to production
- [ ] Sent production test emails
- [ ] Monitored first batch of real user emails
- [ ] Verified metrics look healthy

---

## ✅ Completion Criteria

Task X.2 is complete when:

- [x] Domain verified in Resend (green checkmark)
- [x] API key generated and stored securely
- [x] Supabase SMTP configured with Resend
- [x] Test emails sending successfully
- [x] Verification emails working end-to-end
- [x] Password reset emails working end-to-end
- [x] Emails not landing in spam
- [x] Monitoring dashboard accessible
- [x] Documentation updated

---

## 🆘 Troubleshooting Quick Links

**Emails going to spam?**
→ Check DNS records are verified
→ Ensure SPF, DKIM, DMARC all configured
→ Use https://www.mail-tester.com/ to check spam score

**DNS not verifying?**
→ Wait 24-48 hours for propagation
→ Check records with https://mxtoolbox.com/
→ Ensure no typos in CNAME values

**Emails not sending?**
→ Verify API key is correct in Supabase
→ Check Resend logs for error messages
→ Ensure domain is verified (not pending)

**Need help?**
→ Full guide: `docs/email/RESEND_SETUP_GUIDE.md`
→ Resend support: support@resend.com
→ Supabase support: https://supabase.com/support

---

## 📊 Success Metrics

After 1 week of production use:

- Delivery rate: >95% ✅
- Bounce rate: <5% ✅
- Complaint rate: <0.1% ✅
- Average delivery time: <5 seconds ✅

**Monitor at:** https://resend.com/emails

---

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Complete
