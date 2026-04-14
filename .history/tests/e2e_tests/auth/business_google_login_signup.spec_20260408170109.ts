import { test, expect } from '@playwright/test';

test.describe('Business Google Login/Signup', () => {
    test('should allow business to sign up and log in with Google account', async ({ page }) => {
        // Navigate to the login page
        await page.goto(process.env.BASE_URL! + '/business/login');

        await page.click("a:has-text('Sign up')");
        await page.waitForURL(process.env.BASE_URL! + '/business/signup');

        // Wait for the new page from Google OAuth (not popup)
        const [newPage] = await Promise.all([
            page.context().waitForEvent('page'),
            page.click("button:has-text('Sign up with Google')"),
        ]);

        // Fill in the Google login form in the new page
        await newPage.waitForLoadState('networkidle');
        await newPage.waitForSelector("#identifierId", { timeout: 10000 });
        await newPage.click("#identifierId");
        await newPage.type("#identifierId", process.env.TEST_BUSINESS_GOOGLE_EMAIL!);
        await newPage.click("button:has-text('Next')");
        await newPage.waitForTimeout(1000);


    });
});
