import { test, expect } from '@playwright/test';
import { loginFunctionality } from '../helpers/auth';

test.describe('Business Sidebar Navigation', () => {
    test(' Sidebar should update and display correct content' , async ({ page }) => {
        // Login
        await loginFunctionality(page);

        await page.locator('button:has-text("Edit")').click();

        await expect(page.locator('h3:has-text(proce)'))
    
    });

});