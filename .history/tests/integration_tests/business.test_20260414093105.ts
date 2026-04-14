/**
 * @jest-environment node
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import axios from 'axios';

jest.setTimeout(30000);

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_SLUG = 'test-business';

describe('Business API — Integration Tests', () => {

    // ── Get Business by Slug ──
    describe('GET /business/:slug', () => {
        test('should return business data for valid slug', async () => {
            const response = await axios.get(`${API_URL}/business/${TEST_SLUG}`);
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('business');
            console.log('✅ Business data returned for valid slug');
        });

        test('should return correct business name', async () => {
            const response = await axios.get(`${API_URL}/business/${TEST_SLUG}`);
            expect(response.data.business.businessName).toBe(process.env.TEST_BUSINESS_NAME);
        });

        test('should return correct business email', async () => {
            const response = await axios.get(`${API_URL}/business/${TEST_SLUG}`);
            expect(response.data.business.email).toBe(process.env.TEST_BUSINESS_EMAIL);
        });

        test('should return business with slug property', async () => {
            const response = await axios.get(`${API_URL}/business/${TEST_SLUG}`);
            expect(response.data.business).toHaveProperty('slug');
        });

        test('should return 404 for non-existent slug', async () => {
            expect.assertions(1); // ← replaces fail()
            try {
                await axios.get(`${API_URL}/business/nonexistent-slug-xyz`);
            } catch (error: any) {
                expect(error.response.status).toBe(404);
                console.log('✅ Correctly returned 404 for non-existent slug');
            }
        });
    });

    // ── Update Booking Policy ──
    describe('PUT /business/booking-policy', () => {
        let token: string;

        beforeAll(async () => {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email: process.env.TEST_BUSINESS_EMAIL,
                password: process.env.TEST_BUSINESS_PASSWORD
            });
            token = response.data.token;
        });

        test('should update booking policy successfully', async () => {
            const response = await axios.put(
                `${API_URL}/business/booking-policy`,
                {
                    title: 'Test Booking Policy',
                    description: 'Test description',
                    policyList: ['Policy 1', 'Policy 2']
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            expect(response.status).toBe(200);
            console.log('✅ Booking policy updated successfully');
        });

        test('should fail without token', async () => {
            expect.assertions(1);
            try {
                await axios.put(`${API_URL}/business/booking-policy`, {
                    title: 'Test'
                });
            } catch (error: any) {
                expect(error.response.status).toBe(401);
                console.log('✅ Correctly rejected missing token');
            }
        });

        afterAll(async () => {
            await axios.put(
                `${API_URL}/business/booking-policy`,
                { title: '', description: '', policyList: [] },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('✅ Booking policy restored');
        });
    });
});