import {test, expect} from '@playwright/test';

test.describe('Business Login', () => {
    test('should allow business to log in with valid credentials', async ({page}) => {

        // Navigate to the login page
        await page.goto(process.env.BASE_URL! + '/business/login');

        await page.fill("id=email", process.env.TEST_BUSINESS_EMAIL!);
        await page.fill("id=password", process.env.TEST_BUSINESS_PASSWORD!);
        await page.click("button:has-test(");

        // Wait for navigation to the dashboard
        await page.waitForURL(process.env.BASE_URL + '/business/gallery');
        console.log('✅ Login successful, navigated to dashboard');
    
    });
});