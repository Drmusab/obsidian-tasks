/**
 * Query engine that compiles task queries to SiYuan SQL
 */

import { SiYuanAPI } from '../api/SiYuanAPI';
import {
    QueryParser,
    ParsedQuery,
    FilterCondition,
    SortCondition,
    QueryOperator,
    BooleanLogic,
    SortDirection,
} from './QueryParser';
import { TaskData, blockAttributesToTaskData } from '../types/TaskData';

/**
 * Query engine for task queries
 */
export class QueryEngine {
    private api: SiYuanAPI;
    private queryCache: Map<string, { result: TaskData[]; timestamp: number }>;
    private cacheTimeout: number = 60000; // 1 minute cache

    constructor(api: SiYuanAPI) {
        this.api = api;
        this.queryCache = new Map();
    }

    /**
     * Execute a task query
     */
    async executeQuery(queryString: string, useCache: boolean = true): Promise<TaskData[]> {
        // Check cache
        if (useCache) {
            const cached = this.queryCache.get(queryString);
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.result;
            }
        }

        // Parse query
        const query = QueryParser.parse(queryString);

        // Compile to SQL
        const sql = this.compileToSQL(query);

        // Execute SQL
        const results = await this.api.querySQL(sql);

        // Convert results to TaskData
        const tasks = await this.resultsToTasks(results);

        // Cache result
        this.queryCache.set(queryString, {
            result: tasks,
            timestamp: Date.now(),
        });

