/**
 * Query optimizer for performance safeguards
 */

import { ParsedQuery } from './QueryParser';

/**
 * Query optimization settings
 */
export interface QueryOptimizationSettings {
    /** Maximum execution time in milliseconds */
    maxExecutionTime: number;

    /** Maximum number of results */
    maxResults: number;

    /** Whether to enable query caching */
    enableCache: boolean;

    /** Cache timeout in milliseconds */
    cacheTimeout: number;
}

/**
 * Default optimization settings
 */
export const DEFAULT_OPTIMIZATION_SETTINGS: QueryOptimizationSettings = {
    maxExecutionTime: 5000, // 5 seconds
    maxResults: 1000,
    enableCache: true,
    cacheTimeout: 60000, // 1 minute
};

/**
 * Query optimizer
 */
export class QueryOptimizer {
    private settings: QueryOptimizationSettings;

    constructor(settings: Partial<QueryOptimizationSettings> = {}) {
        this.settings = { ...DEFAULT_OPTIMIZATION_SETTINGS, ...settings };
    }

    /**
     * Optimize a parsed query
     */
    optimize(query: ParsedQuery): ParsedQuery {
        const optimized = { ...query };

        // Apply maximum results limit
        if (!optimized.limit || optimized.limit > this.settings.maxResults) {
            optimized.limit = this.settings.maxResults;
        }

        return optimized;
    }

    /**
     * Validate query before execution
     */
    validateQuery(query: ParsedQuery): { valid: boolean; error?: string } {
        // Check for potential performance issues
        if (query.filters.length === 0 && !query.limit) {
            return {
                valid: false,
                error: 'Query without filters must have a limit to prevent performance issues',
            };
        }

        // Validate filter values
        for (const filter of query.filters) {
            if (Array.isArray(filter.value) && filter.value.length > 100) {
                return {
                    valid: false,
                    error: 'Filter with more than 100 values may cause performance issues',
                };
            }
        }

        return { valid: true };
    }

    /**
     * Execute query with timeout protection
     */
    async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
        return Promise.race([
            fn(),
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error('Query execution timeout')), this.settings.maxExecutionTime),
            ),
        ]);
    }

    /**
     * Update optimization settings
     */
    updateSettings(settings: Partial<QueryOptimizationSettings>): void {
        this.settings = { ...this.settings, ...settings };
    }

    /**
     * Get current settings
     */
    getSettings(): QueryOptimizationSettings {
        return { ...this.settings };
    }
}
