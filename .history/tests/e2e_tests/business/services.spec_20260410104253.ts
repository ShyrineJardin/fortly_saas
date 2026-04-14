import { expect, test } from '@playwright/test';
import { loginFunctionality } from '../helpers/auth';

test.describe('Business Services Management', () => {
    test('should allow business to view and manage services', async ({ page }) => {
        // Login and navigate to services page
        await loginFunctionality(page);
        await page.locator('button:has-text("Services")').click();
        await page.waitForURL(process.env.BASE_URL + '/business/services');
        console.log('✅ Navigated to services page');
        
        // Adding booking policy
        await page.locator('button:has-text("Edit")').nth(2).click();
        await page.fill('input[type="text"][value="Booking Policy"]', 'Terms and conditions for booking');
        await page.fill('textarea', 'Booking policy details go here. Please read carefully before making a reservation.');
        await page.locator('button:has-text("Add policy item")').click();
        await page.fill('input[type="text"][placeholder="Policy 1"]', 'Booking must be made at least 24 hours in advance.');
        await page.locator('button:has-text("Add policy item")').click();
        await page.fill('input[type="text"][placeholder="Policy 2"]', 'Cancellations must be made at least 12 hours in advance.');
        await page.getByRole('button', { name: 'Save', exact: true }).click();

        // Verify booking policy is displayed
        await expect(page.locator('h3:has-text("Booking Policy")')).toBeVisible();
        await expect(page.locator('p:has-text("Booking policy details go here. Please read carefully before making a reservation.")')).toBeVisible();
        await expect(page.locator('li:has-text("Booking must be made at least 24 hours in advance.")')).toBeVisible();
        await expect(page.locator('li:has-text("Cancellations must be made at least 12 hours in advance.")')).toBeVisible();
        console.log('✅ Booking policy is displayed with all policy items');

        // adding service
        await page.locator('button:has-text("Add Service")').click();
        const file
        await page.fill('input[placeholder="Service Name"]', 'Test Service');
        await page.fill('textarea[placeholder="Service Description"]', 'This is a description for the test service.');
        await page.fill('input[placeholder="Price"]', '100');
        await page.getByRole('button', { name: 'Save', exact: true }).click();



    });
});