import {test, expect} from '@playwright/test';
import path from 'path/win32';

test.describe('Business Login', () => {
    test('should allow business to log in with valid credentials', async ({page}) => {

        // Navigate to the login page
        await page.goto(process.env.BASE_URL! + '/business/login');

        await page.fill("id=email", process.env.TEST_BUSINESS_EMAIL!);
        await page.fill("id=password", process.env.TEST_BUSINESS_PASSWORD!);
        await page.click("button:has-text('Sign In')");

        await page.waitForURL(process.env.BASE_URL + '/business/onboarding');
        console.log('✅ Signup successful, navigated to onboarding');

        // Fill out onboarding details
        await page.click("#logo input[type='file']");
        const filepath = path.resolve(__dirname, 'tests/assets/logo.jpg');
        await page.setInputFiles("#logo input[type='file']", filepath);


        // Wait for navigation to the dashboard
        // await page.waitForURL(process.env.BASE_URL + '/business/gallery');
        // console.log('✅ Login successful, navigated to dashboard');
        
    
    });
});