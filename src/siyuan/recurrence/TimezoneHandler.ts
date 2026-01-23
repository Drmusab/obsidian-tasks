/**
 * Timezone handler for date operations
 */

/**
 * Parse a date string to Date object
 */
export function parseDate(dateStr: string): Date | null {
    if (!dateStr) {
        return null;
    }

    // Handle YYYY-MM-DD format
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return null;
    }

    const [, year, month, day] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    // Validate the date
    if (isNaN(date.getTime())) {
        return null;
    }

    return date;
}

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getToday(): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return formatDate(today);
}

/**
 * Add days to a date
 */
export function addDays(dateStr: string, days: number): string | null {
    const date = parseDate(dateStr);
    if (!date) {
        return null;
    }

    date.setDate(date.getDate() + days);
    return formatDate(date);
}

/**
 * Add weeks to a date
 */
export function addWeeks(dateStr: string, weeks: number): string | null {
    return addDays(dateStr, weeks * 7);
}

/**
 * Add months to a date
 */
export function addMonths(dateStr: string, months: number): string | null {
    const date = parseDate(dateStr);
    if (!date) {
        return null;
    }

    const targetMonth = date.getMonth() + months;
    const targetYear = date.getFullYear() + Math.floor(targetMonth / 12);
    const normalizedMonth = ((targetMonth % 12) + 12) % 12;

    // Handle day overflow (e.g., Jan 31 + 1 month = Feb 28/29)
    const day = date.getDate();
    const lastDayOfTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();
    const normalizedDay = Math.min(day, lastDayOfTargetMonth);

    return formatDate(new Date(targetYear, normalizedMonth, normalizedDay));
}

/**
 * Add years to a date
 */
export function addYears(dateStr: string, years: number): string | null {
    const date = parseDate(dateStr);
    if (!date) {
        return null;
    }

    date.setFullYear(date.getFullYear() + years);

    // Handle Feb 29 in non-leap years
    if (date.getMonth() !== parseDate(dateStr)!.getMonth()) {
        date.setDate(0); // Go to last day of previous month
    }

    return formatDate(date);
}

/**
 * Compare two dates
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDates(date1Str: string, date2Str: string): number {
    const date1 = parseDate(date1Str);
    const date2 = parseDate(date2Str);

    if (!date1 || !date2) {
        return 0;
    }

    if (date1 < date2) return -1;
    if (date1 > date2) return 1;
    return 0;
}

/**
 * Check if a date is in the past
 */
export function isPast(dateStr: string): boolean {
    return compareDates(dateStr, getToday()) < 0;
}

/**
 * Check if a date is in the future
 */
export function isFuture(dateStr: string): boolean {
    return compareDates(dateStr, getToday()) > 0;
}

/**
 * Check if a date is today
 */
export function isToday(dateStr: string): boolean {
    return compareDates(dateStr, getToday()) === 0;
}

/**
 * Get the day of week (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(dateStr: string): number {
    const date = parseDate(dateStr);
    return date ? date.getDay() : -1;
}

/**
 * Get the next occurrence of a specific day of week
 */
export function getNextDayOfWeek(fromDateStr: string, targetDay: number): string | null {
    const date = parseDate(fromDateStr);
    if (!date) {
        return null;
    }

    const currentDay = date.getDay();
    let daysToAdd = targetDay - currentDay;

    if (daysToAdd <= 0) {
        daysToAdd += 7;
    }

    date.setDate(date.getDate() + daysToAdd);
    return formatDate(date);
}

/**
 * Get the last day of a month
 */
export function getLastDayOfMonth(dateStr: string): string | null {
    const date = parseDate(dateStr);
    if (!date) {
        return null;
    }

    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    return formatDate(new Date(year, month, lastDay));
}
