import { expect, test } from "@playwright/test";
import { loginFunctionality } from "../helpers/auth";

test.describe('Chat Functionality', () => {
    test('should allow business to send and receive messages in chat', async ({ browser }) => {

        const clientContext = await browser.newContext();
        const clientPage = await clientContext.newPage();

        const businessContext = await browser.newContext();
        const businessPage = await businessContext.newPage();

        

        await page.goto(process.env.BASE_URL! + '/test-business');
        

        await loginFunctionality(page);


    
    })

})