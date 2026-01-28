# SiYuan Task Management System

A comprehensive, native task management system for SiYuan, inspired by Obsidian Tasks. This implementation preserves the power and flexibility of Obsidian Tasks while respecting SiYuan's block-based architecture.

## Overview

The SiYuan Task Management System provides:
- **Native Integration**: Built specifically for SiYuan's block-based architecture
- **Block Attributes**: Uses SiYuan's custom attribute system (`custom-task-*` prefix)
- **Inline Syntax**: Simple, readable task syntax with signifiers
- **Powerful Queries**: Flexible query language for filtering and organizing tasks
- **Recurrence Support**: Robust recurring task system with RRULE
- **UI Dashboard**: Clean, native-styled dashboard with multiple views

## Installation

1. Install dependencies:
```bash
yarn add uuid
yarn add @types/uuid --dev
```

2. The `rrule` dependency is already included in the project.

## Core Components

### 1. Task Data Model (`src/siyuan/types/TaskData.ts`)

Tasks are stored using SiYuan block attributes with a `custom-task-*` prefix:

```typescript
interface TaskData {
    task_id: string;              // Unique UUID
    status: TaskStatus;           // TODO | DOING | DONE | CANCELLED | ON_HOLD
    status_symbol: string;        // Checkbox character
    due_date?: string;            // YYYY-MM-DD
    scheduled_date?: string;      // YYYY-MM-DD
    start_date?: string;          // YYYY-MM-DD
    priority: TaskPriority;       // 1-6 (1=highest)
    recurrence_rule?: string;     // RRULE or WHEN_DONE format
    tags: string[];               // Task-specific tags
    description: string;          // Task text
    // ... and more
}
```

### 2. Inline Task Syntax

Tasks use a simple inline syntax with signifiers:

```markdown
- [ ] Task description @due(2026-01-25) @priority(high) @recur(every week)
- [ ] Review code @scheduled(tomorrow) @priority(medium)
- [x] Completed task @done(2026-01-23)
- [ ] Recurring task @recur(every 3 days) @due(today)
```

**Supported Signifiers:**
- `@due(date)` - Due date
- `@scheduled(date)` - Scheduled date
- `@start(date)` - Start date
- `@done(date)` - Completion date
- `@cancelled(date)` - Cancellation date
- `@priority(level)` - Priority: highest, high, medium, low, lowest
- `@recur(rule)` - Recurrence rule (natural language or RRULE)
- `@depends(id)` - Task dependencies
- `@id(identifier)` - ID for dependency tracking

**Relative Dates:**
- `today`, `tomorrow`, `yesterday`
- `next monday`, `next tuesday`, etc.
- Absolute dates: `2026-01-25`

### 3. Query Language

Powerful query syntax for filtering tasks:

```
tasks
where status != done
  and due <= today + 7d
  and (tag includes #work or priority >= high)
sort by due asc, priority desc
limit 50
```

**Query Features:**
- Boolean logic: `and`, `or`, `not`
- Operators: `=`, `!=`, `<`, `<=`, `>`, `>=`, `includes`, `not includes`
- Date expressions: `today`, `today + 7d`, relative dates
- Sorting: `asc`, `desc`
- Result limiting

### 4. Recurrence System

Flexible recurring tasks with RRULE support:

**Natural Language:**
- `every day`, `every 3 days`
- `every week`, `every 2 weeks`
- `every monday`, `every weekday`
- `every month`, `every month on the 15th`
- `every year`

**"When Done" Mode:**
- `every 3 days when done` - Next occurrence based on completion date

**Features:**
- Automatic next occurrence calculation
- Preserves relative date offsets
- Handles edge cases (Feb 30 → Feb 28, leap years)
- Overdue task handling (skip vs catch-up)

### 5. Task Dashboard

Interactive dashboard with multiple views:

**Tabs:**
- **Today**: Tasks due today
- **Upcoming**: Tasks due in next 7 days
- **Overdue**: Past due tasks
- **All Tasks**: Complete task list
- **Custom Queries**: Run custom queries

**Features:**
- Inline status toggling
- Click to navigate to task block
- Sort by due date, priority, or creation date
- Visual indicators for overdue tasks
- Tag and metadata display

## Architecture

### Directory Structure

```
src/siyuan/
├── types/
│   └── TaskData.ts           # Type definitions
├── parser/
│   └── TaskSyntaxParser.ts   # Inline syntax parser
├── sync/
│   └── TaskSyncService.ts    # Attribute sync
├── query/
│   ├── QueryEngine.ts        # Query compilation
│   ├── QueryParser.ts        # Query syntax parser
│   ├── QueryOptimizer.ts     # Performance safeguards
│   └── SavedQueries.ts       # Saved query management
├── recurrence/
│   ├── RecurrenceEngine.ts   # RRULE handling
│   ├── TaskCompletionHandler.ts
│   └── TimezoneHandler.ts
├── config/
│   ├── PluginSettings.ts     # Settings schema
│   └── GlobalFilterService.ts
├── ui/
│   ├── Dashboard.svelte      # Main dashboard
│   ├── TaskList.svelte       # Task list component
│   ├── TaskItem.svelte       # Individual task
│   ├── QueryEditor.svelte    # Query input
│   └── DatePicker.svelte     # Date selection
├── api/
│   └── SiYuanAPI.ts          # API wrapper
└── index.ts                  # Plugin entry point
```

