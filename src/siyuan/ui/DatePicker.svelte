<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let selectedDate: string = '';
  export let minDate: string = '';
  export let maxDate: string = '';

  const dispatch = createEventDispatcher();

  let isOpen: boolean = false;
  let currentMonth: Date = new Date();

  $: if (selectedDate) {
    currentMonth = new Date(selectedDate);
  }

  function togglePicker() {
    isOpen = !isOpen;
  }

  function handleDateSelect(dateStr: string) {
    selectedDate = dateStr;
    dispatch('select', dateStr);
    isOpen = false;
  }

  function formatDisplayDate(dateStr: string): string {
    if (!dateStr) return 'Select date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  function getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  function getFirstDayOfMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }

  function generateCalendar(): Array<{ date: string; day: number; isCurrentMonth: boolean }> {
    const days: Array<{ date: string; day: number; isCurrentMonth: boolean }> = [];
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);

    // Add previous month days
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const dateStr = formatDate(new Date(prevMonth.getFullYear(), prevMonth.getMonth(), day));
      days.push({ date: dateStr, day, isCurrentMonth: false });
    }

    // Add current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
      days.push({ date: dateStr, day, isCurrentMonth: true });
    }

    // Add next month days to fill grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day);
      const dateStr = formatDate(nextMonth);
      days.push({ date: dateStr, day, isCurrentMonth: false });
    }

    return days;
  }

  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function previousMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  }

  function nextMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }

  function isToday(dateStr: string): boolean {
    return dateStr === formatDate(new Date());
  }

  function isSelected(dateStr: string): boolean {
    return dateStr === selectedDate;
  }

  $: calendar = generateCalendar();
  $: monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
</script>

<div class="date-picker">
  <button class="date-input" on:click={togglePicker}>
    {formatDisplayDate(selectedDate)}
  </button>

  {#if isOpen}
    <div class="picker-dropdown">
      <div class="picker-header">
        <button class="nav-button" on:click={previousMonth}>‹</button>
        <span class="month-year">{monthYear}</span>
        <button class="nav-button" on:click={nextMonth}>›</button>
      </div>

      <div class="calendar">
        <div class="weekdays">
          <div class="weekday">Su</div>
          <div class="weekday">Mo</div>
          <div class="weekday">Tu</div>
          <div class="weekday">We</div>
          <div class="weekday">Th</div>
          <div class="weekday">Fr</div>
          <div class="weekday">Sa</div>
        </div>

        <div class="days">
          {#each calendar as { date, day, isCurrentMonth }}
            <button
              class="day"
              class:other-month={!isCurrentMonth}
              class:today={isToday(date)}
              class:selected={isSelected(date)}
              on:click={() => handleDateSelect(date)}
            >
              {day}
            </button>
          {/each}
        </div>
      </div>

      <div class="quick-actions">
        <button on:click={() => handleDateSelect(formatDate(new Date()))}>Today</button>
        <button on:click={() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          handleDateSelect(formatDate(tomorrow));
        }}>Tomorrow</button>
        <button on:click={() => handleDateSelect('')}>Clear</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .date-picker {
    position: relative;
    display: inline-block;
  }

  .date-input {
    padding: 8px 12px;
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    color: var(--b3-theme-on-surface);
  }

  .date-input:hover {
    background: var(--b3-theme-surface-lighter);
  }

  .picker-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    padding: 12px;
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
  }

  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .nav-button {
    padding: 4px 8px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    color: var(--b3-theme-on-surface);
  }

  .nav-button:hover {
    background: var(--b3-theme-surface-lighter);
    border-radius: 3px;
  }

  .month-year {
    font-weight: 600;
    font-size: 14px;
  }

  .calendar {
    min-width: 280px;
  }

  .weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 8px;
  }

  .weekday {
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
    opacity: 0.7;
  }

  .days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  .day {
    aspect-ratio: 1;
    padding: 8px;
    background: none;
    border: 1px solid transparent;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
    color: var(--b3-theme-on-surface);
    transition: all 0.2s;
  }

  .day:hover {
    background: var(--b3-theme-surface-lighter);
  }

  .day.other-month {
    opacity: 0.4;
  }

  .day.today {
    border-color: var(--b3-theme-primary);
  }

  .day.selected {
    background: var(--b3-theme-primary);
    color: var(--b3-theme-on-primary);
  }

  .quick-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--b3-border-color);
  }

  .quick-actions button {
    flex: 1;
    padding: 6px;
    background: var(--b3-theme-surface-lighter);
    border: 1px solid var(--b3-border-color);
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
  }

  .quick-actions button:hover {
    background: var(--b3-theme-primary-lighter);
  }
</style>
