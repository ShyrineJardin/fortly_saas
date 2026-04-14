// tests/e2e_tests/business/chat.spec.ts
import { expect, test } from "@playwright/test";
import { loginFunctionality } from "../helpers/auth";

test.describe('Chat Functionality', () => {
    test('should allow business to send and receive messages', async ({ browser }) => {

        const clientContext = await browser.newContext();
        const clientPage = await clientContext.newPage();

        const businessContext = await browser.newContext();
        const businessPage = await businessContext.newPage();

        const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const clientMessage = `Hello, I have a question! [${uniqueId}]`;
        const businessReply = `Hi! How can I help you? [${uniqueId}]`;

        try {
            // ── Client sends a message ──
            await clientPage.goto(process.env.BASE_URL! + '/test-business');
            await clientPage.locator('button[title="Open Chat"]').click();

            await clientPage.locator('input[placeholder="Enter your name"]').fill(process.env.TEST_CLIENT_NAME!);
            await clientPage.locator('input[placeholder="your@email.com"]').fill(process.env.TEST_CLIENT_EMAIL!);
            await clientPage.locator('button:has-text("Start Chatting")').click();

            await clientPage.locator('textarea[placeholder*="Message"]').fill(clientMessage);
            await clientPage.keyboard.press('Enter');
            await expect(clientPage.locator(`text=${clientMessage}`)).toBeVisible();
            console.log('✅ Client sent:', clientMessage);

            // ── Business logs in ──
            await loginFunctionality(businessPage);
            await clientPage.locator('button[title="Open Chat"]').click();
            await

            
            await expect(businessPage.locator(`text=${clientMessage}`)).toBeVisible();
            console.log('✅ Business received client message');

            // ── Business replies ──
            await businessPage.locator('textarea[placeholder*="Message"]').fill(businessReply);
            await businessPage.keyboard.press('Enter');
            await expect(businessPage.locator(`text=${businessReply}`)).toBeVisible();
            console.log('✅ Business sent:', businessReply);

            // ── Client sees reply ──
            await expect(clientPage.locator(`text=${businessReply}`)).toBeVisible();
            console.log('✅ Client received business reply');

        } finally {
            await clientContext.close();
            await businessContext.close();
        }
    });
});