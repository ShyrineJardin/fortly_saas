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

        await newPage.locator('button:has-text("Write a Review")').click();
        await newPage.fill("input[placeholder='Full name']", process.env.TEST_CLIENT_NAME!);
        await newPage.fill("input[placeholder='your@email.com']", process.env.TEST_CLIENT_EMAIL!);
        await newPage.fill("textarea[placeholder='Share your experience...']", "This is a test review. The service was excellent and I highly recommend this business!");
        
        // Click 4th star (0-indexed so nth-child(4))
        await newPage.locator('div.flex.items-center.justify-center.gap-2 button').nth(3).click();
        console.log('✅ Clicked 4 stars for rating');
        
        // Submit review
        await newPage.locator('button:has-text("Submit Review")').click();
        await newPage.waitForTimeout(1000);
        console.log('✅ Review submitted');

        // Verify review appears in client
        await expect(newPage.locator('h2:has-text("4.0")')).toBeVisible();
        await expect(newPage.locator('h3:has-text("Test Client")')).toBeVisible();
        await expect(newPage.locator('span .text-yellow-400')).toHaveCount(4);
        await expect(newPage.locator('p:has-text("This is a test review. The service was excellent and I highly recommend this business!")')).toBeVisible();
        console.log('✅ Review is visible in client side');

        // Verify review appears in business reviews page
        await page.bringToFront();
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('h2:has-text("4.0")')).toBeVisible();
        await expect(page.locator('h3:has-text("Test Client")')).toBeVisible();
        await expect(page.locator('span .text-yellow-400')).toHaveCount(4);
        await expect(page.locator('p:has-text("This is a test review. The service was excellent and I highly recommend this business!")')).toBeVisible();
        console.log('✅ Review is visible in business reviews page');

        // responding to the review
        await page.locator('button:has-text("Reply to this review")').click();
        await page.fill("textarea[placeholder='Write your reply...']", "Thank you for your kind words! We're thrilled to hear you had a great experience.");
        await page.locator('button:has-text("Save Reply")').click();
        await page.waitForTimeout(1000);
        console.log('✅ Response submitted');

        // Verify response appears in business reviews page


    });
});