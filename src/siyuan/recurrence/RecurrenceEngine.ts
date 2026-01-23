/**
 * Recurrence engine using rrule library
 */

import { RRule, RRuleSet, rrulestr } from 'rrule';
import { TaskData } from '../types/TaskData';
import { parseDate, formatDate, addDays, addWeeks, addMonths, addYears } from './TimezoneHandler';

/**
 * Parse natural language recurrence to RRULE
 */
export class RecurrenceEngine {
    /**
     * Parse natural language recurrence rule to RRULE string
     */
    static parseNaturalLanguage(text: string): string | null {
        const lower = text.toLowerCase().trim();

        // Daily patterns
        if (lower === 'every day' || lower === 'daily') {
            return new RRule({ freq: RRule.DAILY }).toString();
        }

        if (lower.match(/^every (\d+) days?$/)) {
            const match = lower.match(/^every (\d+) days?$/);
            const interval = parseInt(match![1], 10);
            return new RRule({ freq: RRule.DAILY, interval }).toString();
        }

        // Weekly patterns
        if (lower === 'every week' || lower === 'weekly') {
            return new RRule({ freq: RRule.WEEKLY }).toString();
        }

        if (lower.match(/^every (\d+) weeks?$/)) {
            const match = lower.match(/^every (\d+) weeks?$/);
            const interval = parseInt(match![1], 10);
            return new RRule({ freq: RRule.WEEKLY, interval }).toString();
        }

        // Weekday patterns
        if (lower === 'every weekday') {
            return new RRule({
                freq: RRule.WEEKLY,
                byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR],
            }).toString();
        }

        // Specific day of week
        const dayMatch = lower.match(/^every (monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
        if (dayMatch) {
            const dayMap: Record<string, any> = {
                monday: RRule.MO,
                tuesday: RRule.TU,
                wednesday: RRule.WE,
                thursday: RRule.TH,
                friday: RRule.FR,
                saturday: RRule.SA,
                sunday: RRule.SU,
            };
            return new RRule({ freq: RRule.WEEKLY, byweekday: [dayMap[dayMatch[1]]] }).toString();
        }

        // Monthly patterns
        if (lower === 'every month' || lower === 'monthly') {
            return new RRule({ freq: RRule.MONTHLY }).toString();
        }

        if (lower.match(/^every (\d+) months?$/)) {
            const match = lower.match(/^every (\d+) months?$/);
            const interval = parseInt(match![1], 10);
            return new RRule({ freq: RRule.MONTHLY, interval }).toString();
        }

        // Monthly on specific day
        if (lower.match(/^every month on the (\d+)(st|nd|rd|th)?$/)) {
            const match = lower.match(/^every month on the (\d+)/);
            const day = parseInt(match![1], 10);
            return new RRule({ freq: RRule.MONTHLY, bymonthday: [day] }).toString();
        }

        // Last day of month
        if (lower === 'every month on the last' || lower === 'every month on the last day') {
            return new RRule({ freq: RRule.MONTHLY, bymonthday: [-1] }).toString();
        }

        // Yearly patterns
        if (lower === 'every year' || lower === 'yearly' || lower === 'annually') {
            return new RRule({ freq: RRule.YEARLY }).toString();
        }

        // "When done" patterns - store as special format
        if (lower.includes('when done')) {
            // Extract the interval
            const intervalMatch = lower.match(/every (\d+) (day|week|month|year)s?\s+when done/);
            if (intervalMatch) {
                const interval = parseInt(intervalMatch[1], 10);
                const unit = intervalMatch[2];
                return `WHEN_DONE:${interval}:${unit.toUpperCase()}`;
            }

            // Default to daily when done
            return 'WHEN_DONE:1:DAY';
        }

        // If already an RRULE, return it
        if (lower.startsWith('rrule:') || lower.startsWith('dtstart')) {
            return text;
        }

        return null;
    }

    /**
     * Calculate next occurrence from a date
     */
    static getNextOccurrence(
        recurrenceRule: string,
        fromDate: string,
        baseOnCompletion: boolean = false,
    ): string | null {
        // Handle "when done" rules
        if (recurrenceRule.startsWith('WHEN_DONE:')) {
            const parts = recurrenceRule.split(':');
            const interval = parseInt(parts[1], 10);
            const unit = parts[2];

            const today = fromDate;

            switch (unit) {
                case 'DAY':
                    return addDays(today, interval);
                case 'WEEK':
                    return addWeeks(today, interval);
                case 'MONTH':
                    return addMonths(today, interval);
                case 'YEAR':
                    return addYears(today, interval);
                default:
                    return null;
            }
        }

        try {
            // Parse RRULE
            const rule = rrulestr(recurrenceRule);

            // Get the base date
            const baseDate = parseDate(fromDate);
            if (!baseDate) {
                return null;
            }

            // Get next occurrence after the base date
            const nextDate = rule.after(baseDate, true);

            if (nextDate) {
                return formatDate(nextDate);
            }

            return null;
        } catch (error) {
            console.error('Failed to parse recurrence rule:', error);
            return null;
        }
    }

    /**
     * Calculate all occurrences between two dates
     */
    static getOccurrencesBetween(
        recurrenceRule: string,
        startDate: string,
        endDate: string,
        maxCount: number = 100,
    ): string[] {
        // Handle "when done" rules - only one occurrence
        if (recurrenceRule.startsWith('WHEN_DONE:')) {
            const next = this.getNextOccurrence(recurrenceRule, startDate, true);
            return next ? [next] : [];
        }

        try {
            const rule = rrulestr(recurrenceRule);

            const start = parseDate(startDate);
            const end = parseDate(endDate);

            if (!start || !end) {
                return [];
            }

            const occurrences = rule.between(start, end, true);

            return occurrences.slice(0, maxCount).map((date) => formatDate(date));
        } catch (error) {
            console.error('Failed to get occurrences:', error);
            return [];
        }
    }

    /**
     * Validate a recurrence rule
     */
    static validateRule(recurrenceRule: string): boolean {
        if (recurrenceRule.startsWith('WHEN_DONE:')) {
            const parts = recurrenceRule.split(':');
            if (parts.length !== 3) {
                return false;
            }

            const interval = parseInt(parts[1], 10);
            if (isNaN(interval) || interval <= 0) {
                return false;
            }

            const validUnits = ['DAY', 'WEEK', 'MONTH', 'YEAR'];
            if (!validUnits.includes(parts[2])) {
                return false;
            }

            return true;
        }

        try {
            rrulestr(recurrenceRule);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get human-readable description of recurrence rule
     */
    static getDescription(recurrenceRule: string): string {
        if (recurrenceRule.startsWith('WHEN_DONE:')) {
            const parts = recurrenceRule.split(':');
            const interval = parts[1];
            const unit = parts[2].toLowerCase();
            const unitLabel = interval === '1' ? unit.slice(0, -1) : unit;
            return `Every ${interval} ${unitLabel} after completion`;
        }

        try {
            const rule = rrulestr(recurrenceRule);
            return rule.toText();
        } catch (error) {
            return 'Invalid recurrence rule';
        }
    }

    /**
     * Check if a recurrence rule is "when done" style
     */
    static isWhenDone(recurrenceRule: string): boolean {
        return recurrenceRule.startsWith('WHEN_DONE:');
    }
}
