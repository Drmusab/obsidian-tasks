/**
 * SiYuan-native task data schema using block attributes with custom-task-* prefix
 */

/**
 * Task status enumeration
 */
export enum TaskStatus {
    TODO = 'TODO',
    DOING = 'DOING',
    DONE = 'DONE',
    CANCELLED = 'CANCELLED',
    ON_HOLD = 'ON_HOLD',
}

/**
 * Priority levels (1 = highest, 6 = lowest)
 */
export enum TaskPriority {
    HIGHEST = 1,
    HIGH = 2,
    MEDIUM = 3,
    LOW = 4,
    LOWEST = 5,
    NONE = 6,
}

/**
 * Priority name to numeric mapping
 */
export const PRIORITY_MAP: Record<string, TaskPriority> = {
    highest: TaskPriority.HIGHEST,
    high: TaskPriority.HIGH,
    medium: TaskPriority.MEDIUM,
    low: TaskPriority.LOW,
    lowest: TaskPriority.LOWEST,
    none: TaskPriority.NONE,
};

/**
 * Core task data structure stored as SiYuan block attributes
 */
export interface TaskData {
    /** Unique UUID identifier */
    task_id: string;

    /** Task status */
    status: TaskStatus;

    /** The checkbox character/symbol */
    status_symbol: string;

    /** Due date in YYYY-MM-DD format */
    due_date?: string;

    /** Scheduled date in YYYY-MM-DD format */
    scheduled_date?: string;

    /** Start date in YYYY-MM-DD format */
    start_date?: string;

    /** Completion timestamp in YYYY-MM-DD format */
    done_date?: string;

    /** Cancellation timestamp in YYYY-MM-DD format */
    cancelled_date?: string;

    /** Priority level (1-6) */
    priority: TaskPriority;

    /** RRULE-compatible recurrence string */
    recurrence_rule?: string;

    /** Whether recurrence is based on completion date */
    base_on_completion: boolean;

    /** Pre-calculated next due date for recurrence */
    next_due?: string;

    /** Last completion timestamp for recurring tasks */
    last_completed?: string;

    /** Task-specific tags */
    tags: string[];

    /** Task description text */
    description: string;

    /** Task IDs this task depends on */
    depends_on: string[];

    /** ID used for dependency tracking */
    id_for_deps?: string;

    /** SiYuan block ID where this task is stored */
    source_block_id: string;

    /** Creation timestamp (ISO format) */
    created_at: string;

    /** Last update timestamp (ISO format) */
    updated_at: string;
}

/**
 * Block attributes schema for SiYuan
 * Uses custom-task-* prefix for all task-related attributes
 */
export interface TaskBlockAttributes {
    'custom-task-id': string;
    'custom-task-status': string;
    'custom-task-symbol': string;
    'custom-task-due'?: string;
    'custom-task-scheduled'?: string;
    'custom-task-start'?: string;
    'custom-task-done'?: string;
    'custom-task-cancelled'?: string;
    'custom-task-priority': string;
    'custom-task-recurrence'?: string;
    'custom-task-base-on-completion': string;
    'custom-task-next-due'?: string;
    'custom-task-last-completed'?: string;
    'custom-task-tags': string;
    'custom-task-description': string;
    'custom-task-depends-on': string;
    'custom-task-id-for-deps'?: string;
    'custom-task-created-at': string;
    'custom-task-updated-at': string;
}

/**
 * Convert TaskData to SiYuan block attributes
 */
export function taskDataToBlockAttributes(task: TaskData): TaskBlockAttributes {
    return {
        'custom-task-id': task.task_id,
        'custom-task-status': task.status,
        'custom-task-symbol': task.status_symbol,
        'custom-task-due': task.due_date,
        'custom-task-scheduled': task.scheduled_date,
        'custom-task-start': task.start_date,
        'custom-task-done': task.done_date,
        'custom-task-cancelled': task.cancelled_date,
        'custom-task-priority': task.priority.toString(),
        'custom-task-recurrence': task.recurrence_rule,
        'custom-task-base-on-completion': task.base_on_completion.toString(),
        'custom-task-next-due': task.next_due,
        'custom-task-last-completed': task.last_completed,
        'custom-task-tags': JSON.stringify(task.tags),
        'custom-task-description': task.description,
        'custom-task-depends-on': JSON.stringify(task.depends_on),
        'custom-task-id-for-deps': task.id_for_deps,
        'custom-task-created-at': task.created_at,
        'custom-task-updated-at': task.updated_at,
    };
}

/**
 * Convert SiYuan block attributes to TaskData
 */
export function blockAttributesToTaskData(
    blockId: string,
    attrs: Partial<TaskBlockAttributes>,
): TaskData | null {
    // Require minimum fields
    if (!attrs['custom-task-id'] || !attrs['custom-task-description']) {
        return null;
    }

    return {
        task_id: attrs['custom-task-id'],
        status: (attrs['custom-task-status'] as TaskStatus) || TaskStatus.TODO,
        status_symbol: attrs['custom-task-symbol'] || '[ ]',
        due_date: attrs['custom-task-due'],
        scheduled_date: attrs['custom-task-scheduled'],
        start_date: attrs['custom-task-start'],
        done_date: attrs['custom-task-done'],
        cancelled_date: attrs['custom-task-cancelled'],
        priority: parseInt(attrs['custom-task-priority'] || '6', 10) as TaskPriority,
        recurrence_rule: attrs['custom-task-recurrence'],
        base_on_completion: attrs['custom-task-base-on-completion'] === 'true',
        next_due: attrs['custom-task-next-due'],
        last_completed: attrs['custom-task-last-completed'],
        tags: attrs['custom-task-tags'] ? JSON.parse(attrs['custom-task-tags']) : [],
        description: attrs['custom-task-description'],
        depends_on: attrs['custom-task-depends-on'] ? JSON.parse(attrs['custom-task-depends-on']) : [],
        id_for_deps: attrs['custom-task-id-for-deps'],
        source_block_id: blockId,
        created_at: attrs['custom-task-created-at'] || new Date().toISOString(),
        updated_at: attrs['custom-task-updated-at'] || new Date().toISOString(),
    };
}

/**
 * Status symbol mapping
 */
export const STATUS_SYMBOLS: Record<TaskStatus, string> = {
    [TaskStatus.TODO]: '[ ]',
    [TaskStatus.DOING]: '[>]',
    [TaskStatus.DONE]: '[x]',
    [TaskStatus.CANCELLED]: '[-]',
    [TaskStatus.ON_HOLD]: '[!]',
};

/**
 * Reverse mapping from symbols to status
 */
export const SYMBOL_TO_STATUS: Record<string, TaskStatus> = {
    '[ ]': TaskStatus.TODO,
    '[>]': TaskStatus.DOING,
    '[x]': TaskStatus.DONE,
    '[-]': TaskStatus.CANCELLED,
    '[!]': TaskStatus.ON_HOLD,
};
