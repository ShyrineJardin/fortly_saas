import { test, expect} from '@playwright/test';

test.describe('Business Gallery', () => {
    test('Upload and display images in the gallery', async ({ page }) => {
        // Navigate to the business gallery page
        await page.goto(process.env.BASE_URL! + '/business/gallery');
    
});