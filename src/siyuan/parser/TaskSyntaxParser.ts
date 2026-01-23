/**
 * Parser for SiYuan-compatible inline task syntax
 * Supports: @due(), @scheduled(), @start(), @done(), @cancelled(), @priority(), @recur(), @depends(), @id()
 */

import { v4 as uuidv4 } from 'uuid';
import { TaskData, TaskStatus, TaskPriority, PRIORITY_MAP, STATUS_SYMBOLS } from '../types/TaskData';

/**
 * Signifier types supported in inline syntax
 */
export enum SignifierType {
    DUE = 'due',
    SCHEDULED = 'scheduled',
    START = 'start',
    DONE = 'done',
    CANCELLED = 'cancelled',
    PRIORITY = 'priority',
    RECUR = 'recur',
    DEPENDS = 'depends',
    ID = 'id',
}

/**
 * Parsed signifier from inline syntax
 */
interface ParsedSignifier {
    type: SignifierType;
    value: string;
    rawMatch: string;
}

/**
 * Parse inline task syntax to structured TaskData
 */
export class TaskSyntaxParser {
    /**
     * Regular expression to match signifiers
     * Format: @signifier(value)
     */
    private static SIGNIFIER_REGEX = /@(\w+)\(([^)]+)\)/g;

    /**
     * Parse relative date expressions
     */
    private static parseRelativeDate(dateStr: string): string | undefined {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lower = dateStr.toLowerCase().trim();

        if (lower === 'today') {
            return this.formatDate(today);
        }

        if (lower === 'tomorrow') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return this.formatDate(tomorrow);
        }

        if (lower === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return this.formatDate(yesterday);
        }

        // Handle "next [day of week]"
        const nextDayMatch = lower.match(/^next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
        if (nextDayMatch) {
            const targetDay = nextDayMatch[1];
            const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const targetDayIndex = daysOfWeek.indexOf(targetDay);
            const currentDayIndex = today.getDay();

            let daysToAdd = targetDayIndex - currentDayIndex;
            if (daysToAdd <= 0) {
                daysToAdd += 7;
            }

            const nextDay = new Date(today);
            nextDay.setDate(nextDay.getDate() + daysToAdd);
            return this.formatDate(nextDay);
        }

        // If it looks like a date already, return it
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }

        return undefined;
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

    /**
     * Extract signifiers from task text
     */
    private static extractSignifiers(text: string): ParsedSignifier[] {
        const signifiers: ParsedSignifier[] = [];
        let match: RegExpExecArray | null;

        this.SIGNIFIER_REGEX.lastIndex = 0;
        while ((match = this.SIGNIFIER_REGEX.exec(text)) !== null) {
            const [rawMatch, type, value] = match;

            // Validate signifier type
            if (Object.values(SignifierType).includes(type as SignifierType)) {
                signifiers.push({
                    type: type as SignifierType,
                    value: value.trim(),
                    rawMatch,
                });
            }
        }

        return signifiers;
    }

    /**
     * Remove signifiers from task text to get clean description
     */
    private static removeSignifiers(text: string): string {
        return text.replace(this.SIGNIFIER_REGEX, '').trim();
    }

    /**
     * Parse task line to TaskData
     */
    static parseTaskLine(line: string, blockId: string): TaskData | null {
        // Match task checkbox pattern: - [ ] or - [x] etc.
        const taskMatch = line.match(/^[\s-]*\[(.)\]\s*(.*)$/);
        if (!taskMatch) {
            return null;
        }

        const [, checkbox, content] = taskMatch;
        const statusSymbol = `[${checkbox}]`;

        // Determine status from checkbox
        let status = TaskStatus.TODO;
        if (checkbox.toLowerCase() === 'x') {
            status = TaskStatus.DONE;
        } else if (checkbox === '>') {
            status = TaskStatus.DOING;
        } else if (checkbox === '-') {
            status = TaskStatus.CANCELLED;
        } else if (checkbox === '!') {
            status = TaskStatus.ON_HOLD;
        }

        // Extract signifiers
        const signifiers = this.extractSignifiers(content);
        const description = this.removeSignifiers(content);

        // Build TaskData from signifiers
        const taskData: TaskData = {
            task_id: uuidv4(),
            status,
            status_symbol: statusSymbol,
            priority: TaskPriority.NONE,
            base_on_completion: false,
            tags: [],
            description,
            depends_on: [],
            source_block_id: blockId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        // Process each signifier
        for (const signifier of signifiers) {
            switch (signifier.type) {
                case SignifierType.DUE:
                    taskData.due_date = this.parseRelativeDate(signifier.value);
                    break;

                case SignifierType.SCHEDULED:
                    taskData.scheduled_date = this.parseRelativeDate(signifier.value);
                    break;

                case SignifierType.START:
                    taskData.start_date = this.parseRelativeDate(signifier.value);
                    break;

                case SignifierType.DONE:
                    taskData.done_date = this.parseRelativeDate(signifier.value);
                    break;

                case SignifierType.CANCELLED:
                    taskData.cancelled_date = this.parseRelativeDate(signifier.value);
                    break;

                case SignifierType.PRIORITY:
                    const priorityValue = signifier.value.toLowerCase();
                    taskData.priority = PRIORITY_MAP[priorityValue] || TaskPriority.NONE;
                    break;

                case SignifierType.RECUR:
                    taskData.recurrence_rule = signifier.value;
                    // Check if it's a "when done" style recurrence
                    if (signifier.value.includes('when done')) {
                        taskData.base_on_completion = true;
                    }
                    break;

                case SignifierType.DEPENDS:
                    taskData.depends_on = signifier.value.split(',').map((id) => id.trim());
                    break;

                case SignifierType.ID:
                    taskData.id_for_deps = signifier.value;
                    break;
            }
        }

        return taskData;
    }

    /**
     * Serialize TaskData back to inline format
     */
    static serializeTask(task: TaskData): string {
        const parts: string[] = [];

        // Start with description
        parts.push(task.description);

        // Add signifiers
        if (task.due_date) {
            parts.push(`@due(${task.due_date})`);
        }

        if (task.scheduled_date) {
            parts.push(`@scheduled(${task.scheduled_date})`);
        }

        if (task.start_date) {
            parts.push(`@start(${task.start_date})`);
        }

        if (task.done_date) {
            parts.push(`@done(${task.done_date})`);
        }

        if (task.cancelled_date) {
            parts.push(`@cancelled(${task.cancelled_date})`);
        }

        if (task.priority !== TaskPriority.NONE) {
            const priorityName = Object.keys(PRIORITY_MAP).find(
                (key) => PRIORITY_MAP[key] === task.priority,
            );
            if (priorityName) {
                parts.push(`@priority(${priorityName})`);
            }
        }

        if (task.recurrence_rule) {
            parts.push(`@recur(${task.recurrence_rule})`);
        }

        if (task.depends_on.length > 0) {
            parts.push(`@depends(${task.depends_on.join(', ')})`);
        }

        if (task.id_for_deps) {
            parts.push(`@id(${task.id_for_deps})`);
        }

        // Build full task line with checkbox
        return `- ${task.status_symbol} ${parts.join(' ')}`;
    }

    /**
     * Update task line with new data
     */
    static updateTaskLine(originalLine: string, task: TaskData): string {
        return this.serializeTask(task);
    }
}
