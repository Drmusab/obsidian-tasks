<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { TaskData } from '../types/TaskData';
  import TaskList from './TaskList.svelte';
  import QueryEditor from './QueryEditor.svelte';

  export let tasks: TaskData[] = [];
  export let onTaskClick: (task: TaskData) => void = () => {};
  export let onTaskStatusToggle: (task: TaskData) => void = () => {};
  export let onQueryExecute: (query: string) => Promise<TaskData[]> = async () => [];

  type TabType = 'today' | 'upcoming' | 'overdue' | 'all' | 'custom';
  
  let activeTab: TabType = 'today';
  let filteredTasks: TaskData[] = [];
  let customQuery: string = '';
  let isLoading: boolean = false;

  // Reactive filtering based on active tab
  $: {
    filteredTasks = filterTasksByTab(tasks, activeTab);
  }

  function filterTasksByTab(allTasks: TaskData[], tab: TabType): TaskData[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    switch (tab) {
      case 'today':
        return allTasks.filter(task => task.due_date === todayStr && task.status !== 'DONE');
      
      case 'upcoming':
        return allTasks.filter(task => {
          if (!task.due_date || task.status === 'DONE') return false;
          const dueDate = new Date(task.due_date);
          return dueDate > tomorrow && dueDate <= nextWeek;
        });
      
      case 'overdue':
        return allTasks.filter(task => {
          if (!task.due_date || task.status === 'DONE') return false;
          const dueDate = new Date(task.due_date);
          return dueDate < today;
        });
      
      case 'all':
        return allTasks;
      
      case 'custom':
        return allTasks; // Will be filtered by custom query
      
      default:
        return allTasks;
    }
  }

  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function handleTabChange(tab: TabType) {
    activeTab = tab;
  }

  async function handleCustomQuery(query: string) {
    isLoading = true;
    try {
      const results = await onQueryExecute(query);
      filteredTasks = results;
    } catch (error) {
      console.error('Query execution failed:', error);
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    // Initialize
  });

  onDestroy(() => {
    // Cleanup
  });
</script>

<div class="siyuan-tasks-dashboard">
  <div class="dashboard-header">
    <h2>Tasks Dashboard</h2>
  </div>

  <div class="dashboard-tabs">
    <button 
      class="tab-button" 
      class:active={activeTab === 'today'}
      on:click={() => handleTabChange('today')}
    >
      Today ({filterTasksByTab(tasks, 'today').length})
    </button>
    <button 
      class="tab-button" 
      class:active={activeTab === 'upcoming'}
      on:click={() => handleTabChange('upcoming')}
    >
      Upcoming ({filterTasksByTab(tasks, 'upcoming').length})
    </button>
    <button 
      class="tab-button" 
      class:active={activeTab === 'overdue'}
      on:click={() => handleTabChange('overdue')}
    >
      Overdue ({filterTasksByTab(tasks, 'overdue').length})
    </button>
    <button 
      class="tab-button" 
      class:active={activeTab === 'all'}
      on:click={() => handleTabChange('all')}
    >
      All Tasks ({tasks.length})
    </button>
    <button 
      class="tab-button" 
      class:active={activeTab === 'custom'}
      on:click={() => handleTabChange('custom')}
    >
      Custom Query
    </button>
  </div>

  <div class="dashboard-content">
    {#if activeTab === 'custom'}
      <QueryEditor 
        onExecute={handleCustomQuery}
        bind:query={customQuery}
      />
    {/if}

    {#if isLoading}
      <div class="loading">Loading tasks...</div>
    {:else}
      <TaskList 
        tasks={filteredTasks}
        {onTaskClick}
        {onTaskStatusToggle}
      />
    {/if}
  </div>
</div>

<style>
  .siyuan-tasks-dashboard {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 12px;
  }

  .dashboard-header {
    margin-bottom: 16px;
  }

  .dashboard-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .dashboard-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--b3-border-color);
  }

  .tab-button {
    padding: 8px 16px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-size: 14px;
    color: var(--b3-theme-on-background);
    transition: all 0.2s;
  }

  .tab-button:hover {
    background: var(--b3-theme-surface-lighter);
  }

  .tab-button.active {
    border-bottom-color: var(--b3-theme-primary);
    color: var(--b3-theme-primary);
    font-weight: 500;
  }

  .dashboard-content {
    flex: 1;
    overflow-y: auto;
  }

  .loading {
    text-align: center;
    padding: 32px;
    color: var(--b3-theme-on-surface);
  }
</style>
