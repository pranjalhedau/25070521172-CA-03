import { useState, useMemo } from 'react';
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconEdit,
} from './Icons';
import { isOverdue, formatDueDate } from '../utils/dateUtils';

// Helper to format Date object into YYYY-MM-DD local string
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Get the days of a month grid (including padding from prev/next months to form full 7-day rows)
function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDay.getDay(); // 0 = Sun
  const totalDays = lastDay.getDate();

  const days = [];

  // Prev month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({ date: d, isCurrentMonth: false, key: toDateKey(d) });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i);
    days.push({ date: d, isCurrentMonth: true, key: toDateKey(d) });
  }

  // Next month padding to make complete weeks
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false, key: toDateKey(d) });
    }
  }

  return days;
}

// Get days of the current week (Sun-Sat)
function getWeekDays(referenceDate) {
  const curr = new Date(referenceDate);
  const dayOfWeek = curr.getDay();
  const startOfWeek = new Date(curr);
  startOfWeek.setDate(curr.getDate() - dayOfWeek);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push({ date: d, key: toDateKey(d) });
  }
  return days;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PlannerView({
  tasks = [],
  onOpenNewTask,
  onEditTask,
  onToggleComplete,
}) {
  const todayKey = toDateKey(new Date());

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [calendarView, setCalendarView] = useState('month'); // 'month' | 'week'
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  // Group tasks by local due date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const d = new Date(t.dueDate);
      if (isNaN(d.getTime())) return;
      const key = toDateKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  function handlePrev() {
    if (calendarView === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(currentDate.getDate() - 7);
      setCurrentDate(prevWeek);
    }
  }

  function handleNext() {
    if (calendarView === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextWeek);
    }
  }

  function handleToday() {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateKey(toDateKey(now));
  }

  // Selected date tasks
  const selectedDateTasks = tasksByDate[selectedDateKey] || [];

  // Parse selected date for display
  const selectedDateObj = useMemo(() => {
    const parts = selectedDateKey.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }, [selectedDateKey]);

  const selectedDateLabel = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Month grid
  const monthDays = useMemo(() => getMonthGrid(year, month), [year, month]);

  // Week days
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  // View title
  const viewTitle = useMemo(() => {
    if (calendarView === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      const first = weekDays[0].date;
      const last = weekDays[6].date;
      return `${first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  }, [calendarView, currentDate, weekDays]);

  return (
    <div className="planner-view">
      {/* Header */}
      <header className="planner-header">
        <div>
          <span className="editorial-date-stamp">Academic Schedule</span>
          <h1 className="planner-title">Study Planner & Calendar</h1>
          <p className="planner-subtitle">
            Visualize assignment deadlines, exam preparations, and scheduled milestones.
          </p>
        </div>

        <div className="planner-header-actions">
          <div className="view-mode-toggle" role="tablist" aria-label="Calendar view mode">
            <button
              type="button"
              className={`view-toggle-btn ${calendarView === 'month' ? 'active' : ''}`}
              onClick={() => setCalendarView('month')}
            >
              Month View
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${calendarView === 'week' ? 'active' : ''}`}
              onClick={() => setCalendarView('week')}
            >
              Week View
            </button>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={() => onOpenNewTask({ dueDate: selectedDateKey })}
          >
            <IconPlus size={16} />
            <span>Add Task for Date</span>
          </button>
        </div>
      </header>

      {/* Calendar Controls & Navigation Bar */}
      <div className="planner-controls-bar">
        <div className="planner-nav-group">
          <button
            type="button"
            className="btn-calendar-nav"
            onClick={handlePrev}
            aria-label="Previous period"
            title="Previous"
          >
            <IconChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="btn-calendar-nav"
            onClick={handleNext}
            aria-label="Next period"
            title="Next"
          >
            <IconChevronRight size={16} />
          </button>
          <button
            type="button"
            className="btn-secondary btn-sm btn-today"
            onClick={handleToday}
          >
            Today
          </button>
          <h2 className="calendar-current-title">{viewTitle}</h2>
        </div>

        {/* Legend */}
        <div className="calendar-legend">
          <span className="legend-item">
            <span className="legend-dot dot-pending" /> Active / Due
          </span>
          <span className="legend-item">
            <span className="legend-dot dot-overdue" /> Overdue
          </span>
          <span className="legend-item">
            <span className="legend-dot dot-completed" /> Completed
          </span>
        </div>
      </div>

      {/* Main Calendar + Selected Date Inspector */}
      <div className="planner-layout-grid">
        {/* Calendar Area */}
        <div className="calendar-card">
          {calendarView === 'month' ? (
            <div className="month-grid-container">
              {/* Day Headers */}
              <div className="month-weekdays-header">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="weekday-header-cell">
                    {day}
                  </div>
                ))}
              </div>

              {/* Month Day Cells */}
              <div className="month-days-grid">
                {monthDays.map((cell) => {
                  const dayTasks = tasksByDate[cell.key] || [];
                  const isToday = cell.key === todayKey;
                  const isSelected = cell.key === selectedDateKey;

                  return (
                    <div
                      key={cell.key}
                      className={`calendar-day-cell ${
                        !cell.isCurrentMonth ? 'day-other-month' : ''
                      } ${isToday ? 'day-today' : ''} ${
                        isSelected ? 'day-selected' : ''
                      }`}
                      onClick={() => setSelectedDateKey(cell.key)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedDateKey(cell.key);
                        }
                      }}
                      aria-label={`${cell.date.toDateString()}, ${dayTasks.length} tasks`}
                    >
                      <div className="day-cell-top">
                        <span className="day-number">{cell.date.getDate()}</span>
                        {isToday && <span className="today-badge">Today</span>}
                      </div>

                      {/* Day Tasks Pills */}
                      <div className="day-tasks-container">
                        {dayTasks.slice(0, 3).map((task) => {
                          const overdue = !task.completed && isOverdue(task.dueDate, task.completed);
                          return (
                            <div
                              key={task._id}
                              className={`calendar-task-chip ${
                                task.completed
                                  ? 'chip-completed'
                                  : overdue
                                  ? 'chip-overdue'
                                  : 'chip-pending'
                              }`}
                              title={`${task.title} (${task.priority} Priority)`}
                            >
                              <span className="chip-status-glyph">
                                {task.completed ? '✓' : overdue ? '!' : '•'}
                              </span>
                              <span className="chip-title-text">{task.title}</span>
                            </div>
                          );
                        })}
                        {dayTasks.length > 3 && (
                          <span className="day-tasks-overflow">
                            +{dayTasks.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Week View */
            <div className="week-grid-container">
              <div className="week-columns-grid">
                {weekDays.map((col) => {
                  const dayTasks = tasksByDate[col.key] || [];
                  const isToday = col.key === todayKey;
                  const isSelected = col.key === selectedDateKey;

                  return (
                    <div
                      key={col.key}
                      className={`week-col-card ${isToday ? 'week-col-today' : ''} ${
                        isSelected ? 'week-col-selected' : ''
                      }`}
                      onClick={() => setSelectedDateKey(col.key)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="week-col-header">
                        <span className="week-day-name">
                          {col.date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="week-day-num">{col.date.getDate()}</span>
                        {isToday && <span className="today-badge-sm">Today</span>}
                      </div>

                      <div className="week-col-tasks">
                        {dayTasks.length === 0 ? (
                          <div className="week-col-empty">
                            <span>No deadlines</span>
                          </div>
                        ) : (
                          dayTasks.map((task) => {
                            const overdue = !task.completed && isOverdue(task.dueDate, task.completed);
                            return (
                              <div
                                key={task._id}
                                className={`week-task-item ${
                                  task.completed
                                    ? 'week-task-completed'
                                    : overdue
                                    ? 'week-task-overdue'
                                    : 'week-task-pending'
                                }`}
                              >
                                <div className="week-task-title">{task.title}</div>
                                {task.subject && (
                                  <span className="week-task-subject">{task.subject}</span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected Date Inspector Sidebar Panel */}
        <aside className="selected-date-inspector">
          <div className="inspector-card">
            <div className="inspector-header">
              <div className="inspector-title-wrap">
                <IconCalendar size={18} className="inspector-icon" />
                <div>
                  <span className="inspector-eyebrow">Selected Date</span>
                  <h3 className="inspector-date-label">{selectedDateLabel}</h3>
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => onOpenNewTask({ dueDate: selectedDateKey })}
                title="Schedule a new task for this date"
              >
                <IconPlus size={14} />
                <span>Add Task</span>
              </button>
            </div>

            <div className="inspector-task-list">
              {selectedDateTasks.length === 0 ? (
                <div className="inspector-empty">
                  <p className="empty-title-sm">No tasks due on this date</p>
                  <p className="empty-desc-sm">
                    Keep your study schedule clear or add assignments for this day.
                  </p>
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={() => onOpenNewTask({ dueDate: selectedDateKey })}
                  >
                    <IconPlus size={14} />
                    <span>Schedule Task</span>
                  </button>
                </div>
              ) : (
                selectedDateTasks.map((task) => {
                  const dueInfo = formatDueDate(task.dueDate, task.completed);
                  return (
                    <div
                      key={task._id}
                      className={`inspector-task-row ${
                        task.completed ? 'task-done' : ''
                      }`}
                    >
                      <button
                        type="button"
                        className={`checkbox-toggle ${task.completed ? 'checked' : ''}`}
                        onClick={() => onToggleComplete(task)}
                        title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                        aria-label={`Toggle completion for ${task.title}`}
                      >
                        <span className="checkbox-box">
                          {task.completed && <IconCheck size={12} />}
                        </span>
                      </button>

                      <div className="inspector-task-info">
                        <span className="inspector-task-title">{task.title}</span>
                        <div className="inspector-task-tags">
                          {task.subject && (
                            <span className="pill-subject">{task.subject}</span>
                          )}
                          <span
                            className={`pill-priority pill-${task.priority.toLowerCase()}`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`badge-due ${
                              task.completed
                                ? 'due-completed'
                                : dueInfo.isOverdue
                                ? 'due-overdue'
                                : 'due-normal'
                            }`}
                          >
                            {dueInfo.isOverdue ? (
                              <IconAlertCircle size={11} />
                            ) : (
                              <IconClock size={11} />
                            )}
                            <span>{dueInfo.label}</span>
                          </span>
                        </div>
                        {task.description && (
                          <p className="inspector-task-notes">{task.description}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        className="btn-icon-action"
                        onClick={() => onEditTask(task)}
                        title="Edit task"
                        aria-label={`Edit ${task.title}`}
                      >
                        <IconEdit size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
