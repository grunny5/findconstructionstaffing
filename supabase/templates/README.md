# Email Templates

This directory contains email templates for Supabase authentication flows.

## Templates

### confirmation.html / confirmation.txt

**Purpose:** Email verification template sent to users after signup

**Variables:**

- `{{ .ConfirmationURL }}` - Verification link with token
- `{{ .SiteURL }}` - Base URL of the application
- `{{ .Email }}` - User's email address

**Features:**

- Responsive design (mobile and desktop)
- Clear call-to-action button
- 24-hour expiration notice
- Plain text fallback for email clients without HTML support
- Brand-consistent styling

## Testing Locally

### Using Supabase Local Development (Inbucket)

1. **Start Supabase locally:**

   ```bash
   supabase start
   ```

2. **Access Inbucket email interface:**
   - Open [http://localhost:54324](http://localhost:54324) in your browser

3. **Trigger verification email:**
   - Navigate to [http://localhost:3000/signup](http://localhost:3000/signup)
   - Create a test account with any email (e.g., `test@example.com`)
   - Submit the form

4. **View the email:**
   - Return to Inbucket interface
   - Click on the email from `test@example.com`
   - Verify the email renders correctly
   - Test the verification link

5. **Test responsive design:**
   - Resize browser window to mobile width
   - Verify layout adapts properly
   - Check that text is readable and button is tappable

### Email Client Testing

For production deployment, test in multiple email clients:

**Recommended Testing Tools:**

- [Litmus](https://litmus.com) - Email testing platform (paid)
- [Email on Acid](https://www.emailonacid.com) - Email testing (paid)
- Manual testing in Gmail, Outlook, Apple Mail

**Manual Testing Checklist:**

- [ ] Gmail (web)
- [ ] Gmail (mobile app - iOS/Android)
- [ ] Outlook (web)
- [ ] Outlook (desktop - Windows)
- [ ] Apple Mail (macOS)
- [ ] Apple Mail (iOS)
- [ ] Yahoo Mail
- [ ] Proton Mail

### Verification Points

When testing, verify:

- [ ] Email subject line displays correctly
- [ ] Logo/branding renders properly
- [ ] Verification button is visible and clickable
- [ ] Alternative link text is readable
- [ ] Expiration warning is prominent
- [ ] Footer information is legible
- [ ] Plain text version displays when HTML is disabled
- [ ] Email displays correctly on mobile devices
- [ ] All links use correct URLs with Supabase variables

## Configuration

Templates are referenced in `supabase/config.toml`:

```toml
[auth.email.template.confirmation]
subject = "Verify your FindConstructionStaffing account"
content_path = "./supabase/templates/confirmation.html"
```

## Customization

To modify the email template:

1. Edit `confirmation.html` for HTML version
2. Edit `confirmation.txt` for plain text version
3. Maintain Supabase template variables: `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`, `{{ .Email }}`
4. Test locally with Inbucket before deploying
5. Commit changes and push to trigger deployment

## Design Guidelines

- **Colors:** Blue primary (#2563eb), neutral grays
- **Typography:** System fonts for maximum compatibility
- **Layout:** Max width 600px, centered
- **Spacing:** Generous padding for readability
- **CTA Button:** Prominent, accessible, high contrast
- **Mobile:** Responsive breakpoint at 600px

## Future Templates

Additional templates to be added:

- `recovery.html` / `recovery.txt` - Password reset (Task 2.1.2)
- `email_change.html` / `email_change.txt` - Email change confirmation (Task 3.3)
- `magic_link.html` / `magic_link.txt` - Magic link login (future)
