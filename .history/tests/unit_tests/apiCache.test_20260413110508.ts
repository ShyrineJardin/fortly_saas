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