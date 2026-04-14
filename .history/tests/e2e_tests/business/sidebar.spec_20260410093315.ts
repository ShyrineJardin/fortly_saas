import { test, expect } from '@playwright/test';
import { loginFunctionality } from '../helpers/auth';

test.describe('Business Sidebar Navigation', () => {
    test('Sidebar should update and display correct content', async ({ page }) => {
        await loginFunctionality(page);

        const sidebar = page.getByRole('complementary')
        await sidebar.getByRole('button', { name: 'Edit' }).click()

        // ── Verify existing values ──
        const businessnameInput = sidebar.locator('input[disabled]').first()
        await expect(businessnameInput).toHaveValue(process.env.TEST_BUSINESS_NAME!)
        console.log('✅ Business name is visible and not editable')

        const taglineInput = sidebar.locator('textarea').first()
        await expect(taglineInput).toHaveValue(process.env.TEST_BUSINESS_TAGLINE!)
        console.log('✅ Tagline is visible and has correct value')

        const phoneInput = sidebar.locator('input[type="tel"]').first()
        await expect(phoneInput).toHaveValue(process.env.TEST_OWNER_MOBILENUMBER!)
        console.log('✅ Phone number is visible and has correct value')

        const emailInput = sidebar.locator('input[disabled]').nth(1)
        await expect(emailInput).toHaveValue(process.env.TEST_BUSINESS_EMAIL!)
        console.log('✅ Business email is visible and has correct value')

        const descriptionInput = sidebar.locator('textarea').nth(1)
        await expect(descriptionInput).toHaveValue(process.env.TEST_BUSINESS_DESCRIPTION!)
        console.log('✅ Description is visible and has correct value')

        const locationInput = sidebar.locator('textarea').nth(2)
        await expect(locationInput).toHaveValue(process.env.TEST_BUSINESS_LOCATION!)
        console.log('✅ Location is visible and has correct value')

        // ── Edit details ──
        await taglineInput.fill('Updated tagline for testing')

        // fill social media links
        const facebookLink = sidebar.locator('input[type="url"]').first()
        await facebookLink.fill('https://www.facebook.com/updated-link-for-testing')

        const twitterLink = sidebar.locator('input[type="url"]').nth(1)
        await twitterLink.fill('https://www.twitter.com/updated-link-for-testing')

        const instagramLink = sidebar.locator('input[type="url"]').nth(2)
        await instagramLink.fill('https://www.instagram.com/updated-link-for-testing')

        const linkedinLink = sidebar.locator('input[type="url"]').nth(3)
        await linkedinLink.fill('https://www.linkedin.com/updated-link-for-testing')

        await descriptionInput.fill('Updated description for testing')
        await locationInput.fill('Updated location for testing')

        // ── Save changes ──
        await sidebar.getByRole('button', { name: 'Save Changes' }).click()
        console.log('✅ Clicked Save Changes')

        // wait for save to complete
        await page.waitForLoadState('networkidle')

        // ── Verify updated values ──
        await expect(taglineInput).toHaveValue('Updated tagline for testing')
        await expect(descriptionInput).toHaveValue('Updated description for testing')
        await expect(locationInput).toHaveValue('Updated location for testing')
        console.log('✅ Edited details are saved and visible in the sidebar')

        // verify each logo svg is visible
        const facebookLogo = page.locator('div.flex.gap-4 a[href*="facebook.com"] svg')
        await expect(facebookLogo).toBeVisible()
        console.log('✅ Facebook logo is visible')

        const twitterLogo = page.locator('div.flex.gap-4 a[href*="twitter.com"] svg')
        await expect(twitterLogo).toBeVisible()
        console.log('✅ Twitter logo is visible')

        const instagramLogo = page.locator('div.flex.gap-4 a[href*="instagram.com"] svg')
        await expect(instagramLogo).toBeVisible()
        console.log('✅ Instagram logo is visible')

        const linkedinLogo = page.locator('div.flex.gap-4 a[href*="linkedin.com"] svg')
        await expect(linkedinLogo).toBeVisible()
        console.log('✅ LinkedIn logo is visible')

        // ── Verify links open correctly ──
        await expect(page.locator('a[href="https://www.facebook.com/updated-link-for-testing"]')).toBeVisible()
        await expect(page.locator('a[href="https://www.twitter.com/updated-link-for-testing"]')).toBeVisible()
        await expect(page.locator('a[href="https://www.instagram.com/updated-link-for-testing"]')).toBeVisible()
        await expect(page.locator('a[href="https://www.linkedin.com/updated-link-for-testing"]')).toBeVisible()
        console.log('✅ All social media links have correct URLs')

        // ── Cleanup: Restore original values ──
        await sidebar.getByRole('button', { name: 'Edit' }).click()
        await page.waitForLoadState('networkidle')

        // restore text fields
        await taglineInput.fill(process.env.TEST_BUSINESS_TAGLINE!)
        await descriptionInput.fill(process.env.TEST_BUSINESS_DESCRIPTION!)
        await locationInput.fill(process.env.TEST_BUSINESS_LOCATION!)

        // clear social media links back to empty
        await facebookLink.fill('')
        await twitterLink.fill('')
        await instagramLink.fill('')
        await linkedinLink.fill('')

        // save restored values
        await sidebar.getByRole('button', { name: 'Save Changes' }).click()
        await page.waitForLoadState('networkidle')
        console.log('✅ Original values restored — ready for next test run')

    })
})