import { describe } from 'node:test';
import {
    getCached,
    setCached,
    invalidateCache,
    invalidatePrefix

} from '../../src/utils/apiCache';


describe ('apiCache', () => {
    it('should cache and retrieve data', () => {
        setCached('testKey', { value: 123 });
        const cachedData = getCached<{ value: number }>('testKey');
        if (!cachedData) throw new Error('Expected cached data, got null');
        if (cachedData.value !== 123) throw new Error(`Expected value 123, got ${cachedData.value}`);
    });

    it('should invalidate cache by key', () => {
        setCached('testKey2', { value: 456 });
        invalidateCache('testKey2');    
        const cachedData = getCached<{ value: number }>('testKey2');
        if (cachedData !== null) throw new Error('Expected null after invalidation, got cached data');
    }
    );

    it('should invalidate cache by prefix', () => {
        setCached('prefixKey1', { value: 789 });
        setCached('prefixKey2', { value: 101112 });
        invalidatePrefix('prefix');
        const cachedData1 = getCached<{ value: number }>('prefixKey1');
        const cachedData2 = getCached<{ value: number }>('prefixKey2');
        if (cachedData1 !== null) throw new Error('Expected null for prefixKey1 after invalidation, got cached data');
        if (cachedData2 !== null) throw new Error('Expected null for prefixKey2 after invalidation, got cached data');
    });
});