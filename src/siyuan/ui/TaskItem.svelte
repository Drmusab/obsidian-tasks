<script lang="ts">
  import type { TaskData } from '../types/TaskData';
  import { TaskStatus } from '../types/TaskData';

  export let task: TaskData;
  export let onClick: () => void = () => {};
  export let onStatusToggle: () => void = () => {};

  function getStatusIcon(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.TODO:
        return '☐';
      case TaskStatus.DOING:
        return '▶';
      case TaskStatus.DONE:
        return '✓';
      case TaskStatus.CANCELLED:
        return '✗';
      case TaskStatus.ON_HOLD:
        return '⏸';
      default:
        return '☐';
    }
  }

  function getPriorityColor(priority: number): string {
    switch (priority) {
      case 1: return '#dc3545'; // highest
      case 2: return '#fd7e14'; // high
      case 3: return '#ffc107'; // medium
      case 4: return '#20c997'; // low
      case 5: return '#6c757d'; // lowest
      default: return '#6c757d';
    }
  }

  function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    return dateStr;
  }

  function isOverdue(task: TaskData): boolean {
    if (!task.due_date || task.status === TaskStatus.DONE) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.due_date);
    return due < today;
  }

  $: overdue = isOverdue(task);
</script>

<div class="task-item" class:overdue on:click={onClick}>
  <div class="task-checkbox" on:click|stopPropagation={onStatusToggle}>
    <span class="status-icon">{getStatusIcon(task.status)}</span>
  </div>

  <div class="task-content">
    <div class="task-description">
      {task.description}
    </div>

    <div class="task-metadata">
      {#if task.due_date}
        <span class="metadata-item due-date">
          📅 {formatDate(task.due_date)}
        </span>
      {/if}

      {#if task.priority && task.priority < 6}
        <span class="metadata-item priority" style="color: {getPriorityColor(task.priority)}">
          ⚡ Priority {task.priority}
        </span>
      {/if}

      {#if task.recurrence_rule}
        <span class="metadata-item recurrence">
          🔁 Recurring
        </span>
      {/if}

      {#if task.tags && task.tags.length > 0}
        <div class="task-tags">
          {#each task.tags as tag}
            <span class="tag">#{tag}</span>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .task-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .task-item:hover {
    background: var(--b3-theme-surface-lighter);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .task-item.overdue {
    border-left: 3px solid #dc3545;
  }

  .task-checkbox {
    display: flex;
    align-items: flex-start;
    padding-top: 2px;
  }

  .status-icon {
    font-size: 16px;
    cursor: pointer;
    user-select: none;
  }

  .task-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .task-description {
    font-size: 14px;
    color: var(--b3-theme-on-surface);
    line-height: 1.5;
  }

  .task-metadata {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
  }

  .metadata-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--b3-theme-on-surface);
    opacity: 0.8;
  }

  .metadata-item.due-date {
    color: var(--b3-theme-on-surface);
  }

  .task-item.overdue .metadata-item.due-date {
    color: #dc3545;
    font-weight: 500;
  }

  .task-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .tag {
    display: inline-block;
    padding: 2px 8px;
    background: var(--b3-theme-primary-lighter);
    color: var(--b3-theme-primary);
    border-radius: 3px;
    font-size: 11px;
  }
</style>
