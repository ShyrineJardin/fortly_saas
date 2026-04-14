import {
    businessData,
    getBusinessName,
    getContactInfo,
    getBusinessHours
} from '../../src/components/shared/BusinessData';

// ── businessData object ──
describe('businessData', () => {
    test('has a name property', () => {
        expect(businessData.name).toBeDefined();
    });

    test('has a tagline property', () => {
        expect(businessData.tagline).toBeDefined();
    });

    test('has a phone property', () => {
        expect(businessData.phone).toBeDefined();
    });

    test('has an email property', () => {
        expect(businessData.email).toBeDefined();
    });

    test('has socialMedia with all platforms', () => {
        expect(businessData.socialMedia).toHaveProperty('facebook');
        expect(businessData.socialMedia).toHaveProperty('twitter');
        expect(businessData.socialMedia).toHaveProperty('instagram');
        expect(businessData.socialMedia).toHaveProperty('linkedin');
    });

    test('has businessHours with 7 days', () => {
        expect(businessData.businessHours).toHaveLength(7);
    });

    test('has a timezone property', () => {
        expect(businessData.timezone).toBeDefined();
    });

    test('has a location property', () => {
        expect(businessData.location).toBeDefined();
    });

    test('has an about property', () => {
        expect(businessData.about).toBeDefined();
    });
});

// ── getBusinessName ──
describe('getBusinessName', () => {
    test('returns the business name', () => {
        expect(getBusinessName()).toBe(businessData.name);
    });

    test('returns a string', () => {
        expect(typeof getBusinessName()).toBe('string');
    });
});

// ── getContactInfo ──
describe('getContactInfo', () => {
    test('returns phone and email', () => {
        const contact = getContactInfo();
        expect(contact).toHaveProperty('phone');
        expect(contact).toHaveProperty('email');
    });

    test('returns correct phone', () => {
        expect(getContactInfo().phone).toBe(businessData.phone);
    });

    test('returns correct email', () => {
        expect(getContactInfo().email).toBe(businessData.email);
    });
});

// ── getBusinessHours ──
describe('getBusinessHours', () => {
    test('returns 7 days', () => {
        expect(getBusinessHours()).toHaveLength(7);
    });

    test('each day has a day and time property', () => {
        getBusinessHours().forEach(hour => {
            expect(hour).toHaveProperty('day');
            expect(hour).toHaveProperty('time');
        });
    });

    test('includes all days of the week', () => {
        const days = getBusinessHours().map(h => h.day);
        expect(days).toContain('Monday');
        expect(days).toContain('Tuesday');
        expect(days).toContain('Wednesday');
        expect(days).toContain('Thursday');
        expect(days).toContain('Friday');
        expect(days).toContain('Saturday');
        expect(days).toContain('Sunday');
    });

    test('returns same data as businessData.businessHours', () => {
        expect(getBusinessHours()).toEqual(businessData.businessHours);
    });
});