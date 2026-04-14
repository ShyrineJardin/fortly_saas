import { expect, test } from '@playwright/test';
import { text } from 'stream/consumers';

test.describe('Booking Flow', () => {
    test('Client can book a service and see it in their bookings', async ({ page }) => {
        // Navigate to the business page
        await page.goto(process.env.TEST_BUSINESS_EXISTING_LINK!);
        console.log('✅ Navigated to business page');

        await page.locator('button:has-text("Services")').click();
        await page.locator('button.text-primaryGreen.hover\\:scale-110').first().click();
        await expect(page.locator('h3:has-text("Mini Mochi Tray")')).toBeVisible();
        console.log('✅ Service detail match the selected service');

        await page.locator('button:has-text("9:00 AM")').click();
        await page.fill("input[placeholder='John Doe']", process.env.TEST_CLIENT_NAME!);
        await page.fill("input[placeholder='john@example.com']", process.env.TEST_CLIENT_EMAIL!);
        await page.fill("input[type='tel']", process.env.TEST_CLIENT_MOBILENUMBER!);
        await page.fill("input[placeholder='123 Main St, City, State']", process.env.TEST_CLIENT_ADDRESS!);

        await page.locator('input[type="checkbox"]').click();
        awa
    });
});