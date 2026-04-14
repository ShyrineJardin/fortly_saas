import {test, expect} from '@playwright/test';

test.describe('Business Onboarding', () => {
    test('should allow business to sign up with valid details', async ({page}) => {
        // Navigate to the signup page
        await page.goto(process.env.BASE_URL! + '/business/signup');

        console.log("")
    });

});