import { test, expect } from '@playwright/test';
import { loginFunctionality } from '../helpers/auth';

test.describe('Business Sidebar Navigation', () => {
    test(' Sidebar should update and display correct content' , async ({ page }) => {
        // Login
        await loginFunctionality(page);

        const sidebar = page.getByRole('complementary')

        await sidebar.getByRole('button', { name: 'Edit' }).click()

        const disableInput = sidebar.locator('input[disabled]').first()
        await expect(disableInput).toHaveValue(process.env.TEST_BUSINESS_NAME!)
        console.log('✅ Business name is visible and not editable')

        const textareaInput = sidebar.locator('textarea').first()
        await expect(textareaInput).toHaveValue(process.env.TEST_BUSINESS_TAGLINE!)
        console.log('✅ Tagline is visible and has correct value')

        const phoneInput = sidebar.locator('input[type="tel"]').first()
        await expect(phoneInput).toHaveValue(process.env.TEST_OWNER_MOBILENUMBER!)
        console.log('✅ Phone number is visible and has correct value')

        await expect(disableInput).toHaveValue(process.env.TEST_BUSINESS_!)
    
    });

});