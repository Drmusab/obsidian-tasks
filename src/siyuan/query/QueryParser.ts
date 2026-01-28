/**
 * Query syntax parser for SiYuan task queries
 * Supports: where, sort, limit, and boolean logic
 */

import { TaskStatus, TaskPriority } from '../types/TaskData';

/**
 * Query filter operator
 */
export enum QueryOperator {
    EQUALS = '=',
    NOT_EQUALS = '!=',
    GREATER_THAN = '>',
    GREATER_THAN_OR_EQUAL = '>=',
    LESS_THAN = '<',
    LESS_THAN_OR_EQUAL = '<=',
    CONTAINS = 'includes',
    NOT_CONTAINS = 'not includes',
    IN = 'in',
    NOT_IN = 'not in',
}

/**
 * Boolean logic type
 */
export enum BooleanLogic {
    AND = 'and',
    OR = 'or',
    NOT = 'not',
}

/**
 * Sort direction
 */
export enum SortDirection {
    ASC = 'asc',
    DESC = 'desc',
}

/**
 * Filter condition
 */
export interface FilterCondition {
    field: string;
    operator: QueryOperator;
    value: string | string[];
    logic?: BooleanLogic;
}

/**
 * Sort condition
 */
export interface SortCondition {
    field: string;
    direction: SortDirection;
}

/**
 * Parsed query structure
 */
export interface ParsedQuery {
    filters: FilterCondition[];
    sorts: SortCondition[];
    limit?: number;
}

/**
 * Query parser
 */
export class QueryParser {
    /**
     * Parse a query string into structured format
     */
    static parse(queryString: string): ParsedQuery {
        const lines = queryString
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith('#'));

        const query: ParsedQuery = {
            filters: [],
            sorts: [],
        };

        let currentLogic: BooleanLogic | undefined;

        for (const line of lines) {
            // Skip 'tasks' keyword
            if (line.toLowerCase() === 'tasks') {
                continue;
            }

            // Parse where clause
            if (line.toLowerCase().startsWith('where ')) {
                const filterPart = line.substring(6).trim();
                const filter = this.parseFilter(filterPart);
                if (filter) {
                    filter.logic = currentLogic;
                    query.filters.push(filter);
                    currentLogic = undefined;
                }
                continue;
            }

            // Parse and/or/not logic
            if (line.toLowerCase() === 'and') {
                currentLogic = BooleanLogic.AND;
                continue;
            }

            if (line.toLowerCase() === 'or') {
                currentLogic = BooleanLogic.OR;
                continue;
            }

            if (line.toLowerCase() === 'not') {
                currentLogic = BooleanLogic.NOT;
                continue;
            }

            // Parse combined where with and/or
            if (line.toLowerCase().includes(' and ')) {
                const parts = line.split(/\s+and\s+/i);
                for (let i = 0; i < parts.length; i++) {
                    const filterPart = parts[i].replace(/^where\s+/i, '').trim();
                    const filter = this.parseFilter(filterPart);
                    if (filter) {
                        filter.logic = i > 0 ? BooleanLogic.AND : currentLogic;
                        query.filters.push(filter);
                    }
                }
                currentLogic = undefined;
                continue;
            }

            if (line.toLowerCase().includes(' or ')) {
                const parts = line.split(/\s+or\s+/i);
                for (let i = 0; i < parts.length; i++) {
                    const filterPart = parts[i].replace(/^where\s+/i, '').trim();
                    const filter = this.parseFilter(filterPart);
                    if (filter) {
                        filter.logic = i > 0 ? BooleanLogic.OR : currentLogic;
                        query.filters.push(filter);
                    }
                }
                currentLogic = undefined;
                continue;
            }

            // Parse sort clause
            if (line.toLowerCase().startsWith('sort by ')) {
                const sortPart = line.substring(8).trim();
                const sort = this.parseSort(sortPart);
                if (sort) {
                    query.sorts.push(sort);
                }
                continue;
            }

            // Parse limit clause
            if (line.toLowerCase().startsWith('limit ')) {
                const limitPart = line.substring(6).trim();
                const limit = parseInt(limitPart, 10);
                if (!isNaN(limit)) {
                    query.limit = limit;
                }
                continue;
            }
        }

