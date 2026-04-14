import { expect, test } from '@playwright/test';
import { loginFunctionality } from '../helpers/auth';

test.describe('Business Services Management', () => {
    test('should allow business to view and manage services', async ({ page }) => {
        // Login and navigate to services page
        await loginFunctionality(page);
        await page.locator('button:has-text("Services")').click();
        await page.waitForURL(process.env.BASE_URL + '/business/services');
        console.log('✅ Navigated to services page');
        
        // Adding booking policy
        await page.locator('button:has-text("Edit")').nth.click();


    });
});