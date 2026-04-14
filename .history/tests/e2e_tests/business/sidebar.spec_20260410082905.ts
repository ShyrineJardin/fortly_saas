import { test, expect } from '@playwright/test';
import { loginFunctionality } from '../helpers/auth';

test.describe('Business Sidebar Navigation', () => {
    test(' Sidebar should update and display correct content' , async ({ page }) => {
        // Login
        await loginFunctionality(page);

        await page.locator('button:has-text("Edit")').first().click();

        await expect(page.locator('h3:has-text(process.env.TEST_BUSINESS_NAME!)')).toBeVisible();
        console.log('✅ Business name is displayed in sidebar');
    
    });

});