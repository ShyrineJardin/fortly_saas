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
        await expect(page.locator('h3:has-text("Test Service")')).toBeVisible();
        console.log('✅ Service "Test Service" successfully added and visible in the list');

        // Edit the service
        // Edit the service
        const serviceCard = page.locator('div.rounded-2xl').filter({ has: page.locator('h3:has-text("Test Service")') });
        await serviceCard.hover();
        await serviceCard.locator('button.bg-blue-500').click();

        // ✅ Fixed: use exact heading text to avoid matching the service card
        const editModal = page.locator('div.bg-white.rounded-2xl').filter({ has: page.locator('h3:has-text("Edit Service")') });
        await expect(editModal).toBeVisible();

        // Update the service title
        await editModal.locator('input[type="text"]:not([placeholder])').clear();
        await editModal.locator('input[type="text"]:not([placeholder])').fill('Updated Test Service');

        // Update the price
        await editModal.locator('input[placeholder="1,500"]').clear();
        await editModal.locator('input[placeholder="1,500"]').fill('750');

        // Update the description
        await editModal.locator('textarea').clear();
        await editModal.locator('textarea').fill('Updated description for end-to-end testing purposes.');

        // Save
        await editModal.getByRole('button', { name: 'Save', exact: true }).click();

        // Verify modal closes and updated service appears
        await expect(editModal).not.toBeVisible();
        await expect(page.locator('h3:has-text("Updated Test Service")')).toBeVisible();
        await expect(page.locator('p:has-text("PHP 750")')).toBeVisible();
        console.log('✅ Service successfully updated and changes are visible in the list');

        // Setting Weekly Schedule
        await page.locator('button:has-text("Weekdays (M-F)")').click();
        await page.locator('button:has-text("Apply Changes")').click();
        await expect(page.locator('p:has-text("Monday: 9:00 AM - 5:00 PM")')).toBeVisible();
        await expect(page.locator('p:has-text("Tuesday: 9:00 AM - 5:00 PM")')).toBeVisible();
        await expect(page.locator('p:has-text("Wednesday: 9:00 AM - 5:00 PM")')).toBeVisible();
        await expect(page.locator('p:has-text("Thursday: 9:00 AM - 5:00 PM")')).toBeVisible();
        await expect(page.locator('p:has-text("Friday: 9:00 AM - 5:00 PM")')).toBeVisible();
        console.log('✅ Weekly schedule set and displayed correctly');


    });
});