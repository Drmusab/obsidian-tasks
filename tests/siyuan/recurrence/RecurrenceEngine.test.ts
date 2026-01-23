/**
 * @jest-environment jsdom
 */

import { RecurrenceEngine } from '../../../src/siyuan/recurrence/RecurrenceEngine';

describe('RecurrenceEngine', () => {
    describe('parseNaturalLanguage', () => {
        it('should parse "every day"', () => {
            const rule = RecurrenceEngine.parseNaturalLanguage('every day');
            expect(rule).not.toBeNull();
            expect(rule).toContain('FREQ=DAILY');
        });

        it('should parse "every week"', () => {
            const rule = RecurrenceEngine.parseNaturalLanguage('every week');
            expect(rule).not.toBeNull();
            expect(rule).toContain('FREQ=WEEKLY');
        });

        it('should parse "every month"', () => {
            const rule = RecurrenceEngine.parseNaturalLanguage('every month');
            expect(rule).not.toBeNull();
            expect(rule).toContain('FREQ=MONTHLY');
        });

        it('should parse "every 3 days"', () => {
            const rule = RecurrenceEngine.parseNaturalLanguage('every 3 days');
            expect(rule).not.toBeNull();
            expect(rule).toContain('FREQ=DAILY');
            expect(rule).toContain('INTERVAL=3');
        });

        it('should parse "every 2 weeks"', () => {
            const rule = RecurrenceEngine.parseNaturalLanguage('every 2 weeks');
            expect(rule).not.toBeNull();
            expect(rule).toContain('FREQ=WEEKLY');
            expect(rule).toContain('INTERVAL=2');
        });

        it('should parse "every Monday"', () => {
            const rule = RecurrenceEngine.parseNaturalLanguage('every monday');
            expect(rule).not.toBeNull();
            expect(rule).toContain('FREQ=WEEKLY');
            expect(rule).toContain('BYDAY=MO');
        });

        it('should parse "every weekday"', () => {
            const rule = RecurrenceEngine.parseNaturalLanguage('every weekday');
            expect(rule).not.toBeNull();
            expect(rule).toContain('FREQ=WEEKLY');
            expect(rule).toContain('BYDAY=');
        });

        it('should parse "when done" recurrence', () => {
            const rule = RecurrenceEngine.parseNaturalLanguage('every 3 days when done');
            expect(rule).not.toBeNull();
            expect(rule).toBe('WHEN_DONE:3:DAY');
        });

        it('should return null for invalid input', () => {
            const rule = RecurrenceEngine.parseNaturalLanguage('invalid recurrence');
            expect(rule).toBeNull();
        });
    });

    describe('validateRule', () => {
        it('should validate a valid RRULE', () => {
            const rule = 'FREQ=DAILY;INTERVAL=1';
            expect(RecurrenceEngine.validateRule(rule)).toBe(true);
        });

        it('should validate a valid WHEN_DONE rule', () => {
            const rule = 'WHEN_DONE:3:DAY';
            expect(RecurrenceEngine.validateRule(rule)).toBe(true);
        });

        it('should reject an invalid WHEN_DONE rule', () => {
            const rule = 'WHEN_DONE:invalid';
            expect(RecurrenceEngine.validateRule(rule)).toBe(false);
        });

        it('should reject an invalid interval', () => {
            const rule = 'WHEN_DONE:-1:DAY';
            expect(RecurrenceEngine.validateRule(rule)).toBe(false);
        });

        it('should reject an invalid unit', () => {
            const rule = 'WHEN_DONE:1:INVALID';
            expect(RecurrenceEngine.validateRule(rule)).toBe(false);
        });
    });

    describe('isWhenDone', () => {
        it('should identify WHEN_DONE rules', () => {
            const rule = 'WHEN_DONE:3:DAY';
            expect(RecurrenceEngine.isWhenDone(rule)).toBe(true);
        });

        it('should not identify RRULE as WHEN_DONE', () => {
            const rule = 'FREQ=DAILY;INTERVAL=1';
            expect(RecurrenceEngine.isWhenDone(rule)).toBe(false);
        });
    });

    describe('getNextOccurrence', () => {
        it('should calculate next occurrence for daily recurrence', () => {
            const rule = RecurrenceEngine.parseNaturalLanguage('every day');
            expect(rule).not.toBeNull();
            
            const next = RecurrenceEngine.getNextOccurrence(rule!, '2026-01-25', false);
            expect(next).toBe('2026-01-26');
        });

        it('should calculate next occurrence for WHEN_DONE', () => {
            const rule = 'WHEN_DONE:3:DAY';
            const next = RecurrenceEngine.getNextOccurrence(rule, '2026-01-25', true);
            expect(next).toBe('2026-01-28');
        });

        it('should calculate next occurrence for weekly WHEN_DONE', () => {
            const rule = 'WHEN_DONE:1:WEEK';
            const next = RecurrenceEngine.getNextOccurrence(rule, '2026-01-25', true);
            expect(next).toBe('2026-02-01');
        });

        it('should calculate next occurrence for monthly WHEN_DONE', () => {
            const rule = 'WHEN_DONE:1:MONTH';
            const next = RecurrenceEngine.getNextOccurrence(rule, '2026-01-25', true);
            expect(next).toBe('2026-02-25');
        });
    });

    describe('getDescription', () => {
        it('should describe WHEN_DONE rules', () => {
            const rule = 'WHEN_DONE:3:DAY';
            const desc = RecurrenceEngine.getDescription(rule);
            expect(desc).toContain('3');
            expect(desc).toContain('day');
            expect(desc).toContain('completion');
        });

        it('should describe standard RRULE', () => {
            const rule = 'FREQ=DAILY;INTERVAL=1';
            const desc = RecurrenceEngine.getDescription(rule);
            expect(desc).toBeTruthy();
        });
    });
});
