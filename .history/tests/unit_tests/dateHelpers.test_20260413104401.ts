import {
    formatDate,
    formatTime,
    formatDateTime,
    getMonthName,
    getDaysInMonth,
    getFirstDayOfMonth,
    isToday,
    isSameDay,
    addDays,
    startOfWeek,
    endOfWeek,
    getWeekDays,
    formatDateForAPI,
    isUpcoming,
    isPast,
    getRelativeTime
} from '../../src/utils/dateHelpers'


// ── formatDate ──
describe('formatDate', () => {
    test('formats a date correctly', () => {
        expect(formatDate('2026-04-12')).toBe('Apr 12, 2026');
    });

    test('formats a different date correctly', () => {
        expect(formatDate('2026-01-01')).toBe('Jan 1, 2026');
    });
});

// ── formatTime ──
describe('formatTime', () => {
    test('formats morning time correctly', () => {
        expect(formatTime('09:00')).toBe('9:00 AM');
    });

    test('formats afternoon time correctly', () => {
        expect(formatTime('13:30')).toBe('1:30 PM');
    });

    test('formats midnight correctly', () => {
        expect(formatTime('00:00')).toBe('12:00 AM');
    });

    test('formats noon correctly', () => {
        expect(formatTime('12:00')).toBe('12:00 PM');
    });

    test('returns empty string if no time provided', () => {
        expect(formatTime('')).toBe('');
        expect(formatTime(null)).toBe('');
        expect(formatTime(undefined)).toBe('');
    });
});

// ── formatDateTime ──
describe('formatDateTime', () => {
    test('combines date and time correctly', () => {
        expect(formatDateTime('2026-04-12', '09:00')).toBe('Apr 12, 2026 at 9:00 AM');
    });
});

// ── getMonthName ──
describe('getMonthName', () => {
    test('returns correct month name for index 0', () => {
        expect(getMonthName(0)).toBe('January');
    });

    test('returns correct month name for index 11', () => {
        expect(getMonthName(11)).toBe('December');
    });

    test('returns correct month name for index 3', () => {
        expect(getMonthName(3)).toBe('April');
    });
});

// ── getDaysInMonth ──
describe('getDaysInMonth', () => {
    test('returns 31 for January', () => {
        expect(getDaysInMonth(2026, 0)).toBe(31);
    });

    test('returns 28 for February in non-leap year', () => {
        expect(getDaysInMonth(2026, 1)).toBe(28);
    });

    test('returns 29 for February in leap year', () => {
        expect(getDaysInMonth(2024, 1)).toBe(29);
    });

    test('returns 30 for April', () => {
        expect(getDaysInMonth(2026, 3)).toBe(30);
    });
});

// ── getFirstDayOfMonth ──
describe('getFirstDayOfMonth', () => {
    test('returns correct first day for April 2026 (Wednesday = 3)', () => {
        expect(getFirstDayOfMonth(2026, 3)).toBe(3);
    });

    test('returns correct first day for January 2026 (Thursday = 4)', () => {
        expect(getFirstDayOfMonth(2026, 0)).toBe(4);
    });
});

// ── isToday ──
describe('isToday', () => {
    test('returns true for today', () => {
        expect(isToday(new Date())).toBe(true);
    });

    test('returns false for yesterday', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        expect(isToday(yesterday)).toBe(false);
    });

    test('returns false for tomorrow', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        expect(isToday(tomorrow)).toBe(false);
    });
});

// ── isSameDay ──
describe('isSameDay', () => {
    test('returns true for same dates', () => {
        expect(isSameDay('2026-04-12', '2026-04-12')).toBe(true);
    });

    test('returns false for different dates', () => {
        expect(isSameDay('2026-04-12', '2026-04-13')).toBe(false);
    });
});

// ── addDays ──
describe('addDays', () => {
    test('adds days correctly', () => {
        const result = addDays('2026-04-12', 3);
        expect(result.getDate()).toBe(15);
        expect(result.getMonth()).toBe(3);
        expect(result.getFullYear()).toBe(2026);
    });

    test('handles month overflow', () => {
        const result = addDays('2026-04-30', 1);
        expect(result.getDate()).toBe(1);
        expect(result.getMonth()).toBe(4); // May
    });
});

// ── startOfWeek ──
describe('startOfWeek', () => {
    test('returns Sunday as start of week', () => {
        const result = startOfWeek(new Date('2026-04-12')); // Sunday
        expect(result.getDay()).toBe(0);
    });
});

// ── endOfWeek ──
describe('endOfWeek', () => {
    test('returns Saturday as end of week', () => {
        const result = endOfWeek(new Date('2026-04-12'));
        expect(result.getDay()).toBe(6);
    });
});

// ── getWeekDays ──
describe('getWeekDays', () => {
    test('returns 7 days', () => {
        expect(getWeekDays()).toHaveLength(7);
    });

    test('starts with Sun and ends with Sat', () => {
        const days = getWeekDays();
        expect(days[0]).toBe('Sun');
        expect(days[6]).toBe('Sat');
    });
});

// ── formatDateForAPI ──
describe('formatDateForAPI', () => {
    test('formats date as YYYY-MM-DD', () => {
        expect(formatDateForAPI('2026-04-12')).toBe('2026-04-12');
    });

    test('pads month and day with zeros', () => {
        expect(formatDateForAPI('2026-01-05')).toBe('2026-01-05');
    });
});

// ── isUpcoming ──
describe('isUpcoming', () => {
    test('returns true for future date', () => {
        expect(isUpcoming('2099-12-31', '23:59')).toBe(true);
    });

    test('returns false for past date', () => {
        expect(isUpcoming('2000-01-01', '00:00')).toBe(false);
    });
});

// ── isPast ──
describe('isPast', () => {
    test('returns true for past date', () => {
        expect(isPast('2000-01-01', '00:00')).toBe(true);
    });

    test('returns false for future date', () => {
        expect(isPast('2099-12-31', '23:59')).toBe(false);
    });
});

// ── getRelativeTime ──
describe('getRelativeTime', () => {
    test('returns "Past" for past date', () => {
        expect(getRelativeTime('2000-01-01', '00:00')).toBe('Past');
    });

    test('returns formatted date for dates more than 7 days away', () => {
        expect(getRelativeTime('2099-12-31', '23:59')).toBe('Dec 31, 2099');
    });
});