        return tasks;
    }

    /**
     * Compile parsed query to SiYuan SQL
     */
    private compileToSQL(query: ParsedQuery): string {
        const parts: string[] = [];

        // SELECT clause - get blocks with task attributes
        parts.push('SELECT * FROM blocks');

        // WHERE clause
        const whereClauses = this.buildWhereClauses(query.filters);
        if (whereClauses.length > 0) {
            parts.push('WHERE ' + whereClauses.join(' '));
        }

        // ORDER BY clause
        if (query.sorts.length > 0) {
            const sortClauses = query.sorts.map((sort) => this.buildSortClause(sort));
            parts.push('ORDER BY ' + sortClauses.join(', '));
        }

        // LIMIT clause
        if (query.limit) {
            parts.push(`LIMIT ${query.limit}`);
        }

        return parts.join(' ');
    }

    /**
     * Build WHERE clauses from filters
     */
    private buildWhereClauses(filters: FilterCondition[]): string[] {
        const clauses: string[] = [];

        // Always filter for blocks with task attributes
        clauses.push("(ial LIKE '%custom-task-id%')");

        for (let i = 0; i < filters.length; i++) {
            const filter = filters[i];
            const clause = this.buildFilterClause(filter);

            // Add logic operator
            if (i === 0 && !filter.logic) {
                clauses.push('AND');
            } else if (filter.logic === BooleanLogic.AND) {
                clauses.push('AND');
            } else if (filter.logic === BooleanLogic.OR) {
                clauses.push('OR');
            } else if (filter.logic === BooleanLogic.NOT) {
                clauses.push('AND NOT');
            } else if (i > 0) {
                clauses.push('AND');
            }

            clauses.push(clause);
        }

        return clauses;
    }

    /**
     * Build a single filter clause
     */
    private buildFilterClause(filter: FilterCondition): string {
        const field = QueryParser.normalizeFieldName(filter.field);
        const attrName = `custom-task-${field.replace(/_/g, '-')}`;

        // Handle special fields
        if (field === 'status') {
            return this.buildStatusFilter(filter);
        }

        if (field === 'tags') {
            return this.buildTagsFilter(filter);
        }

        if (field.endsWith('_date')) {
            return this.buildDateFilter(attrName, filter);
        }

        // Standard attribute filter
        const value = Array.isArray(filter.value) ? filter.value[0] : filter.value;

        switch (filter.operator) {
            case QueryOperator.EQUALS:
                return `(ial LIKE '%${attrName}="${this.escapeSQL(value)}"%')`;

            case QueryOperator.NOT_EQUALS:
                return `(ial NOT LIKE '%${attrName}="${this.escapeSQL(value)}"%')`;

            case QueryOperator.CONTAINS:
                return `(ial LIKE '%${attrName}="%${this.escapeSQL(value)}%"%')`;

            case QueryOperator.NOT_CONTAINS:
                return `(ial NOT LIKE '%${attrName}="%${this.escapeSQL(value)}%"%')`;

            default:
                return `(ial LIKE '%${attrName}%')`;
        }
    }

    /**
     * Build status filter
     */
    private buildStatusFilter(filter: FilterCondition): string {
        const statusValue = Array.isArray(filter.value) ? filter.value[0] : filter.value;
        const statusUpper = statusValue.toUpperCase();

        switch (filter.operator) {
            case QueryOperator.EQUALS:
                return `(ial LIKE '%custom-task-status="${statusUpper}"%')`;

            case QueryOperator.NOT_EQUALS:
                return `(ial NOT LIKE '%custom-task-status="${statusUpper}"%')`;

            default:
                return `(ial LIKE '%custom-task-status%')`;
        }
    }

    /**
     * Build tags filter
     */
    private buildTagsFilter(filter: FilterCondition): string {
        const tagValue = Array.isArray(filter.value) ? filter.value[0] : filter.value;
        const cleanTag = tagValue.replace(/^#/, '');

        switch (filter.operator) {
            case QueryOperator.CONTAINS:
            case QueryOperator.IN:
                return `(ial LIKE '%custom-task-tags="%${this.escapeSQL(cleanTag)}%"%')`;

            case QueryOperator.NOT_CONTAINS:
            case QueryOperator.NOT_IN:
                return `(ial NOT LIKE '%custom-task-tags="%${this.escapeSQL(cleanTag)}%"%')`;

            default:
                return `(ial LIKE '%custom-task-tags%')`;
        }
    }

    /**
     * Build date filter
     */
    private buildDateFilter(attrName: string, filter: FilterCondition): string {
        const dateValue = Array.isArray(filter.value) ? filter.value[0] : filter.value;
        const parsedDate = QueryParser.parseQueryDate(dateValue);

        // Note: Date comparison in SQL with attributes is limited
        // This is a simplified implementation
        switch (filter.operator) {
            case QueryOperator.EQUALS:
                return `(ial LIKE '%${attrName}="${parsedDate}"%')`;

            case QueryOperator.NOT_EQUALS:
                return `(ial NOT LIKE '%${attrName}="${parsedDate}"%')`;

            case QueryOperator.LESS_THAN:
            case QueryOperator.LESS_THAN_OR_EQUAL:
                // These require more complex parsing, simplified for now
                return `(ial LIKE '%${attrName}%')`;

            case QueryOperator.GREATER_THAN:
            case QueryOperator.GREATER_THAN_OR_EQUAL:
                return `(ial LIKE '%${attrName}%')`;

            default:
                return `(ial LIKE '%${attrName}%')`;
        }
    }

    /**
     * Build sort clause
     */
    private buildSortClause(sort: SortCondition): string {
        const field = QueryParser.normalizeFieldName(sort.field);

        // Map to SQL column if possible
        // Note: Sorting by attributes is limited in SiYuan SQL
        const direction = sort.direction === SortDirection.DESC ? 'DESC' : 'ASC';

        // Use content or created field as fallback
        if (field === 'description') {
            return `content ${direction}`;
        }

        return `created ${direction}`;
    }

    /**
     * Convert SQL results to TaskData array
     */
    private async resultsToTasks(results: any[]): Promise<TaskData[]> {
        const tasks: TaskData[] = [];

        for (const result of results) {
            try {
                // Get attributes for this block
                const attrs = await this.api.getBlockAttrs(result.id);

                // Convert to TaskData
                const task = blockAttributesToTaskData(result.id, attrs);
                if (task) {
                    tasks.push(task);
                }
            } catch (error) {
                console.error(`Failed to convert block ${result.id} to task:`, error);
            }
        }

        return tasks;
    }

    /**
     * Escape SQL special characters
     * Note: This is a basic implementation for LIKE patterns in SiYuan SQL
     * For production use, consider using parameterized queries when SiYuan supports them
     */
    private escapeSQL(value: string): string {
        // Escape single quotes for SQL strings
        // Escape backslashes and percent signs for LIKE patterns
        return value
            .replace(/\\/g, '\\\\')  // Escape backslashes first
            .replace(/'/g, "''")      // SQL standard escape for single quotes
            .replace(/%/g, '\\%')     // Escape LIKE wildcards
            .replace(/_/g, '\\_');    // Escape LIKE wildcards
    }

    /**
     * Clear query cache
     */
    clearCache(): void {
        this.queryCache.clear();
    }

    /**
     * Set cache timeout
     */
    setCacheTimeout(timeout: number): void {
        this.cacheTimeout = timeout;
    }
}
