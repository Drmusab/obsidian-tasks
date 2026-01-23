/**
 * Saved queries management
 */

/**
 * Saved query structure
 */
export interface SavedQuery {
    /** Unique ID */
    id: string;

    /** Query name */
    name: string;

    /** Query string */
    query: string;

    /** Description */
    description?: string;

    /** Creation timestamp */
    createdAt: string;

    /** Last modified timestamp */
    updatedAt: string;

    /** Tags for organization */
    tags: string[];

    /** Whether this is a favorite */
    favorite: boolean;
}

/**
 * Storage key for saved queries
 */
const STORAGE_KEY = 'siyuan-tasks-saved-queries';

/**
 * Saved queries service
 */
export class SavedQueries {
    private queries: Map<string, SavedQuery>;

    constructor() {
        this.queries = new Map();
        this.load();
    }

    /**
     * Load saved queries from storage
     */
    private load(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const queries = JSON.parse(stored) as SavedQuery[];
                for (const query of queries) {
                    this.queries.set(query.id, query);
                }
            }
        } catch (error) {
            console.error('Failed to load saved queries:', error);
        }
    }

    /**
     * Save queries to storage
     */
    private save(): void {
        try {
            const queries = Array.from(this.queries.values());
            localStorage.setItem(STORAGE_KEY, JSON.stringify(queries));
        } catch (error) {
            console.error('Failed to save queries:', error);
        }
    }

    /**
     * Create a new saved query
     */
    createQuery(
        name: string,
        query: string,
        description?: string,
        tags: string[] = [],
    ): SavedQuery {
        const savedQuery: SavedQuery = {
            id: this.generateId(),
            name,
            query,
            description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags,
            favorite: false,
        };

        this.queries.set(savedQuery.id, savedQuery);
        this.save();

        return savedQuery;
    }

    /**
     * Update a saved query
     */
    updateQuery(id: string, updates: Partial<Omit<SavedQuery, 'id' | 'createdAt'>>): SavedQuery | null {
        const query = this.queries.get(id);
        if (!query) {
            return null;
        }

        const updated = {
            ...query,
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        this.queries.set(id, updated);
        this.save();

        return updated;
    }

    /**
     * Delete a saved query
     */
    deleteQuery(id: string): boolean {
        const deleted = this.queries.delete(id);
        if (deleted) {
            this.save();
        }
        return deleted;
    }

    /**
     * Get a saved query by ID
     */
    getQuery(id: string): SavedQuery | null {
        return this.queries.get(id) || null;
    }

    /**
     * Get all saved queries
     */
    getAllQueries(): SavedQuery[] {
        return Array.from(this.queries.values());
    }

    /**
     * Get favorite queries
     */
    getFavoriteQueries(): SavedQuery[] {
        return this.getAllQueries().filter((q) => q.favorite);
    }

    /**
     * Get queries by tag
     */
    getQueriesByTag(tag: string): SavedQuery[] {
        return this.getAllQueries().filter((q) => q.tags.includes(tag));
    }

    /**
     * Toggle favorite status
     */
    toggleFavorite(id: string): SavedQuery | null {
        const query = this.queries.get(id);
        if (!query) {
            return null;
        }

        query.favorite = !query.favorite;
        query.updatedAt = new Date().toISOString();

        this.queries.set(id, query);
        this.save();

        return query;
    }

    /**
     * Search queries by name or description
     */
    searchQueries(searchTerm: string): SavedQuery[] {
        const lower = searchTerm.toLowerCase();
        return this.getAllQueries().filter(
            (q) =>
                q.name.toLowerCase().includes(lower) ||
                (q.description && q.description.toLowerCase().includes(lower)),
        );
    }

    /**
     * Generate a unique ID
     */
    private generateId(): string {
        return `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Export queries as JSON
     */
    exportQueries(): string {
        return JSON.stringify(this.getAllQueries(), null, 2);
    }

    /**
     * Import queries from JSON
     */
    importQueries(json: string): { success: number; failed: number } {
        let success = 0;
        let failed = 0;

        try {
            const queries = JSON.parse(json) as SavedQuery[];

            for (const query of queries) {
                try {
                    // Validate required fields
                    if (!query.name || !query.query) {
                        failed++;
                        continue;
                    }

                    // Generate new ID to avoid conflicts
                    const newQuery = {
                        ...query,
                        id: this.generateId(),
                    };

                    this.queries.set(newQuery.id, newQuery);
                    success++;
                } catch (error) {
                    failed++;
                }
            }

            if (success > 0) {
                this.save();
            }
        } catch (error) {
            console.error('Failed to import queries:', error);
        }

        return { success, failed };
    }
}
