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

        // adding service
        // adding service
await page.locator('button:has-text("Add Service")').click()
await page.waitForSelector('div.bg-white.rounded-2xl') // wait for modal
console.log('✅ Add Service modal opened')

// upload image — use force on hidden input
await page.locator('input[type="file"]').setInputFiles('tests/assets/sample-image.png')
console.log('✅ Image selected for service')

// select service type — Occupancy is nth(2)
await page.locator('input[name="serviceType"]').nth(2).check()
console.log('✅ Service type selected')

// fill service title — specific input after Service Type label
await page.locator('input[type="text"]').last().fill('Test Service')
console.log('✅ Service title filled')

// fill duration
await page.locator('input[type="number"]').fill('60')
console.log('✅ Duration filled')

// fill price
await page.locator('input[placeholder="1,500"]').fill('200')
console.log('✅ Price filled')

// fill description — textarea inside modal
await page.locator('div.bg-white.rounded-2xl textarea').fill('This is a description for the test service.')
console.log('✅ Description filled')

// save service — scope to modal
await page.locator('div.bg-white.rounded-2xl')
    .getByRole('button', { name: 'Save', exact: true })
    .click()
console.log('✅ Clicked Save')

// wait for modal to close
await page.waitForSelector('div.bg-white.rounded-2xl', { state: 'detached' })

// verify service is added
await expect(page.locator('h3:has-text("Test Service")')).toBeVisible()
console.log('✅ Service is added and visible')



    });
});