import { useState, useMemo } from 'react';
import { formatDueDate, isOverdue } from '../utils/dateUtils';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconClock,
  IconCheck,
  IconFilter,
} from './Icons';

export default function TasksView({
  tasks = [],
  onOpenNewTask,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
  initialFilter = 'all',
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter); // 'all' | 'pending' | 'completed' | 'overdue'
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all' | 'High' | 'Medium' | 'Low'
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate'); // 'dueDate' | 'priority' | 'newest'
  const [deletingId, setDeletingId] = useState(null);

  // Extract unique subjects for dropdown filter
  const uniqueSubjects = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => {
      if (t.subject && t.subject.trim()) {
        set.add(t.subject.trim());
      }
    });
    return Array.from(set).sort();
  }, [tasks]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (task.title || '').toLowerCase().includes(q);
          const matchSubject = (task.subject || '').toLowerCase().includes(q);
          const matchDesc = (task.description || '').toLowerCase().includes(q);
          if (!matchTitle && !matchSubject && !matchDesc) return false;
        }

        // Status filter
        if (statusFilter === 'pending' && task.completed) return false;
        if (statusFilter === 'completed' && !task.completed) return false;
        if (statusFilter === 'overdue') {
          if (task.completed || !isOverdue(task.dueDate, task.completed)) return false;
        }

        // Priority filter
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

        // Subject filter
        if (subjectFilter !== 'all' && (task.subject || '') !== subjectFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'dueDate') {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        } else if (sortBy === 'priority') {
          const weight = { High: 3, Medium: 2, Low: 1 };
          return (weight[b.priority] || 0) - (weight[a.priority] || 0);
        } else {
          // newest
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
      });
  }, [tasks, searchQuery, statusFilter, priorityFilter, subjectFilter, sortBy]);

  function resetFilters() {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSubjectFilter('all');
  }

  async function handleDelete(task) {
    if (window.confirm(`Are you sure you want to remove "${task.title}"?`)) {
      try {
        setDeletingId(task._id);
        await onDeleteTask(task._id);
      } finally {
        setDeletingId(null);
      }
    }
  }

  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (priorityFilter !== 'all' ? 1 : 0) +
    (subjectFilter !== 'all' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <div className="tasks-view">
      {/* Header */}
      <header className="tasks-header">
        <div>
          <span className="editorial-date-stamp">Workspace Catalog</span>
          <h1 className="tasks-title">Assignment & Task Registry</h1>
          <p className="tasks-subtitle">
            Catalogued syllabus goals, homework, lab evaluations, and project milestones.
          </p>
        </div>
        <div className="tasks-header-actions">
          <button type="button" className="btn-primary" onClick={onOpenNewTask}>
            <IconPlus size={16} />
            <span>Add Task</span>
          </button>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <section className="filter-toolbar" aria-label="Task filters">
        <div className="search-input-wrapper">
          <span className="search-icon">
            <IconSearch size={16} />
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by title, subject, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>

        <div className="filter-controls-row">
          {/* Status Tabs */}
          <div className="filter-pill-group" role="tablist" aria-label="Filter by status">
            {[
              { id: 'all', label: 'All Tasks' },
              { id: 'pending', label: 'Pending' },
              { id: 'completed', label: 'Completed' },
              { id: 'overdue', label: 'Overdue' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.id}
                className={`filter-pill-btn ${statusFilter === tab.id ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="filter-dropdowns">
            {/* Priority Selector */}
            <div className="select-wrapper">
              <label htmlFor="filter-priority" className="sr-only">Priority</label>
              <select
                id="filter-priority"
                className="filter-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">Priority: All</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            {/* Subject Selector */}
            {uniqueSubjects.length > 0 && (
              <div className="select-wrapper">
                <label htmlFor="filter-subject" className="sr-only">Subject</label>
                <select
                  id="filter-subject"
                  className="filter-select"
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                >
                  <option value="all">Subject: All</option>
                  {uniqueSubjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Order Selector */}
            <div className="select-wrapper">
              <label htmlFor="filter-sort" className="sr-only">Sort By</label>
              <select
                id="filter-sort"
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="dueDate">Sort: Due Date</option>
                <option value="priority">Sort: Priority</option>
                <option value="newest">Sort: Newly Created</option>
              </select>
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                className="btn-link btn-reset-filters"
                onClick={resetFilters}
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Task Count Summary */}
      <div className="task-count-row">
        <span>
          Showing <strong>{filteredTasks.length}</strong> of {tasks.length} total tasks
        </span>
      </div>

      {/* Task List Container */}
      <div className="task-list-container">
        {filteredTasks.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon">
              <IconFilter size={24} />
            </div>
            <h3 className="empty-state-title">
              {tasks.length === 0
                ? 'No study tasks recorded yet'
                : 'No tasks match current filters'}
            </h3>
            <p className="empty-state-desc">
              {tasks.length === 0
                ? 'Begin by creating your first academic assignment, reading goal, or lab preparation.'
                : 'Try adjusting your search keywords, priority level, or status filters.'}
            </p>
            {tasks.length === 0 ? (
              <button type="button" className="btn-primary" onClick={onOpenNewTask}>
                <IconPlus size={16} />
                <span>Create First Task</span>
              </button>
            ) : (
              <button type="button" className="btn-secondary" onClick={resetFilters}>
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          <div className="task-card-list">
            {filteredTasks.map((task) => {
              const dueInfo = formatDueDate(task.dueDate, task.completed);
              const isDeleting = deletingId === task._id;

              return (
                <article
                  key={task._id}
                  className={`task-row-card ${task.completed ? 'task-is-completed' : ''} ${
                    dueInfo.isOverdue ? 'task-is-overdue' : ''
                  }`}
                >
                  {/* Complete Checkbox */}
                  <div className="task-col-check">
                    <button
                      type="button"
                      className={`checkbox-toggle ${task.completed ? 'checked' : ''}`}
                      onClick={() => onToggleComplete(task)}
                      aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                      title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      <span className="checkbox-box">
                        {task.completed && <IconCheck size={13} />}
                      </span>
                    </button>
                  </div>

                  {/* Task Core Content */}
                  <div className="task-col-content">
                    <div className="task-row-top">
                      <h3 className="task-item-title">{task.title}</h3>
                      <div className="task-tag-group">
                        {task.subject && (
                          <span className="pill-subject">{task.subject}</span>
                        )}
                        <span className={`pill-priority pill-${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>

                    {task.description && (
                      <p className="task-item-desc">{task.description}</p>
                    )}

                    <div className="task-item-footer">
                      <div className="task-due-badge-wrapper">
                        {task.dueDate ? (
                          <span
                            className={`badge-due ${
                              task.completed
                                ? 'due-completed'
                                : dueInfo.isOverdue
                                ? 'due-overdue'
                                : dueInfo.isSoon
                                ? 'due-soon'
                                : 'due-normal'
                            }`}
                          >
                            <IconClock size={12} />
                            <span>{dueInfo.label}</span>
                          </span>
                        ) : (
                          <span className="badge-due due-none">
                            <span>No deadline</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="task-col-actions">
                    <button
                      type="button"
                      className="btn-icon-action"
                      onClick={() => onEditTask(task)}
                      title="Edit task"
                      aria-label={`Edit ${task.title}`}
                    >
                      <IconEdit size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon-action btn-icon-delete"
                      onClick={() => handleDelete(task)}
                      disabled={isDeleting}
                      title="Delete task"
                      aria-label={`Delete ${task.title}`}
                    >
                      <IconTrash size={15} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
