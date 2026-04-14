import { test, expect } from '@playwright/test';
import { loginFunctionality } from '../helpers/auth';

test('should allow business to send and receive messages', async ({ page }) => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const clientMessage = `Hello, I have a question! [${uniqueId}]`;
    const businessReply = `Hi! How can I help you? [${uniqueId}]`;

    // ── Business logs in ──
    await loginFunctionality(page);

    // ── Open public page as client in a new tab ──
    const clientPagePromise = page.context().waitForEvent('page');
    await page.evaluate((url) => window.open(url, '_blank'), process.env.BASE_URL! + '/test-business');
    const clientPage = await clientPagePromise;
    await clientPage.waitForLoadState('domcontentloaded');

    // ── Client opens chat and fills name form ──
    await clientPage.locator('button[title="Open Chat"]').click();
    await clientPage.locator('input[placeholder="Enter your name"]').first().fill(process.env.TEST_CLIENT_NAME!);
    await clientPage.locator('input[placeholder="your@email.com"]').first().fill(process.env.TEST_CLIENT_EMAIL!);
    await clientPage.locator('button:has-text("Start Chatting")').first().click();

    // ── Client sends a message ──
    await clientPage.getByRole('textbox', { name: 'Message' }).fill(clientMessage);
    await clientPage.keyboard.press('Enter');
    await expect(clientPage.locator(`text=${clientMessage}`).first()).toBeVisible();
    console.log('✅ Client sent:', clientMessage);

    // ── Business sees the message ──
    await page.waitForLoadState('networkidle');
await page.locator('button.bg-primaryGreen.rounded-full').click();
    await expect(page.locator(`text=${process.env.TEST_CLIENT_NAME}`).first()).toBeVisible({ timeout: 10000 });
    await page.locator(`text=${process.env.TEST_CLIENT_NAME}`).first().click();
    await expect(page.locator(`text=${clientMessage}`).first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Business received client message');

    // ── Business replies ──
    await page.getByRole('textbox', { name: 'Message' }).fill(businessReply);
    await page.keyboard.press('Enter');
    await expect(page.locator(`text=${businessReply}`).first()).toBeVisible();
    console.log('✅ Business sent:', businessReply);

    // ── Client sees reply ──
    await expect(clientPage.locator(`text=${businessReply}`).first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Client received business reply');
});