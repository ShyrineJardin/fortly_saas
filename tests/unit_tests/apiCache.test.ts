import {
    getCached,
    setCached,
    invalidateCache,
    invalidatePrefix
} from '../../src/utils/apiCache';

// ── Reset cache between tests ──
beforeEach(() => {
    invalidateCache('test-key');
    invalidatePrefix('test-');
});

// ── getCached ──
describe('getCached', () => {
    test('returns null if key does not exist', () => {
        expect(getCached('nonexistent-key')).toBeNull();
    });

    test('returns cached data if key exists and not expired', () => {
        setCached('test-key', { name: 'Fortly' });
        expect(getCached('test-key')).toEqual({ name: 'Fortly' });
    });

    test('returns null if cache is expired', () => {
        // Mock Date.now to simulate expiry
        const realDateNow = Date.now;
        setCached('test-key', { name: 'Fortly' });

        // Fast forward time by 3 minutes (beyond 2 min TTL)
        Date.now = jest.fn(() => realDateNow() + 3 * 60 * 1000);
        expect(getCached('test-key')).toBeNull();

        // Restore
        Date.now = realDateNow;
    });

    test('deletes key from cache when expired', () => {
        const realDateNow = Date.now;
        setCached('test-key', { name: 'Fortly' });

        Date.now = jest.fn(() => realDateNow() + 3 * 60 * 1000);
        getCached('test-key'); // triggers delete

        Date.now = realDateNow;
        expect(getCached('test-key')).toBeNull();
    });

    test('returns correct data type for string', () => {
        setCached('test-key', 'hello');
        expect(getCached('test-key')).toBe('hello');
    });

    test('returns correct data type for number', () => {
        setCached('test-key', 42);
        expect(getCached('test-key')).toBe(42);
    });

    test('returns correct data type for array', () => {
        setCached('test-key', [1, 2, 3]);
        expect(getCached('test-key')).toEqual([1, 2, 3]);
    });
});

// ── setCached ──
describe('setCached', () => {
    test('stores data in cache', () => {
        setCached('test-key', { id: 1 });
        expect(getCached('test-key')).toEqual({ id: 1 });
    });

    test('overwrites existing cached data', () => {
        setCached('test-key', { id: 1 });
        setCached('test-key', { id: 2 });
        expect(getCached('test-key')).toEqual({ id: 2 });
    });

    test('stores multiple keys independently', () => {
        setCached('test-key-1', 'value1');
        setCached('test-key-2', 'value2');
        expect(getCached('test-key-1')).toBe('value1');
        expect(getCached('test-key-2')).toBe('value2');
    });
});

// ── invalidateCache ──
describe('invalidateCache', () => {
    test('removes a specific key from cache', () => {
        setCached('test-key', { id: 1 });
        invalidateCache('test-key');
        expect(getCached('test-key')).toBeNull();
    });

    test('does not affect other keys', () => {
        setCached('test-key-1', 'value1');
        setCached('test-key-2', 'value2');
        invalidateCache('test-key-1');
        expect(getCached('test-key-1')).toBeNull();
        expect(getCached('test-key-2')).toBe('value2');
    });

    test('does nothing if key does not exist', () => {
        expect(() => invalidateCache('nonexistent-key')).not.toThrow();
    });
});

// ── invalidatePrefix ──
describe('invalidatePrefix', () => {
    test('removes all keys with matching prefix', () => {
        setCached('test-business-1', 'value1');
        setCached('test-business-2', 'value2');
        setCached('test-services-1', 'value3');

        invalidatePrefix('test-business-');

        expect(getCached('test-business-1')).toBeNull();
        expect(getCached('test-business-2')).toBeNull();
    });

    test('does not remove keys without matching prefix', () => {
        setCached('test-business-1', 'value1');
        setCached('test-services-1', 'value2');

        invalidatePrefix('test-business-');

        expect(getCached('test-services-1')).toBe('value2');
    });

    test('does nothing if no keys match prefix', () => {
        setCached('test-key', 'value');
        expect(() => invalidatePrefix('nonexistent-prefix-')).not.toThrow();
        expect(getCached('test-key')).toBe('value');
    });

    test('removes all keys if prefix matches all', () => {
        setCached('test-1', 'value1');
        setCached('test-2', 'value2');
        setCached('test-3', 'value3');

        invalidatePrefix('test-');

        expect(getCached('test-1')).toBeNull();
        expect(getCached('test-2')).toBeNull();
        expect(getCached('test-3')).toBeNull();
    });
});