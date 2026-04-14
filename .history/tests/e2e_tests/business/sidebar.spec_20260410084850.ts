import { test, expect } from '@playwright/test';
import { loginFunctionality } from '../helpers/auth';

test.describe('Business Sidebar Navigation', () => {
    test(' Sidebar should update and display correct content' , async ({ page }) => {
        // Login
        await loginFunctionality(page);

        await page.getByRole('complementary').getByRole('button', { name: 'Edit' }).click()

        const businessNameInput = page.getByRole('textbox', { name: 'Business Name' })
        await expect(businessNameInput).toBeVisible();
        await expect(businessNameInput).toHaveValue(process.env.TEST_BUSINESS_NAME!);
        console.log('✅ Business name is displayed in sidebar');
    
    });

});