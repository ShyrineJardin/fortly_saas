import { expect, test } from "@playwright/test";
import { loginFunctionality } from "../helpers/auth";

test.describe('Chat Functionality', () => {
    test('should allow business to send and receive messages in chat', async ({ page }) => {

        const gotoChatPage = async (page) => {
            await page.goto()
        await gotoChatPage(page);
        await loginFunctionality(page);
    
    })

})