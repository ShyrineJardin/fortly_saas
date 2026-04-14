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
const modal = page.locator('div.bg-white.rounded-2xl')

await modal.locator('input[type="file"]').setInputFiles('tests/assets/sample-image.png')
console.log('✅ Image selected for service')

// select service type
await modal.locator('input[name="serviceType"]').nth(2).check()
console.log('✅ Service type selected')

// fill service title — use getByRole textbox scoped to modal
await modal.getByRole('textbox').first().fill('Test Service')
console.log('✅ Service title filled')

// fill duration
await modal.locator('input[type="number"]').fill('60')
console.log('✅ Duration filled')

// fill price
await modal.locator('input[placeholder="1,500"]').fill('200')
console.log('✅ Price filled')

// fill description
await modal.getByRole('textbox').last().fill('This is a description for the test service.')
console.log('✅ Description filled')

// save
await modal.getByRole('button', { name: 'Save', exact: true }).click()
console.log('✅ Clicked Save')

// wait for modal to close
await page.waitForSelector('div.bg-white.rounded-2xl', { state: 'detached' })

// verify service added
await expect(page.locator('h3:has-text("Test Service")')).toBeVisible()
console.log('✅ Service is added and visible')



    });
});