/**
 * Task completion handler for recurring tasks
 */

import { v4 as uuidv4 } from 'uuid';
import { TaskData, TaskStatus } from '../types/TaskData';
import { RecurrenceEngine } from './RecurrenceEngine';
import { getToday, formatDate, parseDate, addDays } from './TimezoneHandler';

/**
 * Handle task completion and recurrence
 */
export class TaskCompletionHandler {
    /**
     * Complete a task and create next occurrence if recurring
     */
    static completeTask(task: TaskData): { completed: TaskData; nextTask: TaskData | null } {
        // Mark task as complete
        const completedTask: TaskData = {
            ...task,
            status: TaskStatus.DONE,
            done_date: getToday(),
            updated_at: new Date().toISOString(),
        };

        // If not recurring, just return completed task
        if (!task.recurrence_rule) {
            return { completed: completedTask, nextTask: null };
        }

        // Create next occurrence
        const nextTask = this.createNextOccurrence(completedTask);

        return { completed: completedTask, nextTask };
    }

    /**
     * Cancel a task
     */
    static cancelTask(task: TaskData): TaskData {
        return {
            ...task,
            status: TaskStatus.CANCELLED,
            cancelled_date: getToday(),
            updated_at: new Date().toISOString(),
        };
    }

    /**
     * Create next occurrence of a recurring task
     */
    static createNextOccurrence(completedTask: TaskData): TaskData | null {
        if (!completedTask.recurrence_rule) {
            return null;
        }

        // Determine base date for next occurrence
        const baseDate = completedTask.base_on_completion
            ? getToday()
            : completedTask.due_date || getToday();

        // Calculate next due date
        const nextDue = RecurrenceEngine.getNextOccurrence(
            completedTask.recurrence_rule,
            baseDate,
            completedTask.base_on_completion,
        );

        if (!nextDue) {
            return null;
        }

        // Calculate date offsets to preserve relative spacing
        const dateOffsets = this.calculateDateOffsets(completedTask);

        // Create new task
        const nextTask: TaskData = {
            ...completedTask,
            task_id: uuidv4(),
            status: TaskStatus.TODO,
            status_symbol: '[ ]',
            due_date: nextDue,
            scheduled_date: this.applyOffset(nextDue, dateOffsets.scheduled),
            start_date: this.applyOffset(nextDue, dateOffsets.start),
            done_date: undefined,
            cancelled_date: undefined,
            last_completed: completedTask.done_date,
            next_due: undefined, // Will be calculated on next completion
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        return nextTask;
    }

    /**
     * Calculate date offsets relative to due date
     */
    private static calculateDateOffsets(task: TaskData): {
        scheduled: number;
        start: number;
    } {
        const offsets = {
            scheduled: 0,
            start: 0,
        };

        if (!task.due_date) {
            return offsets;
        }

        const dueDate = parseDate(task.due_date);
        if (!dueDate) {
            return offsets;
        }

        // Calculate scheduled offset
        if (task.scheduled_date) {
            const scheduledDate = parseDate(task.scheduled_date);
            if (scheduledDate) {
                const diffTime = scheduledDate.getTime() - dueDate.getTime();
                offsets.scheduled = Math.round(diffTime / (1000 * 60 * 60 * 24));
            }
        }

        // Calculate start offset
        if (task.start_date) {
            const startDate = parseDate(task.start_date);
            if (startDate) {
                const diffTime = startDate.getTime() - dueDate.getTime();
                offsets.start = Math.round(diffTime / (1000 * 60 * 60 * 24));
            }
        }

        return offsets;
    }

    /**
     * Apply offset to a date
     */
    private static applyOffset(baseDate: string, offsetDays: number): string | undefined {
        if (offsetDays === 0) {
            return undefined;
        }

        return addDays(baseDate, offsetDays) || undefined;
    }

    /**
     * Handle overdue recurring task
     * Determines whether to catch up or skip to next occurrence
     */
    static handleOverdueRecurrence(
        task: TaskData,
        catchUp: boolean = false,
    ): TaskData {
        if (!task.recurrence_rule || !task.due_date) {
            return task;
        }

        const today = getToday();

        // If not overdue, nothing to do
        const dueDate = parseDate(task.due_date);
        const todayDate = parseDate(today);
        if (!dueDate || !todayDate || dueDate >= todayDate) {
            return task;
        }

        // Calculate next due date
        const baseDate = catchUp ? task.due_date : today;
        const nextDue = RecurrenceEngine.getNextOccurrence(
            task.recurrence_rule,
            baseDate,
            task.base_on_completion,
        );

        if (!nextDue) {
            return task;
        }

        // Update task with new dates
        const dateOffsets = this.calculateDateOffsets(task);

        return {
            ...task,
            due_date: nextDue,
            scheduled_date: this.applyOffset(nextDue, dateOffsets.scheduled),
            start_date: this.applyOffset(nextDue, dateOffsets.start),
            updated_at: new Date().toISOString(),
        };
    }

    /**
     * Preview next N occurrences
     */
    static previewOccurrences(task: TaskData, count: number = 5): string[] {
        if (!task.recurrence_rule) {
            return [];
        }

        const occurrences: string[] = [];
        let currentDate = task.due_date || getToday();

        for (let i = 0; i < count; i++) {
            const next = RecurrenceEngine.getNextOccurrence(
                task.recurrence_rule,
                currentDate,
                task.base_on_completion,
            );

            if (!next) {
                break;
            }

            occurrences.push(next);
            currentDate = next;
        }

        return occurrences;
    }
}
