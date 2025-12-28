import { test, expect } from '@playwright/test';

/**
 * E2E Test: Contractor Messages Agency from Profile Page
 *
 * Critical User Journey:
 * 1. User visits agency profile page
 * 2. Clicks "Send Message" button
 * 3. Composes and sends initial message
 * 4. Gets redirected to conversation thread
 * 5. Message appears in thread
 *
 * Prerequisites:
 * - Test user account created (contractor)
 * - Test agency profile exists (claimed)
 * - Authentication helper functions available
 *
 * Status: Basic structure implemented - requires auth helpers
 * TODO: Implement authentication helper and database seeding
 */

test.describe('Contractor Messages Agency', () => {
  test.skip('should allow contractor to message agency from profile page', async ({
    page,
  }) => {
    // TODO: Setup - seed test data
    // - Create test contractor user
    // - Create test agency (claimed)
    // - Create test agency owner user

    // TODO: Authenticate as contractor
    // await loginAsContractor(page);

    // Step 1: Visit agency profile page
    await page.goto('/recruiters/test-agency-slug');

    // Step 2: Verify "Send Message" button is visible (claimed agencies only)
    const sendMessageButton = page.locator('text=Send Message');
    await expect(sendMessageButton).toBeVisible();

    // Step 3: Click "Send Message" button
    await sendMessageButton.click();

    // Step 4: Modal should open with message input
    const messageModal = page.locator('[data-testid="message-modal"]');
    await expect(messageModal).toBeVisible();

    // Step 5: Compose message
    const messageTextarea = page.locator('textarea[name="message"]');
    await messageTextarea.fill(
      "Hi, I'm interested in your construction staffing services."
    );

    // Step 6: Send message
    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    // Step 7: Should redirect to conversation thread
    await expect(page).toHaveURL(/\/messages\/conversations\/.+/);

    // Step 8: Message should appear in thread
    await expect(
      page.locator('text=interested in your construction staffing services')
    ).toBeVisible();

    // Step 9: Conversation header should show agency name
    await expect(page.locator('text=Test Agency')).toBeVisible();

    // Step 10: Message input should be visible for replies
    const replyInput = page.locator('textarea[placeholder*="message"]');
    await expect(replyInput).toBeVisible();

    // TODO: Cleanup - delete test data
  });

  test.skip('should prevent duplicate conversations with same agency', async ({
    page,
  }) => {
    // TODO: Setup - create existing conversation
    // TODO: Authenticate as contractor
    // await loginAsContractor(page);

    // Visit agency profile
    await page.goto('/recruiters/test-agency-slug');

    // Click "Send Message"
    await page.locator('text=Send Message').click();

    // Should redirect directly to existing conversation (no modal)
    await expect(page).toHaveURL(/\/messages\/conversations\/.+/);

    // Existing messages should be visible
    await expect(page.locator('[data-testid="message-list"]')).toBeVisible();

    // TODO: Cleanup
  });

  test.skip('should require authentication to send messages', async ({
    page,
  }) => {
    // DO NOT authenticate

    // Visit agency profile
    await page.goto('/recruiters/test-agency-slug');

    // Click "Send Message"
    await page.locator('text=Send Message').click();

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);

    // Should preserve return URL
    await expect(page.url()).toContain('redirectTo=');

    // TODO: Cleanup
  });
});

/**
 * Test Helpers
 *
 * TODO: Implement these helper functions in e2e/helpers/auth.ts
 */

// async function loginAsContractor(page: Page): Promise<void> {
//   const email = 'contractor@test.com';
//   const password = 'test-password';
//
//   await page.goto('/login');
//   await page.fill('input[name="email"]', email);
//   await page.fill('input[name="password"]', password);
//   await page.click('button[type="submit"]');
//   await page.waitForURL('/');
// }

// async function loginAsAgencyOwner(page: Page): Promise<void> {
//   const email = 'agency@test.com';
//   const password = 'test-password';
//
//   await page.goto('/login');
//   await page.fill('input[name="email"]', email);
//   await page.fill('input[name="password"]', password);
//   await page.click('button[type="submit"]');
//   await page.waitForURL('/');
// }

// async function loginAsAdmin(page: Page): Promise<void> {
//   const email = 'admin@test.com';
//   const password = 'test-password';
//
//   await page.goto('/login');
//   await page.fill('input[name="email"]', email);
//   await page.fill('input[name="password"]', password);
//   await page.click('button[type="submit"]');
//   await page.waitForURL('/');
// }
