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
        await page.locator('input[type="text"]').first().fill('Terms and conditions for booking')
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

        const modal = page.locator('div.bg-white.rounded-2xl').filter({ has: page.locator('h3:has-text("Add Service")') });
        await expect(modal).toBeVisible();

        // Make hidden file input visible, then upload
        const fileInput = modal.locator('input[type="file"][accept="image/*"]');
        await fileInput.evaluate(el => (el as HTMLInputElement).style.display = 'block');
        await fileInput.setInputFiles('tests/assets/sample-image.png');

        // Select service type explicitly by value
        await modal.locator('input[type="radio"][value="preparation"]').check();

        // Fill remaining fields scoped to modal
        await modal.locator('input[type="text"]:not([placeholder])').fill('Test Service');
        await modal.locator('input[type="number"][placeholder="60"]').fill('30');
        await modal.locator('input[placeholder="1,500"]').fill('500');
        await modal.locator('textarea').fill('This is a test service for end-to-end testing purposes.');

        // Save
        await modal.getByRole('button', { name: 'Save', exact: true }).click();

        // Verify modal closes and service appears
        await expect(modal).not.toBeVisible();
        await expect(page.locator('h3=Test Service')).toBeVisible();
        console.log('✅ Service "Test Service" successfully added and visible in the list');


    });
});