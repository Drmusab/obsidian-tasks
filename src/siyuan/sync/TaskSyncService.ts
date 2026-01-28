/**
 * Bidirectional sync service between inline syntax and block attributes
 */

import { SiYuanAPI } from '../api/SiYuanAPI';
import { TaskSyntaxParser } from '../parser/TaskSyntaxParser';
import { TaskData, taskDataToBlockAttributes, blockAttributesToTaskData } from '../types/TaskData';

/**
 * Conflict resolution strategy
 */
export enum ConflictResolution {
    /** Last write wins based on timestamps */
    LAST_WRITE_WINS = 'last_write_wins',
    /** Inline syntax takes precedence */
    INLINE_WINS = 'inline_wins',
    /** Block attributes take precedence */
    ATTRIBUTES_WIN = 'attributes_win',
}

/**
 * Task synchronization service
 */
export class TaskSyncService {
    private api: SiYuanAPI;
    private conflictResolution: ConflictResolution;

    constructor(api: SiYuanAPI, conflictResolution: ConflictResolution = ConflictResolution.LAST_WRITE_WINS) {
        this.api = api;
        this.conflictResolution = conflictResolution;
    }

    /**
     * Sync task from block content to attributes
     * Called when block content is edited
     */
    async syncContentToAttributes(blockId: string): Promise<void> {
        // Get current block info
        const blockInfo = await this.api.getBlockByID(blockId);
        if (!blockInfo) {
            throw new Error(`Block not found: ${blockId}`);
        }

        // Parse task from content
        const taskData = TaskSyntaxParser.parseTaskLine(blockInfo.content, blockId);
        if (!taskData) {
            // Not a task, nothing to sync
            return;
        }

        // Get existing attributes
        const existingAttrs = await this.api.getBlockAttrs(blockId);

        // Check if we need to resolve conflicts
        if (this.shouldResolveConflict(taskData, existingAttrs)) {
            const resolvedTask = this.resolveConflict(taskData, existingAttrs, blockId);
            if (resolvedTask) {
                // Update both content and attributes with resolved data
                await this.updateTaskCompletely(resolvedTask);
                return;
            }
        }

        // Update attributes with parsed task data
        const attrs = taskDataToBlockAttributes(taskData);
        await this.api.setBlockAttrs(blockId, attrs);
    }

    /**
     * Sync task from attributes to block content
     * Called when attributes change
     */
    async syncAttributesToContent(blockId: string): Promise<void> {
        // Get current attributes
        const attrs = await this.api.getBlockAttrs(blockId);

        // Convert to TaskData
        const taskData = blockAttributesToTaskData(blockId, attrs);
        if (!taskData) {
            // No valid task data in attributes
            return;
        }

        // Get current block content
        const blockInfo = await this.api.getBlockByID(blockId);
        if (!blockInfo) {
            throw new Error(`Block not found: ${blockId}`);
        }

        // Parse current content
        const contentTask = TaskSyntaxParser.parseTaskLine(blockInfo.content, blockId);

        // Check if we need to resolve conflicts
        if (contentTask && this.shouldResolveConflict(taskData, attrs)) {
            const resolvedTask = this.resolveConflict(taskData, attrs, blockId);
            if (resolvedTask) {
                await this.updateTaskCompletely(resolvedTask);
                return;
            }
        }

        // Serialize task to inline format
        const newContent = TaskSyntaxParser.serializeTask(taskData);

        // Update block content
        await this.api.updateBlock(blockId, newContent);
    }

    /**
     * Update both content and attributes
     */
    async updateTaskCompletely(task: TaskData): Promise<void> {
        // Update content
        const content = TaskSyntaxParser.serializeTask(task);
        await this.api.updateBlock(task.source_block_id, content);

        // Update attributes
        const attrs = taskDataToBlockAttributes(task);
        await this.api.setBlockAttrs(task.source_block_id, attrs);
    }

    /**
     * Check if conflict resolution is needed
     */
    private shouldResolveConflict(taskData: TaskData, existingAttrs: Record<string, string>): boolean {
        // If no existing task data, no conflict
        if (!existingAttrs['custom-task-id']) {
            return false;
        }

        // If conflict resolution is not last-write-wins, always check
        if (this.conflictResolution !== ConflictResolution.LAST_WRITE_WINS) {
            return true;
        }

        // Check timestamps for last-write-wins
        const existingUpdated = existingAttrs['custom-task-updated-at'];
        const newUpdated = taskData.updated_at;

        return existingUpdated !== newUpdated;
    }

    /**
     * Resolve conflict between inline and attributes
     */
    private resolveConflict(
        taskData: TaskData,
        existingAttrs: Record<string, string>,
        blockId: string,
    ): TaskData | null {
        switch (this.conflictResolution) {
            case ConflictResolution.INLINE_WINS:
                // Task data from inline wins
                return taskData;

            case ConflictResolution.ATTRIBUTES_WIN:
                // Convert attributes to task data and return
                return blockAttributesToTaskData(blockId, existingAttrs);

            case ConflictResolution.LAST_WRITE_WINS:
                // Compare timestamps
                const existingUpdated = new Date(existingAttrs['custom-task-updated-at'] || 0);
                const newUpdated = new Date(taskData.updated_at);

                if (newUpdated > existingUpdated) {
                    return taskData;
                } else {
                    return blockAttributesToTaskData(blockId, existingAttrs);
                }

            default:
                return taskData;
        }
    }

    /**
     * Sync all tasks in a notebook
     */
    async syncNotebook(notebookId: string): Promise<void> {
        const blocks = await this.api.getNotebookBlocks(notebookId);

        for (const block of blocks) {
            try {
                await this.syncContentToAttributes(block.id);
            } catch (error) {
                console.error(`Failed to sync block ${block.id}:`, error);
                // Continue with other blocks
            }
        }
    }

    /**
     * Create a new task
     */
    async createTask(task: TaskData, previousBlockId?: string): Promise<string> {
        const content = TaskSyntaxParser.serializeTask(task);

        // Insert block
        const blockId = previousBlockId
            ? await this.api.insertBlock(previousBlockId, content)
            : await this.api.insertBlock('', content); // Will need proper handling

        // Update task with block ID
        task.source_block_id = blockId;

        // Set attributes
        const attrs = taskDataToBlockAttributes(task);
        await this.api.setBlockAttrs(blockId, attrs);

        return blockId;
    }

    /**
     * Delete a task
     */
    async deleteTask(blockId: string): Promise<void> {
        await this.api.deleteBlock(blockId);
    }

    /**
     * Get task by block ID
     */
    async getTask(blockId: string): Promise<TaskData | null> {
        const attrs = await this.api.getBlockAttrs(blockId);
        return blockAttributesToTaskData(blockId, attrs);
    }
}
