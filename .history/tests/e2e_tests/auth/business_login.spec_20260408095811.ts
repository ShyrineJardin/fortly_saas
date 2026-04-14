import {test, expect} from '@playwright/test';
import path from 'path/win32';

test.describe('Business Login', () => {
    test('should allow business to log in with valid credentials', async ({page}) => {

        // Navigate to the login page
        await page.goto(process.env.BASE_URL! + '/business/login');

        await page.fill("#email", process.env.TEST_BUSINESS_EMAIL!);
        await page.fill("id=password", process.env.TEST_BUSINESS_PASSWORD!);
        await page.click("button:has-text('Sign In')");

        await page.waitForURL(process.env.BASE_URL + '/business/onboarding');
        console.log('✅ Signup successful, navigated to onboarding');

        // Fill out onboarding details - Upload logo
        const filepath = path.resolve(process.cwd(), 'tests/assets/logo.jpg');
        await page.setInputFiles("input#logo[type='file']", filepath);
        await page.fill("#businessName", process.env.TEST_BUSINESS_NAME!);
        await page.click()


        // Wait for navigation to the dashboard
        // await page.waitForURL(process.env.BASE_URL + '/business/gallery');
        // console.log('✅ Login successful, navigated to dashboard');
        
    
    });
});