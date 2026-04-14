/**
 * @jest-environment node
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import axios from 'axios';

jest.setTimeout(30000);

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_SLUG = 'test-business';

describe('Reviews API — Integration Tests', () => {
    let token: string;
    let createdReviewId: string;

    beforeAll(async () => {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: process.env.TEST_BUSINESS_EMAIL,
            password: process.env.TEST_BUSINESS_PASSWORD
        });
        token = response.data.token;
    });

    // ── Get Reviews by Slug ──
    describe('GET /reviews/business/:slug', () => {
        test('should return reviews for valid slug', async () => {
            const response = await axios.get(`${API_URL}/reviews/business/${TEST_SLUG}`);
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('reviews');
            console.log('✅ Reviews returned for valid slug');
        });

        test('should return reviews as array', async () => {
            const response = await axios.get(`${API_URL}/reviews/business/${TEST_SLUG}`);
            expect(Array.isArray(response.data.reviews)).toBe(true);
        });

        test('should return 404 for non-existent slug', async () => {
            try {
                await axios.get(`${API_URL}/reviews/business/nonexistent-slug-xyz`);
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.response.status).toBe(404);
                console.log('✅ Correctly returned 404 for non-existent slug');
            }
        });
    });

    // ── Get My Reviews ──
    describe('GET /reviews/my-reviews', () => {
        test('should return reviews for authenticated business', async () => {
            const response = await axios.get(`${API_URL}/reviews/my-reviews`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('reviews');
            console.log('✅ My reviews returned successfully');
        });

        test('should fail without token', async () => {
            try {
                await axios.get(`${API_URL}/reviews/my-reviews`);
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.response.status).toBe(401);
                console.log('✅ Correctly rejected missing token');
            }
        });
    });

    // ── Create Review ──
    describe('POST /reviews', () => {
        test('should create a review successfully', async () => {
            const response = await axios.post(`${API_URL}/reviews`, {
                businessSlug: TEST_SLUG,
                clientName: process.env.TEST_CLIENT_NAME,
                clientEmail: process.env.TEST_CLIENT_EMAIL,
                rating: 5,
                reviewText: 'Integration test review'
            });
            expect(response.status).toBe(201);
            expect(response.data).toHaveProperty('review');
            createdReviewId = response.data.review.id;
            console.log('✅ Review created:', createdReviewId);
        });

        test('should fail with missing required fields', async () => {
            try {
                await axios.post(`${API_URL}/reviews`, {});
                fail('Should have thrown an error');
            } catch (error: any) {
                expect([400, 500]).toContain(error.response.status);
                console.log('✅ Correctly rejected missing fields');
            }
        });
    });

    // ── Reply to Review ──
    describe('PUT /reviews/:id/reply', () => {
        test('should reply to review successfully', async () => {
            const response = await axios.put(
                `${API_URL}/reviews/${createdReviewId}/reply`,
                { businessReply: 'Thank you for your review!' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            expect(response.status).toBe(200);
            console.log('✅ Review reply added successfully');
        });

        test('should fail without token', async () => {
            try {
                await axios.put(
                    `${API_URL}/reviews/${createdReviewId}/reply`,
                    { businessReply: 'Test' }
                );
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.response.status).toBe(401);
                console.log('✅ Correctly rejected missing token');
            }
        });
    });
});