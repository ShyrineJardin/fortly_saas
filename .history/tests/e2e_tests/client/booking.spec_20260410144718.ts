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
        await page.locator('button:has-text("Confirm")').click();

        await expect(page.locator('h2:has-text("Booking Confirmed")')).toBeVisible();
        await expect(page.locator('h3:has-text("Mini Mochi Tray")')).toBeVisible();
        await expect(page.locator('h3:has-text("9:00 AM")')).toBeVisible();
        console.log('✅ Booking confirmation page is visible');

        await page.locator('button:has-text("Book another appointment")').click();

        await page.locator('button[title="View Appointments"]').click();
        await expect(page.locator('h3:has-text("Mini Mochi Tray")')).toBeVisible();
        await expect(page.locator('span:has-text("9:00 AM")')).toBeVisible();

        console.log('✅ Booking is visible in client appointments');

        // checking if the booking appears in business side
        await page.goto(process.env.BASE_URL! + '/business/login');
        await page.fill("#email", process.env.TEST_BUSINESS_EXISTING_ACCOUNT!);
        await page.fill("#password", process.env.TEST_BUSINESS_EXISTING_PASSWORD!);
        await page.click("button:has-text('Sign In')");
        await page.waitForURL(process.env.BASE_URL + '/business/gallery');
        console.log('✅ Business login successful');
        await page.locator('button:has-text("Calendar")').click();
        await expect(page.locator('div.truncate')).toHaveText("9:00 AM");
        await expect(page.locator('div.truncate').nth(1)).toHaveText(process.env.TEST_CLIENT_NAME!);
        console.log('✅ Booking is visible in business calendar');

        




    });
});