import { describe } from 'node:test';
import {
    getCached,
    setCached,
    invalidateCache,
    invalidatePrefix

} from '../../src/utils/apiCache';


describe 