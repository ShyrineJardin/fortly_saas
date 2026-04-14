import { test, expect} from '@playwright/test';
import path from 'path';

test.describe('Business Gallery', () => {
    test('Upload and display images in the gallery', async ({ page }) => {
        // Gallery tab should go to /business/gallery
        await page.click("button:has-text('Gallery')");
        await page.waitForURL(process.env.BASE_URL + '/business/gallery');
        console.log('✅ Navigated to gallery page');

        // Click Upload button and select an image
        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            page.click("button:has-text('Upload')")
        ])

        const filepath = path.resolve(process.cwd(), 'tests/assets/sample-image.png');
        await fileChooser.setFiles(filepath);
        console.log('✅ Image selected for upload');

        // Wait for the image to appear in the gallery
        const uploadedImage = await page.waitForSelector(`img[src*="sample-image.png"]`);
        expect(uploadedImage).toBeTruthy();
        console.log('✅ Uploaded image is displayed in the gallery');

        // Upload video
        const [videoChooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            page.click("button:has-text('Upload')")
        ])

        const videopath = path.resolve(process.cwd(), 'tests/assets/sample-video.mp4');
        await videoChooser.setFiles(videopath);
        console.log('✅ Video selected for upload');

        const uploadedVideo = await page.waitForSelector(`video source[src*="sample-video.mp4"]`);
        expect(uploadedVideo).toBeTruthy();
        console.log('✅ Uploaded video is displayed in the gallery');

        // uploaded image/video when click should zoom in, next and previous buttons should work
        await uploadedImage.click();
        const zoomedImage = await page.waitForSelector(`img[src*="sample-image.png" alt="Large view"]`);




    });


});