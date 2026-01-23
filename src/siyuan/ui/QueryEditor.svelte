<script lang="ts">
  export let query: string = '';
  export let onExecute: (query: string) => Promise<void> = async () => {};

  let isExecuting: boolean = false;
  let error: string = '';

  async function handleExecute() {
    if (!query.trim()) {
      error = 'Please enter a query';
      return;
    }

    isExecuting = true;
    error = '';

    try {
      await onExecute(query);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Query execution failed';
    } finally {
      isExecuting = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      handleExecute();
    }
  }

  // Sample queries for quick access
  const sampleQueries = [
    {
      name: 'Today\'s Tasks',
      query: 'tasks\nwhere due = today\n  and status != done\nsort by priority asc'
    },
    {
      name: 'High Priority',
      query: 'tasks\nwhere priority <= 2\n  and status != done\nsort by due asc'
    },
    {
      name: 'Overdue',
      query: 'tasks\nwhere due < today\n  and status != done\nsort by due asc'
    },
    {
      name: 'This Week',
      query: 'tasks\nwhere due <= today + 7d\n  and status != done\nsort by due asc'
    }
  ];

  function loadSampleQuery(sampleQuery: string) {
    query = sampleQuery;
  }
</script>

<div class="query-editor">
  <div class="editor-header">
    <h3>Query Editor</h3>
    <button 
      class="execute-button" 
      on:click={handleExecute}
      disabled={isExecuting}
    >
      {isExecuting ? 'Executing...' : 'Execute (Ctrl+Enter)'}
    </button>
  </div>

  <div class="editor-body">
    <textarea
      class="query-input"
      bind:value={query}
      on:keydown={handleKeyDown}
      placeholder="Enter your query here...&#10;Example:&#10;tasks&#10;where status != done&#10;  and due <= today + 7d&#10;sort by due asc&#10;limit 50"
      rows="10"
    ></textarea>

    {#if error}
      <div class="error-message">{error}</div>
    {/if}

    <div class="sample-queries">
      <h4>Sample Queries:</h4>
      <div class="sample-buttons">
        {#each sampleQueries as sample}
          <button 
            class="sample-button"
            on:click={() => loadSampleQuery(sample.query)}
          >
            {sample.name}
          </button>
        {/each}
      </div>
    </div>

    <div class="query-help">
      <h4>Query Syntax:</h4>
      <ul>
        <li><code>where</code> - Filter tasks (status, due, priority, tags)</li>
        <li><code>and</code> / <code>or</code> - Boolean logic</li>
        <li><code>sort by</code> - Sort results (asc/desc)</li>
        <li><code>limit</code> - Limit number of results</li>
      </ul>
    </div>
  </div>
</div>

<style>
  .query-editor {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    background: var(--b3-theme-surface);
    border-radius: 4px;
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .editor-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }

  .execute-button {
    padding: 8px 16px;
    background: var(--b3-theme-primary);
    color: var(--b3-theme-on-primary);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .execute-button:hover:not(:disabled) {
    background: var(--b3-theme-primary-light);
  }

  .execute-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .editor-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .query-input {
    width: 100%;
    padding: 12px;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 13px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-on-background);
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    resize: vertical;
  }

  .query-input:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }

  .error-message {
    padding: 12px;
    background: rgba(220, 53, 69, 0.1);
    color: #dc3545;
    border: 1px solid rgba(220, 53, 69, 0.3);
    border-radius: 4px;
    font-size: 13px;
  }

  .sample-queries {
    margin-top: 8px;
  }

  .sample-queries h4 {
    margin: 0 0 8px 0;
    font-size: 13px;
    font-weight: 600;
  }

  .sample-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .sample-button {
    padding: 6px 12px;
    background: var(--b3-theme-surface-lighter);
    border: 1px solid var(--b3-border-color);
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }

  .sample-button:hover {
    background: var(--b3-theme-primary-lighter);
    border-color: var(--b3-theme-primary);
  }

  .query-help {
    margin-top: 8px;
    padding: 12px;
    background: var(--b3-theme-background);
    border-radius: 4px;
  }

  .query-help h4 {
    margin: 0 0 8px 0;
    font-size: 13px;
    font-weight: 600;
  }

  .query-help ul {
    margin: 0;
    padding-left: 20px;
    font-size: 12px;
    line-height: 1.6;
  }

  .query-help code {
    padding: 2px 6px;
    background: var(--b3-theme-surface);
    border-radius: 3px;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 11px;
  }
</style>
