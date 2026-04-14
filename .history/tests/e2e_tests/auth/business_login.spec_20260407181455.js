import {test, expect} from '@playwright/test';

test.describe('Business Login', () => {
    test('should allow business to log in with valid credentials', async ({page}) => {

        // Navigate to the login page
        await page.goto('/login');

        
    
    });
});