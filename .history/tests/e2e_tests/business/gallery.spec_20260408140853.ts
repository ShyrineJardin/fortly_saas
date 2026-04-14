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
        <header class="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 sticky top-0 z-50"><div class="flex items-center justify-between w-full"><div class="flex lg:hidden flex-col items-center justify-between w-full"><div class="flex justify-between w-full"><div class="flex items-center gap-3"><img src="https://res.cloudinary.com/dk5me67u2/image/upload/v1775615901/fortly/logos/kp000hnv5vas5d5smhsy.jpg" alt="Test Business" class="w-10 h-10 rounded-full object-cover"><div class="flex flex-col"><h3 class="text-sm font-bold text-gray-900 leading-tight">Test Business</h3><div class="flex items-center gap-2"><a href="/test-business" target="_blank" rel="noopener noreferrer" class="hover:opacity-80 transition-opacity"><span class="text-xs text-gray-500">fortly.xyz/</span><span class="text-xs font-semibold text-hoverGreen">test-business</span></a><button class="text-gray-400 hover:text-gray-600 relative"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="12" width="12" xmlns="http://www.w3.org/2000/svg"><rect width="336" height="336" x="128" y="128" fill="none" stroke-linejoin="round" stroke-width="32" rx="57" ry="57"></rect><path fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="m383.5 128 .5-24a56.16 56.16 0 0 0-56-56H112a64.19 64.19 0 0 0-64 64v216a56.16 56.16 0 0 0 56 56h24"></path></svg></button></div></div></div><div class="flex items-center gap-3"><button class="text-gray-700"><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true" height="28" width="28" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg></button><button class="text-gray-700"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="30" width="30" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32" d="M80 160h352M80 256h352M80 352h352"></path></svg></button></div></div><div class="flex items-center justify-center mt-5 gap-3"><div class="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100 cursor-pointer"><div class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div><span class="text-xs font-medium">Portfolio is live</span></div></div></div><div class="hidden lg:block flex-col w-full items-center justify-between"><div class="flex justify-between mb-6"><div class="flex flex-col"><div class="flex items-center gap-2"><a href="/test-business" target="_blank" rel="noopener noreferrer" class="hover:opacity-80 transition-opacity"><span class="text-sm text-gray-500">fortly.xyz/</span><span class="text-sm font-bold text-hoverGreen">test-business</span></a><button class="text-gray-400 hover:text-gray-600 relative"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><rect width="336" height="336" x="128" y="128" fill="none" stroke-linejoin="round" stroke-width="32" rx="57" ry="57"></rect><path fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="m383.5 128 .5-24a56.16 56.16 0 0 0-56-56H112a64.19 64.19 0 0 0-64 64v216a56.16 56.16 0 0 0 56 56h24"></path></svg></button></div><p class="text-[11px] text-gray-400">Click the link to preview your website</p></div><div class="flex items-center gap-6"><button class="text-sm text-gray-600 hover:text-green-600 transition-colors font-medium">Calendar</button><button class="bg-green-50 text-gray-900 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-opacity-80 transition-colors">Unlock Pro</button><button class="text-sm text-gray-600 hover:text-green-600 transition-colors">Settings</button><button class="text-sm text-gray-600 hover:text-green-600 transition-colors">Sign out</button></div></div><div class="flex items-center justify-center"><div class="cursor-pointer hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100"><div class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div><span class="text-xs font-medium">Portfolio is live</span></div></div></div></div></header>

        // Deleting the uploaded media should remove it from both business and client gallery
        console.log('Deleting the uploaded media from business gallery');
        await page.goto(process.env.BASE_URL + '/business/gallery');
        await page.locator(`img[alt="Gallery post"]`).click();
        await page.locator("button:has-text('Delete')").click();
        await page.waitForSelector(`img[src*="cloudinary.com"][alt="Gallery post"]`, { state: 'detached' });
        console.log('✅ Uploaded image is deleted from business gallery');

        await page.locator(`video[src*="cloudinary.com"]`).first().click();
        await page.locator("button:has-text('Delete')").click();
        await page.waitForSelector(`video[src*="cloudinary.com"]`, { state: 'detached' });
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