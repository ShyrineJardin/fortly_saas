import {test, expect} from '@playwright/test';
import path from 'path';

test.describe('Business Onboarding', () => {
    test.setTimeout(600000); // Set timeout to 60 seconds for slower operations


    test('should allow business to sign up with valid details', async ({page}) => {
        // Navigate to the signup page
        await page.goto(process.env.BASE_URL! + '/business/signup');

        console.log("Filling out the signup form with test data...");
        await page.fill("id=businessName", process.env.TEST_BUSINESS_NAME!);
        await page.fill("id=email", process.env.TEST_BUSINESS_EMAIL!);
        await page.fill("id=password", process.env.TEST_BUSINESS_PASSWORD!);
        await page.fill("id=confirmPassword", process.env.TEST_BUSINESS_PASSWORD!);
        await page.check("id=terms");
        await page.click("button:has-text('Create Account')");

        await page.waitForURL(process.env.BASE_URL + '/business/onboarding');
        console.log('✅ Signup successful, navigated to onboarding');

        // Fill out onboarding details - Upload logo
        const filepath = path.resolve(process.cwd(), 'tests/assets/logo.jpg');
        await page.setInputFiles("input#logo[type='file']", filepath);
        await page.fill("#businessName", process.env.TEST_BUSINESS_NAME!);

        console.log("❕Business name should match the generated slug in the website onboarding");
        const expectedSlug = process.env.TEST_BUSINESS_NAME!.toLowerCase().replace(/\s+/g, '-');
        const slugElement = await page.waitForSelector("p:has-text('Your page will be: ') span");
        const fullText = await slugElement.textContent();
        const actualSlug = fullText?.split('/').pop() || '';
        expect(actualSlug).toBe(expectedSlug);
        console.log('✅ Slug generated correctly based on business name');

        // Wait for page to stabilize after interactions
        await page.waitForLoadState('networkidle');
        
        // Fill owner name with focus
        const ownerNameField = page.locator("#ownerName");
        await ownerNameField.click();
        await ownerNameField.fill(process.env.TEST_OWNER_NAME!);
        await ownerNameField.blur(); 
        
        // Select category - wait for dropdown to be visible
        const categoryBtn = page.locator("button:has-text('Select category')");
        await categoryBtn.click();
        await page.waitForTimeout(500); 
        await page.locator("text=Photography").click(); 

        await page.fill("#phone", process.env.TEST_OWNER_MOBILENUMBER!);
        await page.fill("#location", process.env.TEST_BUSINESS_LOCATION!);
        await page.fill("#tagline", process.env.TEST_BUSINESS_TAGLINE!);
        await page.fill("#description", process.env.TEST_BUSINESS_DESCRIPTION!);
        await page.click("button:has-text('Continue')");

        console.log('✅ Onboarding details filled out and submitted');

        // Wait for navigation to the dashboard
        await page.waitForURL(process.env.BASE_URL + '/business/gallery');
        console.log('✅ Login successful, navigated to dashboard');
        

        console.log('Deleting the test business account to clean up...');
        await page.locator('button:has-text("')

    });

});