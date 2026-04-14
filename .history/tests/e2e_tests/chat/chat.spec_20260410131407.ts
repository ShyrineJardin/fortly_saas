import { expect, test } from "@playwright/test";
import { loginFunctionality } from "../helpers/auth";

test.describe('Chat Functionality', () => {
    test('should allow business to send and receive messages in chat', async ({ page }) => {

        const clientContext = await browser.newContext();
        

        await page.goto(process.env.BASE_URL! + '/test-business');
        

        await loginFunctionality(page);


    
    })

})