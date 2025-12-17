# Resend Webhook Setup Guide

**Purpose:** Configure webhooks to track email delivery events and handle bounces/complaints

---

## What Are Webhooks?

Webhooks allow Resend to notify your application when email events occur:

- **email.sent**: Email accepted by Resend
- **email.delivered**: Email successfully delivered
- **email.bounced**: Email bounced (hard or soft)
- **email.complained**: Recipient marked as spam

This allows you to:

- Track email delivery in real-time
- Handle bounced emails automatically
- Respond to spam complaints
- Monitor email performance

---

## Step 1: Get Your Webhook Secret from Resend

### 1.1 Find Your Webhook

1. Log in to Resend dashboard
2. Navigate to **Webhooks** in the left sidebar
3. You should see the webhook you created earlier
4. Click on your webhook to view details

### 1.2 Copy the Signing Secret

1. In the webhook details, find **Signing Secret**
2. Click the **Reveal** or **Copy** button
3. Copy the secret - it will look like: `whsec_xxxxxxxxxxxxxxxxxxxxx`

⚠️ **IMPORTANT:** Keep this secret secure! It's used to verify webhooks are really from Resend.

---

## Step 2: Add Secret to Environment Variables

### 2.1 Local Development

Add to your `.env.local` file:

```bash
# Resend Webhook Secret
RESEND_WEBHOOK_SECRET=whsec_your_actual_secret_here
```

**Example:**

```bash
RESEND_WEBHOOK_SECRET=whsec_abc123def456ghi789jkl012mno345pqr678
```

### 2.2 Production (Vercel)

If you're using Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Fill in:
   - **Name:** `RESEND_WEBHOOK_SECRET`
   - **Value:** `whsec_your_actual_secret_here`
   - **Environment:** Production (or all environments)
5. Click **Save**

### 2.3 Production (Other Hosting)

For other hosting platforms:

- **Netlify:** Site settings → Build & deploy → Environment variables
- **Railway:** Project → Variables
- **Heroku:** Settings → Config Vars
- **AWS/DigitalOcean:** Add to your deployment configuration

---

## Step 3: Verify Webhook Implementation

### 3.1 Check Webhook Endpoint Exists

The webhook handler is already created at:

```
app/api/webhooks/resend/route.ts
```

This endpoint:

- ✅ Verifies webhook signatures using Svix library
- ✅ Validates timestamp to prevent replay attacks (5-minute window)
- ✅ Handles all event types (sent, delivered, bounced, complained)
- ✅ Logs events to console (PII-redacted for GDPR/CCPA compliance)
- ✅ Uses hashed email addresses for correlation in logs
- 🔲 (Optional) Stores events in database

**Security Features:**

- Svix signature verification with `svix-id`, `svix-timestamp`, `svix-signature` headers
- Automatic replay attack protection (5-minute timestamp window)
- GDPR/CCPA compliant logging (no email addresses or subjects in logs)
- Runtime payload validation with Zod schema

### 3.2 Verify Environment Variable

Check your environment variable is loaded:

```bash
# In your project directory
node -e "console.log(process.env.RESEND_WEBHOOK_SECRET ? 'Webhook secret is set ✅' : 'Webhook secret is NOT set ❌')"
```

Or check in your Next.js app:

1. Add a temporary console log in `route.ts`:
   ```typescript
   console.log(
     'Webhook secret configured:',
     !!process.env.RESEND_WEBHOOK_SECRET
   );
   ```
2. Restart your dev server
3. Check the console output

---

## Step 4: Test the Webhook

### 4.1 Test Locally (Development)

**Option A: Use ngrok to expose local server**

1. Install ngrok: https://ngrok.com/
2. Start your Next.js dev server:
   ```bash
   npm run dev
   ```
3. In another terminal, start ngrok:
   ```bash
   ngrok http 3000
   ```
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. In Resend dashboard → Webhooks → Edit your webhook
6. Update URL to: `https://abc123.ngrok.io/api/webhooks/resend`
7. Save webhook
8. Send a test email from Resend dashboard
9. Check your Next.js console for webhook logs

**Option B: Deploy to staging first**

1. Deploy your app to staging/preview environment
2. Update webhook URL to staging URL
3. Test with real webhook events

### 4.2 Test in Production

1. Deploy your app to production (with `RESEND_WEBHOOK_SECRET` configured)
2. In Resend dashboard → Webhooks
3. Click **Send Test Event**
4. Select event type (e.g., `email.delivered`)
5. Click **Send**
6. Check your application logs for the webhook event

### 4.3 Expected Log Output

When a webhook is received, you should see:

```
[Resend Webhook] Event received: {
  type: 'email.delivered',
  email_id: 'abc123...',
  to: ['user@example.com'],
  created_at: '2025-12-16T...'
}
[Resend Webhook] Email delivered: { email_id: 'abc123...', to: ['user@example.com'] }
```

---

## Step 5: Monitor Webhook Delivery

### 5.1 Check Webhook Logs in Resend

1. Resend dashboard → **Webhooks**
2. Click on your webhook
3. Go to **Events** tab
4. You'll see:
   - ✅ **Successful deliveries** (200 response)
   - ❌ **Failed deliveries** (non-200 response)
   - ⏱️ **Response times**

### 5.2 Common Issues

**Webhook shows as failed in Resend:**

