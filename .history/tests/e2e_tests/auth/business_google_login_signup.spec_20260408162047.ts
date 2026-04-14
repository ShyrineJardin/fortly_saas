import { test, expect } from '@playwright/test';

test.describe('Business Google Login/Signup', () => {
    test('should allow business to sign up and log in with Google account', async ({ page }) => {
        // Navigate to the login page
        await page.goto(process.env.BASE_URL! + '/business/login');


    });
});
