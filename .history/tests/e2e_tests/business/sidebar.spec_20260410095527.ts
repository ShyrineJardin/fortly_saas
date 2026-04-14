import { test, expect } from '@playwright/test';
import { loginFunctionality } from '../helpers/auth';

test.describe('Business Sidebar Navigation', () => {
    test('Sidebar should update and display correct content', async ({ page }) => {
        await loginFunctionality(page);

        const sidebar = page.getByRole('complementary')
        await sidebar.getByRole('button', { name: 'Edit' }).click()

        // ── Verify existing values ──
        const logoImg = sidebar.locator(`img[src*="cloudinary.com"][alt="${process.env.TEST_BUSINESS_NAME}"]`)
        await expect(logoImg).toBeVisible()
        console.log('✅ Business logo is visible')

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
        console.log('✅ Business email is visible and not editable')

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

        // ── Verify updated values in sidebar (form is now closed) ──
        await expect(sidebar.locator('p:has-text("Updated tagline for testing")')).toBeVisible()
        await expect(sidebar.locator('p:has-text("Updated description for testing")')).toBeVisible()
        await expect(sidebar.locator('p:has-text("Updated location for testing")')).toBeVisible()
        console.log('✅ Edited details are saved and visible in the sidebar')

        const facebookLogo = page.locator('a[href*="facebook.com"] svg').first()
        await expect(facebookLogo).toBeVisible()
        console.log('✅ Facebook logo is visible')

        const twitterLogo = page.locator('a[href*="twitter.com"] svg').first()
        await expect(twitterLogo).toBeVisible()
        console.log('✅ Twitter logo is visible')

        const instagramLogo = page.locator('a[href*="instagram.com"] svg').first()
        await expect(instagramLogo).toBeVisible()
        console.log('✅ Instagram logo is visible')

        const linkedinLogo = page.locator('a[href*="linkedin.com"] svg').first()
        await expect(linkedinLogo).toBeVisible()
        console.log('✅ LinkedIn logo is visible')

        // ── Verify correct URLs ──
        await expect(page.locator('a[href="https://www.facebook.com/updated-link-for-testing"]')).toBeVisible()
        await expect(page.locator('a[href="https://www.twitter.com/updated-link-for-testing"]')).toBeVisible()
        await expect(page.locator('a[href="https://www.instagram.com/updated-link-for-testing"]')).toBeVisible()
        await expect(page.locator('a[href="https://www.linkedin.com/updated-link-for-testing"]')).toBeVisible()
        console.log('✅ All social media links have correct URLs')

        // Checking updated details in client side sidebar
        console.log('Navigating to client side to verify updated details in the sidebar');
        const [newPage] = await Promise.all([
            page.context().waitForEvent('page'),
            page.locator('div.hidden.lg\\:block a[href="/test-business"]').click()
        ]);
        await newPage.waitForLoadState('domcontentloaded');
        await newPage.goto(`${newPage.url().split('/')[0]}//${newPage.url().split('/')[2]}/test-business`);
        await newPage.waitForLoadState('domcontentloaded');
        console.log('✅ Navigated to client side business page in new tab');
        await expect(newPage.locator('p:has-text("Updated tagline for testing")')).toBeVisible()
        await expect(newPage.locator('p:has-text("Updated description for testing")')).toBeVisible()
        await expect(newPage.locator('p:has-text("Updated location for testing")')).toBeVisible()
         // ── Verify updated values in sidebar (form is now closed) ──
        await expect(sidebar.locator('p:has-text("Updated tagline for testing")')).toBeVisible()
        await expect(sidebar.locator('p:has-text("Updated description for testing")')).toBeVisible()
        await expect(sidebar.locator('p:has-text("Updated location for testing")')).toBeVisible()
        console.log('✅ Edited details are saved and visible in the sidebar')

        const facebookLogo = page.locator('a[href*="facebook.com"] svg').first()
        await expect(facebookLogo).toBeVisible()
        console.log('✅ Facebook logo is visible')

        await expect(twitterLogo).toBeVisible()
        console.log('✅ Twitter logo is visible')

        await expect(instagramLogo).toBeVisible()
        console.log('✅ Instagram logo is visible')

        await expect(linkedinLogo).toBeVisible()
        console.log('✅ LinkedIn logo is visible')
        await expect(newPage.locator('a[href="https://www.facebook.com/updated-link-for-testing"]')).toBeVisible()
        console.log('✅ Edited details are visible in the client side sidebar')


        // ── Cleanup: Restore original values ──
        await sidebar.getByRole('button', { name: 'Edit' }).click()
        await page.waitForLoadState('networkidle')

        // restore text fields
        const taglineRestore = sidebar.locator('textarea').first()
        const descriptionRestore = sidebar.locator('textarea').nth(1)
        const locationRestore = sidebar.locator('textarea').nth(2)
        const facebookRestore = sidebar.locator('input[type="url"]').first()
        const twitterRestore = sidebar.locator('input[type="url"]').nth(1)
        const instagramRestore = sidebar.locator('input[type="url"]').nth(2)
        const linkedinRestore = sidebar.locator('input[type="url"]').nth(3)

        await taglineRestore.fill(process.env.TEST_BUSINESS_TAGLINE!)
        await descriptionRestore.fill(process.env.TEST_BUSINESS_DESCRIPTION!)
        await locationRestore.fill(process.env.TEST_BUSINESS_LOCATION!)

        // clear social media links
        await facebookRestore.fill('')
        await twitterRestore.fill('')
        await instagramRestore.fill('')
        await linkedinRestore.fill('')

        // save restored values
        await sidebar.getByRole('button', { name: 'Save Changes' }).click()
        await page.waitForLoadState('networkidle')
        console.log('✅ Original values restored — ready for next test run')

    })
})