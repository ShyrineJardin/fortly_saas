import { test, expect } from '@playwright/test';
import { loginFunctionality } from '../helpers/auth';

test.describe('Business Sidebar Navigation', () => {
    test(' Sidebar should update and display correct content' , async ({ page }) => {
        // Login
        await loginFunctionality(page);

        const sidebar = page.getByRole('complementary')

        await sidebar.getByRole('button', { name: 'Edit' }).click()

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


        // Editing the details and saving should update the sidebar with new values
        
        await taglineInput.fill("Updated tagline for testing")

        const facebookLink = sidebar.locator('input[type="url"]').first()
        await facebookLink.fill("https://www.facebook.com/updated-link-for-testing")

        const twitterLink = sidebar.locator('input[type="url"]').nth(1)
        await twitterLink.fill("https://www.twitter.com/updated-link-for-testing")

        const instagramLink = sidebar.locator('input[type="url"]').nth(2)
        await instagramLink.fill("https://www.instagram.com/updated-link-for-testing")

        const linkedinLink = sidebar.locator('input[type="url"]').nth(3)
        await linkedinLink.fill("https://www.linkedin.com/updated-link-for-testing")

        // Setting business hours
        

        await descriptionInput.fill("Updated description for testing")
        await locationInput.fill("Updated location for testing")
        await sidebar.getByRole('button', { name: 'Save Changes' }).click()
        await expect(taglineInput).toHaveValue("Updated tagline for testing")
        await expect(descriptionInput).toHaveValue("Updated description for testing")
        await expect(locationInput).toHaveValue("Updated location for testing")
        console.log('✅ Edited details are saved and visible in the sidebar')

        // 

    });

});