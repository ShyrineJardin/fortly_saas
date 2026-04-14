/**
 * @jest-environment node
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import axios from 'axios';
import FormData from 'form-data';

jest.setTimeout(30000);

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_SLUG = 'test-business';

describe('Services API — Integration Tests', () => {
    let token: string;
    let createdServiceId: string;

    beforeAll(async () => {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: process.env.TEST_BUSINESS_EMAIL,
            password: process.env.TEST_BUSINESS_PASSWORD
        });
        token = response.data.token;
    });

    // ── Get Services by Slug ──
    describe('GET /services/business/:slug', () => {
        test('should return services for valid slug', async () => {
            const response = await axios.get(`${API_URL}/services/business/${TEST_SLUG}`);
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('services');
            console.log('✅ Services returned for valid slug');
        });

        test('should return services as array', async () => {
            const response = await axios.get(`${API_URL}/services/business/${TEST_SLUG}`);
            expect(Array.isArray(response.data.services)).toBe(true);
        });

        test('should return 404 for non-existent slug', async () => {
            try {
                await axios.get(`${API_URL}/services/business/nonexistent-slug-xyz`);
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.response.status).toBe(404);
                console.log('✅ Correctly returned 404 for non-existent slug');
            }
        });
    });

    // ── Get My Services ──
    describe('GET /services/my-services', () => {
        test('should return services for authenticated business', async () => {
            const response = await axios.get(`${API_URL}/services/my-services`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('services');
            console.log('✅ My services returned successfully');
        });

        test('should fail without token', async () => {
            try {
                await axios.get(`${API_URL}/services/my-services`);
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.response.status).toBe(401);
                console.log('✅ Correctly rejected missing token');
            }
        });
    });

    // ── Create Service ──
    describe('POST /services', () => {
        test('should create a service successfully', async () => {
            const formData = new FormData();
            formData.append('title', 'Integration Test Service');
            formData.append('duration', '30');
            formData.append('durationUnit', 'minutes');
            formData.append('price', '500');
            formData.append('description', 'Created by integration test');
            formData.append('serviceType', 'appointment');

            const response = await axios.post(`${API_URL}/services`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    ...formData.getHeaders()
                }
            });

            expect(response.status).toBe(201);
            expect(response.data).toHaveProperty('service');
            createdServiceId = response.data.service.id;
            console.log('✅ Service created successfully:', createdServiceId);
        });

        test('should fail without token', async () => {
            try {
                await axios.post(`${API_URL}/services`, {});
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.response.status).toBe(401);
                console.log('✅ Correctly rejected missing token');
            }
        });
    });

    // ── Update Service ──
    describe('PUT /services/:id', () => {
        test('should update a service successfully', async () => {
            const formData = new FormData();
            formData.append('title', 'Updated Integration Test Service');
            formData.append('price', '750');

            const response = await axios.put(
                `${API_URL}/services/${createdServiceId}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        ...formData.getHeaders()
                    }
                }
            );
            expect(response.status).toBe(200);
            console.log('✅ Service updated successfully');
        });

        test('should fail without token', async () => {
            try {
                await axios.put(`${API_URL}/services/${createdServiceId}`, {});
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.response.status).toBe(401);
                console.log('✅ Correctly rejected missing token');
            }
        });
    });

    // ── Delete Service ──
    describe('DELETE /services/:id', () => {
        test('should delete a service successfully', async () => {
            const response = await axios.delete(
                `${API_URL}/services/${createdServiceId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            expect(response.status).toBe(200);
            console.log('✅ Service deleted successfully');
        });

        test('should fail without token', async () => {
            try {
                await axios.delete(`${API_URL}/services/999999`);
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.response.status).toBe(401);
                console.log('✅ Correctly rejected missing token');
            }
        });
    });
});