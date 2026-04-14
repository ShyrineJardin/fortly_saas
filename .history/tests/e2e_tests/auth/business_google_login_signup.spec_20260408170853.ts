import { test, expect } from '@playwright/test';

test.describe('Business Google Login/Signup', () => {
  test('should allow business to sign up and log in with Google account', async ({ page, context }) => {
    await page.goto(process.env.BASE_URL! + '/business/login');

    await page.getByRole('link', { name: /sign up/i }).click();
    await page.waitForURL(/\/business\/signup/);

    const [googlePage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /sign up with google/i }).click(),
    ]);

    await googlePage.waitForLoadState('domcontentloaded');

    // Email
    await googlePage.getByRole('textbox', { name: /email/i }).fill(
      process.env.TEST_BUSINESS_GOOGLE_EMAIL!
    );

    await googlePage.getByRole('button', { name: /next/i }).click();

    // Wait for password step
    await googlePage.getByRole('textbox', { name: /enter your password/i }).fill(
      process.env.TEST_BUSINESS_GOOGLE_PASSWORD!
    );

    await googlePage.getByRole('button', { name: /next/i }).click();
  });
});