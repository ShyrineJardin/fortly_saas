import { test, expect } from '@playwright/test';

test.describe('Business Google Login/Signup', () => {
    test('should allow business to sign up and log in with Google account', async ({ page }) => {
        // Navigate to the login page
        await page.goto(process.env.BASE_URL! + '/business/login');

        await page.click("a:has-text('Sign up')");
        await page.waitForURL(process.env.BASE_URL! + '/business/signup');
        await page.click("button:has-text('Sign up with Google')");


    });
});
