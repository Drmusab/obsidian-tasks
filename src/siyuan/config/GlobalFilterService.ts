/**
 * Global filter service for applying filters to task queries
 */

import { GlobalFilterSettings } from './PluginSettings';
import { TaskData } from '../types/TaskData';

/**
 * Service for applying global filters
 */
export class GlobalFilterService {
    private settings: GlobalFilterSettings;

    constructor(settings: GlobalFilterSettings) {
        this.settings = settings;
    }

    /**
     * Update filter settings
     */
    updateSettings(settings: GlobalFilterSettings): void {
        this.settings = settings;
    }

    /**
     * Check if a task passes global filters
     */
    passesFilters(task: TaskData): boolean {
        // Check excluded tags
        if (this.settings.excludedTags.length > 0) {
            const hasExcludedTag = task.tags.some((tag) =>
                this.settings.excludedTags.some((excluded) => this.matchesTag(tag, excluded)),
            );

            if (hasExcludedTag) {
                return false;
            }
        }

        // Check included tags (if set)
        if (this.settings.includedTags.length > 0) {
            const hasIncludedTag = task.tags.some((tag) =>
                this.settings.includedTags.some((included) => this.matchesTag(tag, included)),
            );

            if (!hasIncludedTag) {
                return false;
            }
        }

        return true;
    }

    /**
     * Filter an array of tasks
     */
    filterTasks(tasks: TaskData[]): TaskData[] {
        return tasks.filter((task) => this.passesFilters(task));
    }

    /**
     * Check if a notebook should be excluded
     */
    isNotebookExcluded(notebookId: string): boolean {
        return this.settings.excludedNotebooks.includes(notebookId);
    }

    /**
     * Check if a path should be excluded
     */
    isPathExcluded(path: string): boolean {
        for (const pattern of this.settings.excludedPaths) {
            if (this.matchesGlobPattern(path, pattern)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get SQL conditions for global filters
     */
    getSQLConditions(): string[] {
        const conditions: string[] = [];

        // Exclude notebooks
        if (this.settings.excludedNotebooks.length > 0) {
            const notebookConditions = this.settings.excludedNotebooks
                .map((id) => `box != '${this.escapeSQL(id)}'`)
                .join(' AND ');
            conditions.push(`(${notebookConditions})`);
        }

        // Exclude paths
        if (this.settings.excludedPaths.length > 0) {
            const pathConditions = this.settings.excludedPaths
                .map((pattern) => `path NOT LIKE '%${this.escapeSQL(this.globToLike(pattern))}%'`)
                .join(' AND ');
            conditions.push(`(${pathConditions})`);
        }

        // Add default conditions if set
        if (this.settings.defaultConditions) {
            conditions.push(`(${this.settings.defaultConditions})`);
        }

        return conditions;
    }

    /**
     * Append global filter conditions to a query string
     */
    appendToQuery(queryString: string): string {
        const defaultConditions = this.settings.defaultConditions.trim();

        if (!defaultConditions) {
            return queryString;
        }

        // Check if query already has where clause
        const hasWhere = queryString.toLowerCase().includes('where');

        if (hasWhere) {
            // Append with AND
            return `${queryString}\nand ${defaultConditions}`;
        } else {
            // Add new where clause
            return `${queryString}\nwhere ${defaultConditions}`;
        }
    }

    /**
     * Match tag with pattern (supports wildcards)
     */
    private matchesTag(tag: string, pattern: string): boolean {
        // Remove # prefix if present
        const cleanTag = tag.replace(/^#/, '');
        const cleanPattern = pattern.replace(/^#/, '');

        // Convert glob pattern to regex
        const regexPattern = cleanPattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special chars
            .replace(/\*/g, '.*') // * -> .*
            .replace(/\?/g, '.'); // ? -> .

        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(cleanTag);
    }

    /**
     * Match path with glob pattern
     */
    private matchesGlobPattern(path: string, pattern: string): boolean {
        // Simple glob matching
        const regexPattern = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*\*/g, '___DOUBLESTAR___')
            .replace(/\*/g, '[^/]*')
            .replace(/___DOUBLESTAR___/g, '.*')
            .replace(/\?/g, '.');

        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(path);
    }

    /**
     * Convert glob pattern to SQL LIKE pattern
     */
    private globToLike(pattern: string): string {
        return pattern.replace(/\*/g, '%').replace(/\?/g, '_');
    }

    /**
     * Escape SQL special characters
     */
    private escapeSQL(value: string): string {
        return value.replace(/'/g, "''");
    }

    /**
     * Get excluded notebooks
     */
    getExcludedNotebooks(): string[] {
        return [...this.settings.excludedNotebooks];
    }

    /**
     * Add excluded notebook
     */
    addExcludedNotebook(notebookId: string): void {
        if (!this.settings.excludedNotebooks.includes(notebookId)) {
            this.settings.excludedNotebooks.push(notebookId);
        }
    }

    /**
     * Remove excluded notebook
     */
    removeExcludedNotebook(notebookId: string): void {
        const index = this.settings.excludedNotebooks.indexOf(notebookId);
        if (index > -1) {
            this.settings.excludedNotebooks.splice(index, 1);
        }
    }

    /**
     * Get excluded paths
     */
    getExcludedPaths(): string[] {
        return [...this.settings.excludedPaths];
    }

    /**
     * Add excluded path
     */
    addExcludedPath(path: string): void {
        if (!this.settings.excludedPaths.includes(path)) {
            this.settings.excludedPaths.push(path);
        }
    }

    /**
     * Remove excluded path
     */
    removeExcludedPath(path: string): void {
        const index = this.settings.excludedPaths.indexOf(path);
        if (index > -1) {
            this.settings.excludedPaths.splice(index, 1);
        }
    }

    /**
     * Get excluded tags
     */
    getExcludedTags(): string[] {
        return [...this.settings.excludedTags];
    }

    /**
     * Add excluded tag
     */
    addExcludedTag(tag: string): void {
        const cleanTag = tag.replace(/^#/, '');
        if (!this.settings.excludedTags.includes(cleanTag)) {
            this.settings.excludedTags.push(cleanTag);
        }
    }

    /**
     * Remove excluded tag
     */
    removeExcludedTag(tag: string): void {
        const cleanTag = tag.replace(/^#/, '');
        const index = this.settings.excludedTags.indexOf(cleanTag);
        if (index > -1) {
            this.settings.excludedTags.splice(index, 1);
        }
    }

    /**
     * Get included tags
     */
    getIncludedTags(): string[] {
        return [...this.settings.includedTags];
    }

    /**
     * Add included tag
     */
    addIncludedTag(tag: string): void {
        const cleanTag = tag.replace(/^#/, '');
        if (!this.settings.includedTags.includes(cleanTag)) {
            this.settings.includedTags.push(cleanTag);
        }
    }

    /**
     * Remove included tag
     */
    removeIncludedTag(tag: string): void {
        const cleanTag = tag.replace(/^#/, '');
        const index = this.settings.includedTags.indexOf(cleanTag);
        if (index > -1) {
            this.settings.includedTags.splice(index, 1);
        }
    }
}
