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