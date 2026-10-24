import { formatEditorialDate, formatDueDate, isOverdue, isDueSoon } from '../utils/dateUtils';
import { IconClock, IconAlertCircle, IconPlus, IconBook, IconCheckCircle } from './Icons';

export default function DashboardView({
  user,
  tasks = [],
  onOpenNewTask,
  onToggleComplete,
  onEditTask,
  onNavigateToTasks,
}) {
  // Derive real statistics from MongoDB tasks
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const overdueTasks = tasks.filter((t) => isOverdue(t.dueDate, t.completed)).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Derive urgent deadlines: overdue first, then due soon, then upcoming
  const urgentTasks = tasks
    .filter((t) => !t.completed && (isOverdue(t.dueDate, t.completed) || isDueSoon(t.dueDate, t.completed)))
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

  // Upcoming non-overdue tasks
  const upcomingTasks = tasks
    .filter((t) => !t.completed && t.dueDate && !isOverdue(t.dueDate, t.completed))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  // Group pending tasks by subject
  const subjectMap = {};
  tasks.forEach((t) => {
    const s = t.subject || 'General / Uncategorized';
    if (!subjectMap[s]) subjectMap[s] = { total: 0, completed: 0, pending: 0 };
    subjectMap[s].total += 1;
    if (t.completed) subjectMap[s].completed += 1;
    else subjectMap[s].pending += 1;
  });
  const subjectsList = Object.entries(subjectMap).sort((a, b) => b[1].pending - a[1].pending);

  return (
    <div className="dashboard-view">
      {/* Editorial Welcome Header */}
      <header className="dashboard-header">
        <div>
          <span className="editorial-date-stamp">{formatEditorialDate()}</span>
          <h1 className="dashboard-title">
            Welcome back, {user?.name || 'Scholar'}
          </h1>
          <p className="dashboard-subtitle">
            {pendingTasks === 0 && totalTasks > 0
              ? 'All assignments and study goals are fully completed. Well done!'
              : pendingTasks === 0
              ? 'Your semester workspace is clean. Create your first task to start organizing.'
              : `You have ${pendingTasks} active ${pendingTasks === 1 ? 'task' : 'tasks'}${
                  overdueTasks > 0 ? ` (${overdueTasks} overdue)` : ''
                }. Keep steady pace.`}
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button type="button" className="btn-primary" onClick={onOpenNewTask}>
            <IconPlus size={16} />
            <span>New Task</span>
          </button>
        </div>
      </header>

      {/* 4 Restrained Editorial Metric Cards */}
      <section className="stats-grid" aria-label="Task Statistics">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Workload</span>
            <span className="stat-icon-wrapper">
              <IconBook size={18} />
            </span>
          </div>
          <div className="stat-value">{totalTasks}</div>
          <div className="stat-meta">Recorded assignments & goals</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Pending Tasks</span>
            <span className="stat-icon-wrapper">
              <IconClock size={18} />
            </span>
          </div>
          <div className="stat-value stat-pending">{pendingTasks}</div>
          <div className="stat-meta">Currently in progress</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Completed</span>
            <span className="stat-icon-wrapper">
              <IconCheckCircle size={18} />
            </span>
          </div>
          <div className="stat-value stat-completed">{completedTasks}</div>
          <div className="stat-meta">
            <div className="completion-bar">
              <div
                className="completion-fill"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span>{completionRate}% completion rate</span>
          </div>
        </div>

        <div className={`stat-card ${overdueTasks > 0 ? 'stat-card-alert' : ''}`}>
          <div className="stat-card-header">
            <span className="stat-label">Overdue</span>
            <span className="stat-icon-wrapper">
              <IconAlertCircle size={18} />
            </span>
          </div>
          <div className={`stat-value ${overdueTasks > 0 ? 'stat-overdue' : ''}`}>
            {overdueTasks}
          </div>
          <div className="stat-meta">
            {overdueTasks > 0 ? 'Requires immediate focus' : 'No overdue assignments'}
          </div>
        </div>
      </section>

      {/* Main Content Split: Urgent / Radar on Left, Subjects on Right */}
      <div className="dashboard-columns">
        <div className="dashboard-main-col">
          {/* Urgent & Overdue Alert Section */}
          {urgentTasks.length > 0 && (
            <div className="urgent-banner-card">
              <div className="urgent-banner-header">
                <div className="urgent-banner-title">
                  <IconAlertCircle size={18} />
                  <span>Immediate Deadlines ({urgentTasks.length})</span>
                </div>
                <span className="urgent-banner-hint">Prioritize these items today</span>
              </div>
              <div className="urgent-task-list">
                {urgentTasks.map((t) => {
                  const dueInfo = formatDueDate(t.dueDate, t.completed);
                  return (
                    <div key={t._id} className="urgent-task-row">
                      <button
                        type="button"
                        className="checkbox-toggle"
                        onClick={() => onToggleComplete(t)}
                        title="Mark complete"
                        aria-label={`Mark ${t.title} complete`}
                      >
                        <span className="checkbox-box" />
                      </button>
                      <div className="urgent-task-info">
                        <span className="urgent-task-title">{t.title}</span>
                        <div className="urgent-task-tags">
                          {t.subject && <span className="pill-subject">{t.subject}</span>}
                          <span className={`pill-priority pill-${t.priority.toLowerCase()}`}>
                            {t.priority}
                          </span>
                        </div>
                      </div>
                      <div className="urgent-task-due">
                        <span className={`badge-due ${dueInfo.isOverdue ? 'due-overdue' : 'due-soon'}`}>
                          {dueInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming Schedule Card */}
          <div className="content-card">
            <div className="content-card-header">
              <div>
                <h2 className="content-card-title">Upcoming Deadlines</h2>
                <p className="content-card-subtitle">Upcoming coursework sorted chronologically</p>
              </div>
              <button
                type="button"
                className="btn-link"
                onClick={() => onNavigateToTasks('all')}
              >
                View all tasks &rarr;
              </button>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="empty-state-editorial">
                <p className="empty-title">No upcoming deadlines scheduled</p>
                <p className="empty-desc">
                  You have no pending deadlines due in the near future.
                </p>
                <button type="button" className="btn-secondary btn-sm" onClick={onOpenNewTask}>
                  Schedule a task
                </button>
              </div>
            ) : (
              <div className="editorial-task-list">
                {upcomingTasks.map((task) => {
                  const dueInfo = formatDueDate(task.dueDate, task.completed);
                  return (
                    <div key={task._id} className="editorial-task-item">
                      <button
                        type="button"
                        className="checkbox-toggle"
                        onClick={() => onToggleComplete(task)}
                        title="Mark complete"
                        aria-label={`Mark ${task.title} complete`}
                      >
                        <span className="checkbox-box" />
                      </button>
                      <div className="editorial-task-body">
                        <div className="editorial-task-headline">
                          <span className="task-title-text">{task.title}</span>
                          <span className={`pill-priority pill-${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.description && (
                          <p className="editorial-task-desc">{task.description}</p>
                        )}
                        <div className="editorial-task-meta">
                          {task.subject && (
                            <span className="pill-subject">{task.subject}</span>
                          )}
                          <span className="task-due-text">
                            <IconClock size={13} />
                            <span>{dueInfo.label}</span>
                          </span>
                        </div>
                      </div>
                      <div className="editorial-task-actions">
                        <button
                          type="button"
                          className="btn-icon-subtle"
                          onClick={() => onEditTask(task)}
                          title="Edit task"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Course Distribution & Study Focus */}
        <aside className="dashboard-side-col">
          <div className="content-card">
            <h2 className="content-card-title">Subject Workload</h2>
            <p className="content-card-subtitle">Active distribution across your courses</p>

            {subjectsList.length === 0 ? (
              <p className="empty-subtext">No subjects cataloged yet.</p>
            ) : (
              <div className="subject-list">
                {subjectsList.map(([subject, stats]) => (
                  <div key={subject} className="subject-item">
                    <div className="subject-info">
                      <span className="subject-name">{subject}</span>
                      <span className="subject-counts">
                        {stats.pending} pending / {stats.total} total
                      </span>
                    </div>
                    <div className="subject-bar">
                      <div
                        className="subject-bar-fill"
                        style={{
                          width: `${Math.round((stats.completed / stats.total) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="study-quote-card">
            <span className="quote-badge">Academic Rhythm</span>
            <p className="quote-text">
              &ldquo;Disciplined pacing consistently outperforms last-minute cramming. Break large syllabus units into distinct daily sessions.&rdquo;
            </p>
            <span className="quote-author">StudyFlow Academic Guidelines</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