        return query;
    }

    /**
     * Parse a single filter condition
     */
    private static parseFilter(filterStr: string): FilterCondition | null {
        // Try to match operator patterns
        for (const [op, opEnum] of Object.entries(QueryOperator)) {
            const opValue = opEnum as string;

            // Handle multi-word operators
            if (opValue.includes(' ')) {
                const regex = new RegExp(`\\s+${opValue}\\s+`, 'i');
                if (regex.test(filterStr)) {
                    const parts = filterStr.split(regex);
                    if (parts.length === 2) {
                        return {
                            field: parts[0].trim(),
                            operator: opEnum,
                            value: this.parseValue(parts[1].trim()),
                        };
                    }
                }
            } else {
                // Single character operators
                const regex = new RegExp(`\\s*${opValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`);
                if (regex.test(filterStr)) {
                    const parts = filterStr.split(regex);
                    if (parts.length === 2) {
                        return {
                            field: parts[0].trim(),
                            operator: opEnum,
                            value: this.parseValue(parts[1].trim()),
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Parse a value (could be string, number, or array)
     */
    private static parseValue(valueStr: string): string | string[] {
        // Remove quotes
        valueStr = valueStr.replace(/^['"]|['"]$/g, '');

        // Check if it's an array (comma-separated)
        if (valueStr.includes(',')) {
            return valueStr.split(',').map((v) => v.trim());
        }

        return valueStr;
    }

    /**
     * Parse a sort condition
     */
    private static parseSort(sortStr: string): SortCondition | null {
        // Format: field [asc|desc]
        const parts = sortStr.split(/\s+/);
        if (parts.length === 0) {
            return null;
        }

        const field = parts[0].trim();
        const direction =
            parts.length > 1 && parts[1].toLowerCase() === 'desc' ? SortDirection.DESC : SortDirection.ASC;

        return { field, direction };
    }

    /**
     * Normalize field name (handle aliases)
     */
    static normalizeFieldName(field: string): string {
        const aliases: Record<string, string> = {
            due: 'due_date',
            scheduled: 'scheduled_date',
            start: 'start_date',
            done: 'done_date',
            cancelled: 'cancelled_date',
            tag: 'tags',
            depends: 'depends_on',
        };

        return aliases[field.toLowerCase()] || field;
    }

    /**
     * Parse relative date in query (e.g., "today", "today + 7d")
     */
    static parseQueryDate(dateStr: string): string {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Handle relative dates with offset
        const relativeMatch = dateStr.match(/^(today|tomorrow|yesterday)\s*([+\-])\s*(\d+)([dwmy])$/i);
        if (relativeMatch) {
            const [, base, operator, amount, unit] = relativeMatch;
            let baseDate = new Date(today);

            if (base.toLowerCase() === 'tomorrow') {
                baseDate.setDate(baseDate.getDate() + 1);
            } else if (base.toLowerCase() === 'yesterday') {
                baseDate.setDate(baseDate.getDate() - 1);
            }

            const offset = parseInt(amount, 10) * (operator === '-' ? -1 : 1);

            switch (unit.toLowerCase()) {
                case 'd':
                    baseDate.setDate(baseDate.getDate() + offset);
                    break;
                case 'w':
                    baseDate.setDate(baseDate.getDate() + offset * 7);
                    break;
                case 'm':
                    baseDate.setMonth(baseDate.getMonth() + offset);
                    break;
                case 'y':
                    baseDate.setFullYear(baseDate.getFullYear() + offset);
                    break;
            }

            return this.formatDate(baseDate);
        }

        // Simple relative dates
        if (dateStr.toLowerCase() === 'today') {
            return this.formatDate(today);
        }

        if (dateStr.toLowerCase() === 'tomorrow') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return this.formatDate(tomorrow);
        }

        if (dateStr.toLowerCase() === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return this.formatDate(yesterday);
        }

        // Return as-is if it's already a date
        return dateStr;
    }

    /**
     * Format date as YYYY-MM-DD
     */
    private static formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
