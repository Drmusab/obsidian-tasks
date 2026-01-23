<script lang="ts">
  import type { TaskData } from '../types/TaskData';
  import TaskItem from './TaskItem.svelte';

  export let tasks: TaskData[] = [];
  export let onTaskClick: (task: TaskData) => void = () => {};
  export let onTaskStatusToggle: (task: TaskData) => void = () => {};

  let sortBy: 'due_date' | 'priority' | 'created_at' = 'due_date';
  let sortDirection: 'asc' | 'desc' = 'asc';

  $: sortedTasks = sortTasks(tasks, sortBy, sortDirection);

  function sortTasks(taskList: TaskData[], field: string, direction: string): TaskData[] {
    const sorted = [...taskList].sort((a, b) => {
      let aValue: any = a[field as keyof TaskData];
      let bValue: any = b[field as keyof TaskData];

      // Handle undefined values
      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';

      // Handle priority (numeric)
      if (field === 'priority') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  function handleSortChange(field: 'due_date' | 'priority' | 'created_at') {
    if (sortBy === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = field;
      sortDirection = 'asc';
    }
  }
</script>

<div class="task-list">
  {#if tasks.length === 0}
    <div class="empty-state">
      <p>No tasks found</p>
    </div>
  {:else}
    <div class="task-list-header">
      <div class="task-count">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</div>
      <div class="sort-controls">
        <label>Sort by:</label>
        <button 
          class="sort-button" 
          class:active={sortBy === 'due_date'}
          on:click={() => handleSortChange('due_date')}
        >
          Due Date {sortBy === 'due_date' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
        </button>
        <button 
          class="sort-button" 
          class:active={sortBy === 'priority'}
          on:click={() => handleSortChange('priority')}
        >
          Priority {sortBy === 'priority' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
        </button>
        <button 
          class="sort-button" 
          class:active={sortBy === 'created_at'}
          on:click={() => handleSortChange('created_at')}
        >
          Created {sortBy === 'created_at' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
        </button>
      </div>
    </div>

    <div class="task-items">
      {#each sortedTasks as task (task.task_id)}
        <TaskItem 
          {task}
          onClick={() => onTaskClick(task)}
          onStatusToggle={() => onTaskStatusToggle(task)}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .task-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .empty-state {
    text-align: center;
    padding: 48px 16px;
    color: var(--b3-theme-on-surface);
  }

  .empty-state p {
    margin: 0;
    font-size: 14px;
  }

  .task-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--b3-theme-surface);
    border-radius: 4px;
    margin-bottom: 8px;
  }

  .task-count {
    font-size: 13px;
    font-weight: 500;
    color: var(--b3-theme-on-surface);
  }

  .sort-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sort-controls label {
    font-size: 12px;
    color: var(--b3-theme-on-surface);
  }

  .sort-button {
    padding: 4px 8px;
    background: none;
    border: 1px solid var(--b3-border-color);
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
    color: var(--b3-theme-on-surface);
    transition: all 0.2s;
  }

  .sort-button:hover {
    background: var(--b3-theme-surface-lighter);
  }

  .sort-button.active {
    background: var(--b3-theme-primary);
    color: var(--b3-theme-on-primary);
    border-color: var(--b3-theme-primary);
  }

  .task-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
</style>
