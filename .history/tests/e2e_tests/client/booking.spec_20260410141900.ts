import { expect, test } from '@playwright/test';

test.describe('Booking Flow', () => {
    test('Client can book a service and see it in their bookings', async ({ page }) => {
        // Navigate to the business page
        await page.goto(process.env.TEST_BUSINESS_EXISTING_LINK!);
        console.log('✅ Navigated to business page');

        await page.locator('button:has-text("Book Now")').first().click();
        await page.locator('button.text-primaryGreen.hover\\:scale-110').click();
    });
});