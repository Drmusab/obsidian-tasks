/**
 * Plugin settings schema and management
 */

/**
 * Date format options
 */
export enum DateFormat {
    YYYY_MM_DD = 'YYYY-MM-DD',
    MM_DD_YYYY = 'MM/DD/YYYY',
    DD_MM_YYYY = 'DD/MM/YYYY',
}

/**
 * Performance settings
 */
export interface PerformanceSettings {
    /** Query execution timeout in milliseconds */
    queryTimeout: number;

    /** Maximum number of results per query */
    maxResults: number;

    /** Query cache timeout in milliseconds */
    cacheTimeout: number;

    /** Enable query caching */
    enableCache: boolean;
}

/**
 * UI preferences
 */
export interface UIPreferences {
    /** Date format for display */
    dateFormat: DateFormat;

    /** Show task count in dashboard */
    showTaskCount: boolean;

    /** Default tab to open in dashboard */
    defaultTab: 'today' | 'upcoming' | 'overdue' | 'all' | 'custom';

    /** Task status colors */
    statusColors: {
        todo: string;
        doing: string;
        done: string;
        cancelled: string;
        onHold: string;
    };

    /** Priority colors */
    priorityColors: {
        highest: string;
        high: string;
        medium: string;
        low: string;
        lowest: string;
    };

    /** Show task icons */
    showIcons: boolean;

    /** Compact mode */
    compactMode: boolean;
}

/**
 * Global filter settings
 */
export interface GlobalFilterSettings {
    /** Notebook IDs to exclude */
    excludedNotebooks: string[];

    /** Path patterns to exclude (glob patterns) */
    excludedPaths: string[];

    /** Tags to exclude */
    excludedTags: string[];

    /** Tags to include (if set, only these tags are shown) */
    includedTags: string[];

    /** Default query conditions applied to all queries */
    defaultConditions: string;
}

/**
 * Recurrence settings
 */
export interface RecurrenceSettings {
    /** Default recurrence mode for new tasks */
    defaultMode: 'fixed' | 'when-done';

    /** Handle overdue recurring tasks */
    overdueHandling: 'skip' | 'catch-up' | 'ask';

    /** Auto-advance overdue recurring tasks */
    autoAdvanceOverdue: boolean;

    /** Days before due date to show recurring tasks */
    showRecurringDaysBefore: number;
}

/**
 * Complete plugin settings
 */
export interface PluginSettings {
    /** Performance settings */
    performance: PerformanceSettings;

    /** UI preferences */
    ui: UIPreferences;

    /** Global filter settings */
    globalFilter: GlobalFilterSettings;

    /** Recurrence settings */
    recurrence: RecurrenceSettings;

    /** SiYuan API base URL */
    apiBaseUrl: string;

    /** Enable debug logging */
    debugMode: boolean;
}

/**
 * Default plugin settings
 */
export const DEFAULT_SETTINGS: PluginSettings = {
    performance: {
        queryTimeout: 5000,
        maxResults: 1000,
        cacheTimeout: 60000,
        enableCache: true,
    },
    ui: {
        dateFormat: DateFormat.YYYY_MM_DD,
        showTaskCount: true,
        defaultTab: 'today',
        statusColors: {
            todo: '#6c757d',
            doing: '#007bff',
            done: '#28a745',
            cancelled: '#dc3545',
            onHold: '#ffc107',
        },
        priorityColors: {
            highest: '#dc3545',
            high: '#fd7e14',
            medium: '#ffc107',
            low: '#20c997',
            lowest: '#6c757d',
        },
        showIcons: true,
        compactMode: false,
    },
    globalFilter: {
        excludedNotebooks: [],
        excludedPaths: [],
        excludedTags: [],
        includedTags: [],
        defaultConditions: '',
    },
    recurrence: {
        defaultMode: 'fixed',
        overdueHandling: 'ask',
        autoAdvanceOverdue: false,
        showRecurringDaysBefore: 7,
    },
    apiBaseUrl: 'http://127.0.0.1:6806',
    debugMode: false,
};

/**
 * Settings manager
 */
export class SettingsManager {
    private settings: PluginSettings;
    private storageKey: string = 'siyuan-tasks-settings';

    constructor(initialSettings?: Partial<PluginSettings>) {
        this.settings = { ...DEFAULT_SETTINGS, ...initialSettings };
        this.load();
    }

    /**
     * Load settings from storage
     */
    load(): void {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.settings = this.mergeSettings(DEFAULT_SETTINGS, parsed);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    /**
     * Save settings to storage
     */
    save(): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    /**
     * Get all settings
     */
    getSettings(): PluginSettings {
        return { ...this.settings };
    }

    /**
     * Update settings
     */
    updateSettings(updates: Partial<PluginSettings>): void {
        this.settings = this.mergeSettings(this.settings, updates);
        this.save();
    }

    /**
     * Get performance settings
     */
    getPerformanceSettings(): PerformanceSettings {
        return { ...this.settings.performance };
    }

    /**
     * Update performance settings
     */
    updatePerformanceSettings(updates: Partial<PerformanceSettings>): void {
        this.settings.performance = { ...this.settings.performance, ...updates };
        this.save();
    }

    /**
     * Get UI preferences
     */
    getUIPreferences(): UIPreferences {
        return { ...this.settings.ui };
    }

    /**
     * Update UI preferences
     */
    updateUIPreferences(updates: Partial<UIPreferences>): void {
        this.settings.ui = { ...this.settings.ui, ...updates };
        this.save();
    }

    /**
     * Get global filter settings
     */
    getGlobalFilterSettings(): GlobalFilterSettings {
        return { ...this.settings.globalFilter };
    }

    /**
     * Update global filter settings
     */
    updateGlobalFilterSettings(updates: Partial<GlobalFilterSettings>): void {
        this.settings.globalFilter = { ...this.settings.globalFilter, ...updates };
        this.save();
    }

    /**
     * Get recurrence settings
     */
    getRecurrenceSettings(): RecurrenceSettings {
        return { ...this.settings.recurrence };
    }

    /**
     * Update recurrence settings
     */
    updateRecurrenceSettings(updates: Partial<RecurrenceSettings>): void {
        this.settings.recurrence = { ...this.settings.recurrence, ...updates };
        this.save();
    }

    /**
     * Reset settings to defaults
     */
    reset(): void {
        this.settings = { ...DEFAULT_SETTINGS };
        this.save();
    }

    /**
     * Export settings as JSON
     */
    export(): string {
        return JSON.stringify(this.settings, null, 2);
    }

    /**
     * Import settings from JSON
     */
    import(json: string): boolean {
        try {
            const imported = JSON.parse(json);
            this.settings = this.mergeSettings(DEFAULT_SETTINGS, imported);
            this.save();
            return true;
        } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
        }
    }

    /**
     * Deep merge settings objects
     */
    private mergeSettings(base: any, updates: any): any {
        const result = { ...base };

        for (const key in updates) {
            if (updates.hasOwnProperty(key)) {
                if (typeof updates[key] === 'object' && !Array.isArray(updates[key]) && updates[key] !== null) {
                    result[key] = this.mergeSettings(base[key] || {}, updates[key]);
                } else {
                    result[key] = updates[key];
                }
            }
        }

        return result;
    }
}
