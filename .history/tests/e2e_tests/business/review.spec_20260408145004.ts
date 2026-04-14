import {test, expect} from '@playwright/test';
import path from 'path';
import { loginFunctionality } from '../helpers/auth';

test.describe('Business Review Management', () => {
    test('should allow business to view and manage reviews', async ({ page }) => {
        // Login
        await loginFunctionality(page);
        await page.locator('button:has-text("Reviews")').click();
        await p
        await page.goto(process.env.BASE_URL! + '/business/reviews');


    });
});