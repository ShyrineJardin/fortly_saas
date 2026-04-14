import { expect, test } from '@playwright/test';
import { loginFunctionality } from '../helpers/auth';

text.describe('Business Services Management', () => {
    test('should allow business to view and manage services', async ({ page }) => {
        // Login and navigate to services page