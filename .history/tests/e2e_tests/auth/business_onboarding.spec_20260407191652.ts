import {test, expect} from '@playwright/test';

test.describe('Business Onboarding', () => {
    test('should allow business to sign up with valid details', async ({page}) => {
        // Navigate to the signup page
        await page.goto(process.env.BASE_URL! + '/business/signup');

        console.log("Filling out the signup form with test data...");
        await page.fill("id=businessName", process.env.TEST_BUSINESS_NAME!);
        await page.fill("id=email", process.env.TEST_BUSINESS_EMAIL!);
        await page.fill("id=password", process.env.TEST_BUSINESS_PASSWORD!);
        await page.fill("id=confirmPassword", process.env.TEST_BUSINESS_PASSWORD!);
        await page.check("id=terms");
        await page.click("button[label='Create Account']");

        await page.waitForURL(process.env.BASE_URL + '/business/onboarding');
        console.log('✅ Signup successful, navigated to onboarding');
    });

    test('should allow business to complete onboarding', async ({page}) => {

});