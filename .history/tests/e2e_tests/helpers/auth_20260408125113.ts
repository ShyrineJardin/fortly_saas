import { Page } from '@playwright/test';
import path from 'path';

test.describe('Business Login', () => {
    test('should allow business to log in with valid credentials', async ({page}) => {

        // Navigate to the login page
        await page.goto(process.env.BASE_URL! + '/business/login');

        await page.fill("#email", process.env.TEST_BUSINESS_EMAIL!);
        await page.fill("#password", process.env.TEST_BUSINESS_PASSWORD!);
        await page.click("button:has-text('Sign In')");

        // Wait for navigation to the dashboard
        await page.waitForURL(process.env.BASE_URL + '/business/gallery');
        console.log('✅ Login successful, navigated to dashboard');
        
    });

});


export async function loginFunctionality(page: Page) {
   // Navigate to the login page
    await page.goto(process.env.BASE_URL! + '/business/login')  
    await page.fill("#email", process.env.TEST_BUSINESS_EMAIL!);
    await page.fill("#password", process.env.TEST_BUSINESS_PASSWORD!);
    await page.click("button:has-text('Sign In')")  
    // Wait for navigation to the dashboard
    await page.waitForURL(process.env.BASE_URL + '/business/gallery');
    console.log('✅ Login successful, navigated to dashboard');
}
