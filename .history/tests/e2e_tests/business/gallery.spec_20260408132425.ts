import { test, expect} from '@playwright/test';
import path from 'path';
import { loginFunctionality } from '../helpers/auth';

test.describe('Business Gallery', () => {
    test('Upload and display images in the gallery', async ({ page }) => {
        // Login and complete onboarding
        await loginFunctionality(page);
        
        // Click Upload button and select an image
        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            page.click("button:has-text('Upload')")
        ])

        const filepath = path.resolve(process.cwd(), 'tests/assets/sample-image.png');
        await fileChooser.setFiles(filepath);
        console.log('✅ Image selected for upload');

        // Wait for the image to appear in the gallery
        await page.waitForSelector(`img[src*="cloudinary.com"][alt="Gallery post"]`);
        console.log('✅ Uploaded image is displayed in the gallery');

        // Upload video
        const [videoChooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            page.click("button:has-text('Upload')")
        ])

        const videopath = path.resolve(process.cwd(), 'tests/assets/sample-video.mp4');
        await videoChooser.setFiles(videopath);
        console.log('✅ Video selected for upload');

        await page.waitForSelector('video[src*="cloudinary.com"]');
        console.log('✅ Uploaded video is displayed in the gallery');

        // uploaded image/video when click should zoom in, next and previous buttons should work
        await page.locator(`img[alt="Gallery post"]`).click();
        const zoomedImage = await page.waitForSelector(`img[alt="Large view"]`);
        expect(zoomedImage).toBeTruthy();
        console.log('✅ Clicked on uploaded image and it zoomed in');

        // Click prev button to go to video
        await page.locator("button.absolute.left-2").click();
        const zoomedVideo = page.locator('video:visible');
        expect(zoomedVideo).toBeTruthy();
        console.log('✅ Clicked prev button and video is displayed in zoom view');

        // Click next button to go back to image
        const modal = page.locator('div.fixed.inset-0');
        await modal.locator('button').filter({ has: page.locator('svg') }).nth(2).click();
        const zoomedImageAgain = await page.waitForSelector(`img[src*="cloudinary.com"] alt="Large view"]`);
        expect(zoomedImageAgain).toBeTruthy();
        console.log('✅ Clicked next button and image is displayed again in zoom view');

        // x button should close the zoom view
        await page.locator("button.absolute.top-4.right-4").click();
        const zoomView = await page.$(`img[src*="cloudinary.com" alt="Large view"]`);
        expect(zoomView).toBeNull();
        console.log('✅ Clicked x button and zoom view is closed');


    });


});