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
        const [newPage] = await Promise.all([
            page.context().waitForEvent('page'),
            page.locator('div.hidden.lg\\:block a[href="/test-business"]').click()
        ]);

        await newPage.waitForLoadState('domcontentloaded');
        await newPage.goto(`${newPage.url().split('/')[0]}//${newPage.url().split('/')[2]}/test-business/reviews`);
        await newPage.waitForLoadState('domcontentloaded');
        console.log('✅ Navigated to client reviews in new tab');

        await page.locator('button:has-text("Write a Review")').click();
        await page.fill("input [placeholder=\"Full name\"]", process.env.TEST_CLIENT_NAME!);
        await page.fill("input [placeholder=\"your@email.com\"]", process.env.TEST_CLIENT_EMAIL!);
        await page.fill("textarea[placeholder=\"Share your experience...\"]", );

    });
});