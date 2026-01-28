/**
 * SiYuan plugin entry point for Task Management System
 */

import { SiYuanAPI } from './api/SiYuanAPI';
import { TaskSyncService } from './sync/TaskSyncService';
import { QueryEngine } from './query/QueryEngine';
import { QueryOptimizer } from './query/QueryOptimizer';
import { SavedQueries } from './query/SavedQueries';
import { SettingsManager } from './config/PluginSettings';
import { GlobalFilterService } from './config/GlobalFilterService';
import { TaskCompletionHandler } from './recurrence/TaskCompletionHandler';
import { TaskData, TaskStatus } from './types/TaskData';
import Dashboard from './ui/Dashboard.svelte';

/**
 * Main plugin class for SiYuan Task Management
 */
export class SiYuanTasksPlugin {
    private api: SiYuanAPI;
    private syncService: TaskSyncService;
    private queryEngine: QueryEngine;
    private queryOptimizer: QueryOptimizer;
    private savedQueries: SavedQueries;
    private settingsManager: SettingsManager;
    private globalFilterService: GlobalFilterService;
    
    private dockPanel: any;
    private dashboardComponent: any;
    private eventBusSubscriptions: any[] = [];

    constructor() {
        // Initialize settings first
        this.settingsManager = new SettingsManager();
        const settings = this.settingsManager.getSettings();

        // Initialize API
        this.api = new SiYuanAPI(settings.apiBaseUrl);

        // Initialize services
        this.syncService = new TaskSyncService(this.api);
        this.queryEngine = new QueryEngine(this.api);
        this.queryOptimizer = new QueryOptimizer(settings.performance);
        this.savedQueries = new SavedQueries();
        this.globalFilterService = new GlobalFilterService(settings.globalFilter);
    }

    /**
     * Called when the plugin is loaded
     */
    async onload(): Promise<void> {
        console.log('SiYuan Tasks Plugin loading...');

        try {
            // Register dock panel
            await this.registerDockPanel();

            // Register commands
            this.registerCommands();

            // Subscribe to EventBus
            this.subscribeToEvents();

            console.log('SiYuan Tasks Plugin loaded successfully');
        } catch (error) {
            console.error('Failed to load SiYuan Tasks Plugin:', error);
        }
    }

    /**
     * Called when the plugin is unloaded
     */
    async onunload(): Promise<void> {
        console.log('SiYuan Tasks Plugin unloading...');

        // Unsubscribe from events
        this.unsubscribeFromEvents();

        // Destroy dashboard component
        if (this.dashboardComponent) {
            this.dashboardComponent.$destroy();
        }

        console.log('SiYuan Tasks Plugin unloaded');
    }

    /**
     * Called when layout is ready
     */
    async onLayoutReady(): Promise<void> {
        console.log('SiYuan Tasks Plugin layout ready');
        // Refresh dashboard with initial data
        await this.refreshDashboard();
    }

    /**
     * Register dock panel for task dashboard
     */
    private async registerDockPanel(): Promise<void> {
        // Create a container for the Svelte component
        const container = document.createElement('div');
        container.id = 'siyuan-tasks-dashboard';
        container.style.height = '100%';
        container.style.overflow = 'auto';

        // Initialize Dashboard component
        this.dashboardComponent = new Dashboard({
            target: container,
            props: {
                tasks: [],
                onTaskClick: this.handleTaskClick.bind(this),
                onTaskStatusToggle: this.handleTaskStatusToggle.bind(this),
                onQueryExecute: this.handleQueryExecute.bind(this),
            },
        });

        // Note: SiYuan's addDock API would be used here in actual implementation
        // This is a placeholder showing the structure
        this.dockPanel = {
            element: container,
            title: 'Tasks',
            icon: '✓',
        };
    }

    /**
     * Register plugin commands
     */
    private registerCommands(): void {
        // Note: SiYuan's addCommand API would be used here
        // Example commands:
        
        // Command: Create new task
        this.registerCommand({
            id: 'create-task',
            name: 'Create new task',
            callback: async () => {
                await this.createNewTask();
            },
            hotkey: 'Ctrl+Shift+T',
        });

        // Command: Toggle task status
        this.registerCommand({
            id: 'toggle-task-status',
            name: 'Toggle task status',
            callback: async () => {
                await this.toggleCurrentTaskStatus();
            },
            hotkey: 'Ctrl+Enter',
        });

        // Command: Open task dashboard
        this.registerCommand({
            id: 'open-dashboard',
            name: 'Open task dashboard',
            callback: () => {
                this.showDashboard();
            },
            hotkey: 'Ctrl+Shift+D',
        });
    }

    /**
     * Register a single command (placeholder)
     */
    private registerCommand(command: {
        id: string;
        name: string;
        callback: () => void;
        hotkey?: string;
    }): void {
        // This would use SiYuan's addCommand API
        console.log(`Registering command: ${command.id}`);
    }

