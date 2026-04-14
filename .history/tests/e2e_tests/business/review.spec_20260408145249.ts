import {test, expect} from '@playwright/test';
import path from 'path';
import { loginFunctionality } from '../helpers/auth';

test.describe('Business Review Management', () => {
    test('should allow business to view and manage reviews', async ({ page }) => {
        // Login
        await loginFunctionality(page);
        await page.locator('button:has-text("Reviews")').click();
        await page.waitForURL(process.env.BASE_URL + '/business/reviews');
        console.log('✅ Navigated to reviews page');

        // Adding review in client side to see it in business review page
        console.log('Adding a review from client side to verify it appears in business reviews');
        const []


    });
});