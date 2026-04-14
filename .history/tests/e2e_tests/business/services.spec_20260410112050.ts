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
        await page.locator('input[type="text"]').first().fill('Terms and conditions for booking');
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

        // Open Add Service modal
        await page.locator('button:has-text("Add Service")').click();

        // Scope all interactions to the modal to avoid collisions with background elements
        const modal = page.locator('div.bg-white.rounded-2xl').filter({ has: page.locator('h3:has-text("Add Service")') });
        await expect(modal).toBeVisible();

        // Upload image — input is hidden, so force is required
        await modal.locator('input[type="file"][accept="image/*"]').setInputFiles(
            'tests/assets/sample-image.png',
            { force: true }
        );

        // Select service type by value to be explicit (preparation = index 1)
        await modal.locator('input[type="radio"][value="preparation"]').check();

        // Fill service title using placeholder for a stable selector
        await modal.locator('input[type="text"]').fill('Test Service');

        // Fill duration
        await modal.locator('input[type="number"][placeholder="60"]').fill('30');

        // Fill price
        await modal.locator('input[placeholder="1,500"]').fill('500');

        // Fill description — scoped to modal to avoid hitting the policy textarea
        await modal.locator('textarea').fill('This is a test service for end-to-end testing purposes.');

        // Save the service
        await modal.getByRole('button', { name: 'Save', exact: true }).click();

        // Verify modal closes and the new service appears in the list
        await expect(modal).not.toBeVisible();
        await expect(page.locator('text=Test Service')).toBeVisible();
        console.log('✅ Service "Test Service" successfully added and visible in the list');
    });
});