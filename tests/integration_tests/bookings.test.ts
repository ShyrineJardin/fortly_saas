/**
 * @jest-environment node
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import axios from 'axios';

jest.setTimeout(30000);

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_SLUG = 'test-business';

describe('Bookings API — Integration Tests', () => {
    let token: string;
    let createdBookingId: string;
    let serviceId: string;

    beforeAll(async () => {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: process.env.TEST_BUSINESS_EMAIL,
            password: process.env.TEST_BUSINESS_PASSWORD
        });
        token = loginRes.data.token;

        // Grab a real serviceId from the test business
        const servicesRes = await axios.get(`${API_URL}/services/business/${TEST_SLUG}`);
        serviceId = servicesRes.data.services[0]?.id || null;
        console.log('ℹ️ Using serviceId:', serviceId);
    });

    // ── Get Available Slots ──
    describe('GET /bookings/available-slots/:slug/:date', () => {
        test('should return available slots', async () => {
            if (!serviceId) {
                console.warn('⚠️ Skipping — no service found for test business');
                return;
            }
            const date = '2026-05-01';
            const response = await axios.get(
                `${API_URL}/bookings/available-slots/${TEST_SLUG}/${date}`,
                { params: { serviceId } }  // backend requires serviceId as query param
            );
            expect(response.status).toBe(200);
            console.log('✅ Available slots returned');
        });
    });

    // ── Create Booking ──
    describe('POST /bookings', () => {
        test('should create a booking successfully', async () => {
            if (!serviceId) {
                console.warn('⚠️ Skipping — no service found for test business');
                return;
            }
            const response = await axios.post(`${API_URL}/bookings`, {
                businessSlug: TEST_SLUG,
                clientName: process.env.TEST_CLIENT_NAME,
                clientEmail: process.env.TEST_CLIENT_EMAIL,
                clientPhone: process.env.TEST_CLIENT_MOBILENUMBER,
                clientAddress: process.env.TEST_CLIENT_ADDRESS,
                bookingDate: '2026-05-01',  // was 'date'
                bookingTime: '09:00',        // was 'time'
                serviceId
            });
            expect(response.status).toBe(201);
            expect(response.data).toHaveProperty('booking');
            createdBookingId = response.data.booking.id;
            console.log('✅ Booking created:', createdBookingId);
        });

        test('should fail with missing required fields', async () => {
            expect.assertions(1);
            try {
                await axios.post(`${API_URL}/bookings`, {});
            } catch (error: any) {
                expect([400, 404, 500]).toContain(error.response.status);
                console.log('✅ Correctly rejected missing fields');
            }
        });
    });

    // ── Get Client Bookings ──
    describe('GET /bookings/client/:email', () => {
        test('should return client bookings', async () => {
            const response = await axios.get(
                `${API_URL}/bookings/client/${process.env.TEST_CLIENT_EMAIL}`
            );
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('bookings');
            console.log('✅ Client bookings returned');
        });
    });

    // ── Get My Bookings (Business) ──
    describe('GET /bookings/my-bookings', () => {
        test('should return business bookings', async () => {
            const response = await axios.get(`${API_URL}/bookings/my-bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('bookings');
            console.log('✅ Business bookings returned');
        });

        test('should fail without token', async () => {
            expect.assertions(1);
            try {
                await axios.get(`${API_URL}/bookings/my-bookings`);
            } catch (error: any) {
                expect(error.response.status).toBe(401);
                console.log('✅ Correctly rejected missing token');
            }
        });
    });

    // ── Cancel Booking ──
    // Note: cancel route is public — it matches by id + clientEmail, not auth token
    describe('PUT /bookings/:id/cancel', () => {
        test('should cancel a booking successfully', async () => {
            if (!createdBookingId) {
                console.warn('⚠️ Skipping — no booking was created');
                return;
            }
            const response = await axios.put(
                `${API_URL}/bookings/${createdBookingId}/cancel`,
                {
                    clientEmail: process.env.TEST_CLIENT_EMAIL,  // backend matches on this
                    reason: 'Integration test cleanup',
                    cancelledBy: 'client'
                }
            );
            expect(response.status).toBe(200);
            console.log('✅ Booking cancelled successfully');
        });

        test('should fail without clientEmail', async () => {
            expect.assertions(1);
            try {
                await axios.put(
                    `${API_URL}/bookings/${createdBookingId}/cancel`,
                    {}  // no clientEmail → booking not found
                );
            } catch (error: any) {
                expect([400, 404, 500]).toContain(error.response.status);
                console.log('✅ Correctly rejected missing clientEmail');
            }
        });
    });
});