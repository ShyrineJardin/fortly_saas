import { expect, test } from '@playwright/test';

test.describe('Booking Flow', () => {
    test('Client can book a service and see it in their bookings', async ({ page }) => {