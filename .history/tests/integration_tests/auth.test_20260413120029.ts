/**
 * @jest-environment node
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import axios from 'axios';

jest.setTimeout(30000);

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

describe('Auth API — Integration Tests', () => {

    // ── Login ──
    describe('POST /auth/login', () => {
        test('should login successfully with valid credentials', async () => {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email: process.env.TEST_BUSINESS_EMAIL,
                password: process.env.TEST_BUSINESS_PASSWORD
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('token');
            expect(response.data.token).toBeTruthy();
            console.log('✅ Login successful');
        });

        test('should return token as string', async () => {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email: process.env.TEST_BUSINESS_EMAIL,
                password: process.env.TEST_BUSINESS_PASSWORD
            });

            expect(typeof response.data.token).toBe('string');
        });

        test('should fail with wrong password', async () => {
            try {
                await axios.post(`${API_URL}/auth/login`, {
                    email: process.env.TEST_BUSINESS_EMAIL,
                    password: 'wrongpassword'
                });
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.response.status).toBe(400);
            }
        });

        test('should fail with wrong email', async () => {
            try {
                await axios.post(`${API_URL}/auth/login`, {
                    email: 'nonexistent@gmail.com',
                    password: 'wrongpassword'
                });
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.response.status).toBe(400);
                console.log('✅ Correctly rejected wrong email');
            }
        });

        test('should fail with missing email', async () => {
            try {
                await axios.post(`${API_URL}/auth/login`, {
                    password: process.env.TEST_BUSINESS_PASSWORD
                });
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.response.status).toBe(400);
                console.log('✅ Correctly rejected missing email');
            }
        });

        test('should fail with missing password', async () => {
            try {
                await axios.post(`${API_URL}/auth/login`, {
                    email: process.env.TEST_BUSINESS_EMAIL
                });
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.response.status).toBe(400);
                console.log('✅ Correctly rejected missing password');
            }
        });
    });

    // ── Get Me ──
    describe('GET /auth/me', () => {
        let token: string;

        beforeAll(async () => {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email: process.env.TEST_BUSINESS_EMAIL,
                password: process.env.TEST_BUSINESS_PASSWORD
            });
            token = response.data.token;
        });

        test('should return business data with valid token', async () => {
            const response = await axios.get(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('business');
            console.log('✅ Get me successful');
        });

        test('should return correct business name', async () => {
            const response = await axios.get(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            expect(response.data.business.businessName).toBe(process.env.TEST_BUSINESS_NAME);
        });

        test('should fail without token', async () => {
            try {
                await axios.get(`${API_URL}/auth/me`);
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.response.status).toBe(401);
                console.log('✅ Correctly rejected missing token');
            }
        });

        test('should fail with invalid token', async () => {
            try {
                await axios.get(`${API_URL}/auth/me`, {
                    headers: { Authorization: 'Bearer invalidtoken' }
                });
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.response.status).toBe(401);
                console.log('✅ Correctly rejected invalid token');
            }
        });
    });

    // ── Forgot Password ──
    describe('POST /auth/forgot-password', () => {
        test('should send reset email for existing account', async () => {
            const response = await axios.post(`${API_URL}/auth/forgot-password`, {
                email: process.env.TEST_BUSINESS_EMAIL
            });

            expect(response.status).toBe(200);
            console.log('✅ Forgot password email sent');
        });

        test('should fail with missing email', async () => {
            try {
                await axios.post(`${API_URL}/auth/forgot-password`, {});
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.response.status).toBe(400);
                console.log('✅ Correctly rejected missing email');
            }
        });
    });
});