    /**
     * Subscribe to SiYuan EventBus
     */
    private subscribeToEvents(): void {
        // Note: This would use SiYuan's EventBus.on() API
        
        // Subscribe to block update events
        this.subscribeToEvent('block-update', async (event: any) => {
            await this.handleBlockUpdate(event);
        });

        // Subscribe to block delete events
        this.subscribeToEvent('block-delete', async (event: any) => {
            await this.handleBlockDelete(event);
        });
    }

    /**
     * Subscribe to a single event (placeholder)
     */
    private subscribeToEvent(eventName: string, handler: (event: any) => void): void {
        // This would use SiYuan's EventBus API
        console.log(`Subscribing to event: ${eventName}`);
        this.eventBusSubscriptions.push({ eventName, handler });
    }

    /**
     * Unsubscribe from all events
     */
    private unsubscribeFromEvents(): void {
        for (const subscription of this.eventBusSubscriptions) {
            // This would use SiYuan's EventBus.off() API
            console.log(`Unsubscribing from event: ${subscription.eventName}`);
        }
        this.eventBusSubscriptions = [];
    }

    /**
     * Handle block update event
     */
    private async handleBlockUpdate(event: any): Promise<void> {
        const blockId = event.blockId;
        if (!blockId) return;

        try {
            // Sync the updated block
            await this.syncService.syncContentToAttributes(blockId);

            // Refresh dashboard
            await this.refreshDashboard();
        } catch (error) {
            console.error(`Failed to handle block update for ${blockId}:`, error);
        }
    }

    /**
     * Handle block delete event
     */
    private async handleBlockDelete(event: any): Promise<void> {
        const blockId = event.blockId;
        if (!blockId) return;

        // Refresh dashboard
        await this.refreshDashboard();
    }

    /**
     * Handle task click
     */
    private handleTaskClick(task: TaskData): void {
        // Navigate to the block in SiYuan
        console.log(`Navigating to task: ${task.task_id}`);
        // This would use SiYuan's navigation API to open the block
    }

    /**
     * Handle task status toggle
     */
    private async handleTaskStatusToggle(task: TaskData): Promise<void> {
        try {
            // Toggle status
            const newStatus = task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;

            if (newStatus === TaskStatus.DONE) {
                // Complete the task
                const result = TaskCompletionHandler.completeTask(task);

                // Update original task
                await this.syncService.updateTaskCompletely(result.completed);

                // Create next occurrence if recurring
                if (result.nextTask) {
                    await this.syncService.createTask(result.nextTask, task.source_block_id);
                }
            } else {
                // Uncomplete the task
                const updatedTask = { ...task, status: newStatus, done_date: undefined };
                await this.syncService.updateTaskCompletely(updatedTask);
            }

            // Refresh dashboard
            await this.refreshDashboard();
        } catch (error) {
            console.error('Failed to toggle task status:', error);
        }
    }

    /**
     * Handle query execution
     */
    private async handleQueryExecute(query: string): Promise<TaskData[]> {
        try {
            // Apply global filters to query
            const filteredQuery = this.globalFilterService.appendToQuery(query);

            // Execute query with optimizer
            const tasks = await this.queryOptimizer.executeWithTimeout(() =>
                this.queryEngine.executeQuery(filteredQuery),
            );

            // Apply global filters to results
            return this.globalFilterService.filterTasks(tasks);
        } catch (error) {
            console.error('Query execution failed:', error);
            throw error;
        }
    }

    /**
     * Refresh dashboard with latest tasks
     */
    private async refreshDashboard(): Promise<void> {
        try {
            // Query all tasks
            const query = 'tasks\nlimit 1000';
            const tasks = await this.handleQueryExecute(query);

            // Update dashboard component
            if (this.dashboardComponent) {
                this.dashboardComponent.$set({ tasks });
            }
        } catch (error) {
            console.error('Failed to refresh dashboard:', error);
        }
    }

    /**
     * Create a new task
     */
    private async createNewTask(): Promise<void> {
        // This would open a dialog or form to create a new task
        console.log('Creating new task...');
    }

    /**
     * Toggle current task status
     */
    private async toggleCurrentTaskStatus(): Promise<void> {
        // This would find the task at current cursor position and toggle it
        console.log('Toggling current task status...');
    }

    /**
     * Show task dashboard
     */
    private showDashboard(): void {
        // This would show the dock panel
        console.log('Showing task dashboard...');
    }

    /**
     * Get settings manager
     */
    getSettingsManager(): SettingsManager {
        return this.settingsManager;
    }

    /**
     * Get saved queries
     */
    getSavedQueries(): SavedQueries {
        return this.savedQueries;
    }
}

/**
 * Plugin initialization function
 * This would be called by SiYuan when loading the plugin
 */
export async function initPlugin(): Promise<SiYuanTasksPlugin> {
    const plugin = new SiYuanTasksPlugin();
    await plugin.onload();
    return plugin;
}

// Export default for module systems
export default SiYuanTasksPlugin;