- Check your webhook endpoint is accessible (not localhost)
- Verify HTTPS is enabled (Resend requires HTTPS)
- Check application logs for errors
- Ensure environment variable is set

**Webhook returns 401 (Invalid signature):**

- Verify `RESEND_WEBHOOK_SECRET` matches Resend dashboard
- Check for extra spaces in the secret
- Ensure secret includes the `whsec_` prefix

**Webhook returns 500 (Server error):**

- Check application error logs
- Verify Next.js app is running
- Check for typos in the route handler

---

## Step 6: Handle Email Events (Optional)

The webhook handler currently **logs events to console**. You can enhance it to:

### 6.1 Store Email Logs in Database

Uncomment the database code in `route.ts` to track all emails:

```typescript
// In handleEmailSent():
await supabase.from('email_logs').insert({
  email_id: event.data.email_id,
  recipient: event.data.to[0],
  status: 'sent',
  sent_at: event.data.created_at,
});
```

**Note:** You'll need to create an `email_logs` table first.

### 6.2 Handle Hard Bounces

Automatically mark invalid emails to prevent future sends:

```typescript
// In handleEmailBounced():
if (bounce_type === 'hard') {
  await supabase
    .from('profiles')
    .update({ email_valid: false })
    .eq('email', to[0]);
}
```

### 6.3 Handle Spam Complaints

Automatically unsubscribe users who mark emails as spam:

```typescript
// In handleEmailComplained():
await supabase
  .from('profiles')
  .update({
    email_unsubscribed: true,
    unsubscribed_reason: 'spam_complaint',
  })
  .eq('email', to[0]);
```

---

## Security Best Practices

### ✅ DO:

- ✅ Always verify webhook signatures
- ✅ Store webhook secret in environment variables
- ✅ Use HTTPS for webhook endpoints
- ✅ Log webhook events for monitoring
- ✅ Return 200 status immediately (process asynchronously if needed)
- ✅ Implement retry logic for failed webhook processing

### ❌ DON'T:

- ❌ Don't commit webhook secrets to git
- ❌ Don't expose webhook endpoints publicly without signature verification
- ❌ Don't process webhooks synchronously if it takes >5 seconds
- ❌ Don't ignore webhook security (signature verification is critical)

---

## Webhook Event Reference

### email.sent

```json
{
  "type": "email.sent",
  "created_at": "2025-12-16T12:00:00Z",
  "data": {
    "email_id": "abc123",
    "from": "noreply@findconstructionstaffing.com",
    "to": ["user@example.com"],
    "subject": "Verify your email",
    "created_at": "2025-12-16T12:00:00Z"
  }
}
```

### email.delivered

```json
{
  "type": "email.delivered",
  "created_at": "2025-12-16T12:00:05Z",
  "data": {
    "email_id": "abc123",
    "from": "noreply@findconstructionstaffing.com",
    "to": ["user@example.com"],
    "subject": "Verify your email",
    "created_at": "2025-12-16T12:00:00Z"
  }
}
```

### email.bounced

```json
{
  "type": "email.bounced",
  "created_at": "2025-12-16T12:00:05Z",
  "data": {
    "email_id": "abc123",
    "from": "noreply@findconstructionstaffing.com",
    "to": ["invalid@example.com"],
    "subject": "Verify your email",
    "bounce_type": "hard",
    "created_at": "2025-12-16T12:00:00Z"
  }
}
```

### email.complained

```json
{
  "type": "email.complained",
  "created_at": "2025-12-16T12:00:05Z",
  "data": {
    "email_id": "abc123",
    "from": "noreply@findconstructionstaffing.com",
    "to": ["user@example.com"],
    "subject": "Verify your email",
    "complaint_feedback_type": "abuse",
    "created_at": "2025-12-16T12:00:00Z"
  }
}
```

---

## Troubleshooting

### Problem: Webhook secret not found

**Solution:**

1. Check `.env.local` has `RESEND_WEBHOOK_SECRET`
2. Restart Next.js dev server after adding env var
3. For production, verify env var is set in hosting platform

### Problem: Invalid signature error

**Solution:**

1. Copy webhook secret again from Resend dashboard
2. Ensure no extra spaces before/after the secret
3. Verify secret includes `whsec_` prefix
4. Check the secret in your env matches Resend exactly

### Problem: Webhook endpoint not receiving events

**Solution:**

1. Verify webhook URL in Resend dashboard is correct
2. Ensure URL is publicly accessible (not localhost)
3. Check HTTPS is enabled
4. Verify Next.js route exists at `/api/webhooks/resend`
5. Check application logs for errors

### Problem: High failure rate in Resend webhook logs

**Solution:**

1. Check application is deployed and running
2. Verify webhook endpoint responds within 5 seconds
3. Ensure endpoint returns 200 status code
4. Check for uncaught exceptions in webhook handler

---

## Next Steps

After webhook setup is complete:

1. ✅ Monitor webhook deliveries in Resend dashboard
2. ✅ Check application logs for webhook events
3. ✅ (Optional) Implement database logging for email events
4. ✅ (Optional) Add bounce/complaint handling logic
5. ✅ Set up monitoring/alerting for webhook failures

---

## Support

- **Resend Webhook Docs:** https://resend.com/docs/webhooks
- **Resend Support:** support@resend.com
- **Webhook Handler Code:** `app/api/webhooks/resend/route.ts`
