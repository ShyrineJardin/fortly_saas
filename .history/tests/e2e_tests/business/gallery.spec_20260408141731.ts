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
        const nextButton = modal.locator('button.absolute.right-2:visible');
        await nextButton.click();
        const zoomedImageAgain = page.locator('div.fixed.inset-0 img[alt="Large view"]');
        await expect(zoomedImageAgain).toBeVisible();
        console.log('✅ Clicked next button and image is displayed again in zoom view');

        // x button should close the zoom view
        await page.locator("button.absolute.top-4.right-4").click();
        const zoomView = await page.$(`img[src*="cloudinary.com"][  alt="Large view"]`);
        expect(zoomView).toBeNull();
        console.log('✅ Clicked x button and zoom view is closed');


        // Check in client side if the uploaded image and video are visible in the gallery
        console.log('Navigating to client side to verify uploaded media is visible in the gallery');
        const [newPage] = await Promise.all([
            page.context().waitForEvent('page'),
            page.locator('div.hidden.lg\\:block a[href="/test-business"]').click()
        ]);

        await newPage.waitForLoadState('domcontentloaded');
        await newPage.goto(`${newPage.url().split('/')[0]}//${newPage.url().split('/')[2]}/test-business/gallery`);
        await newPage.waitForLoadState('domcontentloaded');
        console.log('✅ Navigated to client gallery in new tab');

        // verify on newPage
        await expect(newPage.locator(`img[src*="cloudinary.com"][alt="Gallery post"]`)).toBeVisible();
        console.log('✅ Uploaded image is visible in the client gallery');

        await expect(newPage.locator('video[src*="cloudinary.com"]')).toBeVisible();
        console.log('✅ Uploaded video is visible in the client gallery');

        // Deleting the uploaded media should remove it from both business and client gallery
        console.log('Deleting the uploaded media from business gallery');
        await page.goto(process.env.BASE_URL + '/business/gallery');

        // --- Delete Image ---
        const imageItem = page.locator('div.group.relative').filter({
            has: page.locator('img[alt="Gallery post"]')
        }).first();

        // hover to reveal trash button
        await imageItem.hover();

        // click the red trash button (now visible after hover)
        await imageItem.locator('button.absolute.top-2.right-2').click();

        // handle confirmation popup - wait for dialog then click OK
        await page.waitForSelector('button:has-text("OK")', { timeout: 5000 });
        await page.locator('button:has-text("OK")').click();

        // wait for image to be removed
        await expect(page.locator(`img[alt="Gallery post"]`).first()).not.toBeVisible();
        console.log('✅ Uploaded image is deleted from business gallery');

        // --- Delete Video ---
        const videoItem = page.locator('div.group.relative').filter({
            has: page.locator('video[src*="cloudinary.com"]')
        }).first();

        // hover to reveal trash button
        await videoItem.hover();

        // click the red trash button
        await videoItem.locator('button.absolute.top-2.right-2').click();

        // handle confirmation popup
        await page.locator("button:has-text('Ok')").click();

        // wait for video to be removed
        await expect(page.locator('video[src*="cloudinary.com"]')).not.toBeVisible();
        console.log('✅ Uploaded video is deleted from business gallery');

        console.log('Verifying the uploaded media is also removed from client gallery');
        await page.locator('a:has-text("test-business")').click();
        await page.waitForURL(process.env.BASE_URL + '/test-business/gallery');
        await page.waitForSelector(`img[src*="cloudinary.com"][alt="Gallery post"]`, { state: 'detached' });
        console.log('✅ Uploaded image is removed from client gallery');

        await page.waitForSelector(`video[src*="cloudinary.com"]`, { state: 'detached' });
        console.log('✅ Uploaded video is removed from client gallery');


    });


});