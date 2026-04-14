import { Page } from '@playwright/test';
import path from 'path';

export async function loginAndCompleteOnboarding(page: Page) {
  // Login
  await page.goto(process.env.BASE_URL! + '/business/login');
  await page.fill("#email", process.env.TEST_BUSINESS_EMAIL!);
  await page.fill("#password", process.env.TEST_BUSINESS_PASSWORD!);
  await page.click("button:has-text('Sign In')");
  await page.waitForURL(process.env.BASE_URL + '/business/onboarding');
  
  // Complete onboarding
  const filepath = path.resolve(process.cwd(), 'tests/assets/logo.jpg');
  await page.setInputFiles("input#logo[type='file']", filepath);
  await page.fill("#businessName", process.env.TEST_BUSINESS_NAME!);
  
  // Wait for page stability
  await page.waitForLoadState('networkidle');
  
  const ownerNameField = page.locator("#ownerName");
  await ownerNameField.click();
  await ownerNameField.fill(process.env.TEST_OWNER_NAME!);
  await ownerNameField.blur();
  
  // Select category
  const categoryBtn = page.locator("button:has-text('Select category')");
  await categoryBtn.click();
  await page.waitForTimeout(500);
  await page.locator("text=Photography").click();
  
  await page.fill("#phone", process.env.TEST_OWNER_MOBILENUMBER!);
  await page.fill("#location", process.env.TEST_BUSINESS_LOCATION!);
  await page.fill("#tagline", process.env.TEST_BUSINESS_TAGLINE!);
  await page.fill("#description", process.env.TEST_BUSINESS_DESCRIPTION!);
  await page.click("button:has-text('Continue')");
  await page.waitForURL(process.env.BASE_URL + '/business/gallery');
  console.log('✅ Logged in and completed onboarding');
}