### Key Services

**SiYuanAPI** - Wrapper for SiYuan API calls:
- Block attribute management
- Block content updates
- SQL queries
- Block search

**TaskSyncService** - Bidirectional sync:
- Inline syntax ↔ Block attributes
- Conflict resolution (last-write-wins)
- Batch operations

**QueryEngine** - Task queries:
- Parse query syntax
- Compile to SiYuan SQL
- Execute with caching
- Apply global filters

**RecurrenceEngine** - Recurring tasks:
- Parse natural language rules
- Calculate next occurrences
- Handle completion-based recurrence
- Preview future occurrences

**GlobalFilterService** - Global filters:
- Exclude/include by notebook, path, tag
- Default query conditions
- SQL condition generation

## Configuration

Settings are managed through `PluginSettings.ts`:

```typescript
{
  performance: {
    queryTimeout: 5000,
    maxResults: 1000,
    cacheTimeout: 60000,
    enableCache: true
  },
  ui: {
    dateFormat: 'YYYY-MM-DD',
    showTaskCount: true,
    defaultTab: 'today',
    statusColors: { ... },
    priorityColors: { ... }
  },
  globalFilter: {
    excludedNotebooks: [],
    excludedPaths: [],
    excludedTags: [],
    includedTags: [],
    defaultConditions: ''
  },
  recurrence: {
    defaultMode: 'fixed',
    overdueHandling: 'ask',
    autoAdvanceOverdue: false
  }
}
```

## Testing

Unit tests are provided for core components:

```bash
# Run all tests
yarn test

# Run specific tests
yarn test TaskSyntaxParser
yarn test RecurrenceEngine
yarn test QueryParser
```

**Test Coverage:**
- `TaskSyntaxParser.test.ts` - Parsing and serialization
- `RecurrenceEngine.test.ts` - Recurrence calculations
- `QueryParser.test.ts` - Query parsing and validation

## Usage Examples

### Create a Task

```markdown
- [ ] Review pull request @due(tomorrow) @priority(high) @tag(#code-review)
```

### Query Tasks

```
tasks
where status = TODO
  and due <= today + 7d
  and priority <= 2
sort by due asc
limit 25
```

### Recurring Tasks

```markdown
- [ ] Weekly team meeting @recur(every monday) @due(next monday)
- [ ] Check email @recur(every day) @start(today)
- [ ] Monthly report @recur(every month on the last)
```

### Complete a Recurring Task

When you mark a recurring task as done:
1. Original task is marked as DONE with `done_date`
2. New task is created with next due date
3. Relative date offsets are preserved

## API Integration

The plugin integrates with SiYuan's Plugin API:

```typescript
class SiYuanTasksPlugin {
  async onload(): Promise<void>
  async onunload(): Promise<void>
  async onLayoutReady(): Promise<void>
  
  // Event handlers
  registerCommands()
  subscribeToEvents()
  
  // Task operations
  createTask(task: TaskData)
  updateTask(task: TaskData)
  deleteTask(blockId: string)
  toggleTaskStatus(task: TaskData)
}
```

## Performance Considerations

**Query Optimization:**
- Query timeout protection (default: 5s)
- Result limit enforcement (default: 1000)
- Query result caching (default: 60s)
- SQL query optimization

**Sync Performance:**
- Lazy attribute sync (on edit)
- Batch operations support
- Conflict resolution with timestamps

**UI Performance:**
- Virtual scrolling for large lists
- Debounced search/filter
- Lazy component loading

## Security

**No Code Copying:**
- Original implementation, concepts translated
- No Obsidian Tasks code directly used

**Data Safety:**
- All data stored in SiYuan blocks
- No external dependencies
- Local storage for settings
- No network calls except SiYuan API

**Validation:**
- Input sanitization for queries
- SQL injection prevention
- Safe attribute handling

## Contributing

This is a reference implementation. Key areas for enhancement:

1. **Additional Query Operators**: More date/time operators
2. **Dependency Visualization**: Graphical task dependencies
3. **Bulk Operations**: Multi-task editing
4. **Templates**: Task templates and quick-add
5. **Statistics**: Task completion analytics
6. **Export**: Export to various formats

## License

MIT License - See main project LICENSE file

## Credits

Inspired by [Obsidian Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) by Clare Macrae and contributors.

Designed specifically for [SiYuan](https://github.com/siyuan-note/siyuan) by the SiYuan team.
