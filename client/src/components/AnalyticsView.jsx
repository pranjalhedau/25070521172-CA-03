import { useMemo } from 'react';
import {
  IconBarChart,
  IconCheckCircle,
  IconClock,
  IconAlertCircle,
  IconBook,
  IconTarget,
  IconPlus,
} from './Icons';
import { isOverdue } from '../utils/dateUtils';

export default function AnalyticsView({ tasks = [], onOpenNewTask }) {
  // Derive core statistics from actual tasks
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = tasks.filter((t) => !t.completed).length;
    const overdue = tasks.filter((t) => !t.completed && isOverdue(t.dueDate, t.completed)).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Priority breakdown
    const priorityCounts = { High: 0, Medium: 0, Low: 0 };
    tasks.forEach((t) => {
      if (priorityCounts[t.priority] !== undefined) {
        priorityCounts[t.priority]++;
      }
    });

    // Subject breakdown
    const subjectMap = {};
    tasks.forEach((t) => {
      const s = t.subject && t.subject.trim() ? t.subject.trim() : 'General / Other';
      if (!subjectMap[s]) {
        subjectMap[s] = { total: 0, completed: 0, pending: 0 };
      }
      subjectMap[s].total++;
      if (t.completed) subjectMap[s].completed++;
      else subjectMap[s].pending++;
    });

    const subjectList = Object.entries(subjectMap).sort((a, b) => b[1].total - a[1].total);

    // Weekly Distribution: Next 7 days workload
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dayName = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = d.toISOString().split('T')[0];

      // Count tasks due on this day
      let dayTotal = 0;
      let dayCompleted = 0;
      tasks.forEach((t) => {
        if (!t.dueDate) return;
        const taskDateStr = new Date(t.dueDate).toISOString().split('T')[0];
        if (taskDateStr === dateStr) {
          dayTotal++;
          if (t.completed) dayCompleted++;
        }
      });

      weekDays.push({
        label: dayName,
        date: d.getDate(),
        total: dayTotal,
        completed: dayCompleted,
        pending: dayTotal - dayCompleted,
      });
    }

    const maxDayTasks = Math.max(...weekDays.map((w) => w.total), 1);

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate,
      priorityCounts,
      subjectList,
      weekDays,
      maxDayTasks,
    };
  }, [tasks]);

  // Empty state when user has zero tasks recorded
  if (tasks.length === 0) {
    return (
      <div className="analytics-view">
        <header className="analytics-header">
          <div>
            <span className="editorial-date-stamp">Performance Metrics</span>
            <h1 className="analytics-title">Study Analytics</h1>
            <p className="analytics-subtitle">
              Academic progress reports, workload velocity, and curriculum completion.
            </p>
          </div>
        </header>

        <div className="empty-state-card analytics-empty-card">
          <div className="empty-state-icon">
            <IconBarChart size={24} />
          </div>
          <h3 className="empty-state-title">No Study Data to Analyze Yet</h3>
          <p className="empty-state-desc">
            Once you add assignments and study goals, StudyFlow will generate real-time performance analytics, subject velocity, and weekly charts.
          </p>
          <button type="button" className="btn-primary" onClick={() => onOpenNewTask()}>
            <IconPlus size={16} />
            <span>Create Your First Task</span>
          </button>
        </div>
      </div>
    );
  }

  // Calculate SVG Pie/Donut Chart parameters
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.completionRate / 100) * circumference;

  return (
    <div className="analytics-view">
      {/* Header */}
      <header className="analytics-header">
        <div>
          <span className="editorial-date-stamp">Performance Metrics</span>
          <h1 className="analytics-title">Study Analytics & Workload</h1>
          <p className="analytics-subtitle">
            Curriculum completion rate, subject distribution, and upcoming weekly timeline.
          </p>
        </div>
      </header>

      {/* 4 Primary Metric Cards */}
      <section className="stats-grid" aria-label="Academic summary">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Workload</span>
            <span className="stat-icon-wrapper">
              <IconBook size={18} />
            </span>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-meta">Recorded assignments across terms</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Pending Active</span>
            <span className="stat-icon-wrapper">
              <IconClock size={18} />
            </span>
          </div>
          <div className="stat-value stat-pending">{stats.pending}</div>
          <div className="stat-meta">Awaiting completion</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Completed</span>
            <span className="stat-icon-wrapper">
              <IconCheckCircle size={18} />
            </span>
          </div>
          <div className="stat-value stat-completed">{stats.completed}</div>
          <div className="stat-meta">Submitted or finished goals</div>
        </div>

        <div className={`stat-card ${stats.overdue > 0 ? 'stat-card-alert' : ''}`}>
          <div className="stat-card-header">
            <span className="stat-label">Overdue</span>
            <span className="stat-icon-wrapper">
              <IconAlertCircle size={18} />
            </span>
          </div>
          <div className={`stat-value ${stats.overdue > 0 ? 'stat-overdue' : ''}`}>
            {stats.overdue}
          </div>
          <div className="stat-meta">
            {stats.overdue > 0 ? 'Requires priority submission' : 'No past due assignments'}
          </div>
        </div>
      </section>

      {/* Main Charts Grid */}
      <div className="analytics-grid-two">
        {/* Completion Donut & Velocity Card */}
        <div className="content-card analytics-chart-card">
          <div className="content-card-header">
            <div>
              <h2 className="content-card-title">Completion Ratio</h2>
              <p className="content-card-subtitle">Overall academic progress toward completion</p>
            </div>
            <span className="analytics-badge-rate">{stats.completionRate}% Done</span>
          </div>

          <div className="completion-ring-layout">
            {/* SVG Donut Ring */}
            <div className="svg-ring-container">
              <svg width="170" height="170" viewBox="0 0 170 170" className="donut-svg">
                {/* Background Ring */}
                <circle
                  cx="85"
                  cy="85"
                  r={radius}
                  className="donut-bg-ring"
                  strokeWidth="14"
                  fill="none"
                />
                {/* Foreground Progress Ring */}
                <circle
                  cx="85"
                  cy="85"
                  r={radius}
                  className="donut-fg-ring"
                  strokeWidth="14"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 85 85)"
                />
                {/* Center Percentage Text */}
                <text x="85" y="80" textAnchor="middle" className="donut-center-pct">
                  {stats.completionRate}%
                </text>
                <text x="85" y="100" textAnchor="middle" className="donut-center-sub">
                  COMPLETED
                </text>
              </svg>
            </div>

            {/* Breakdown Legend */}
            <div className="ring-legend-list">
              <div className="ring-legend-item">
                <span className="legend-indicator ind-finished" />
                <div className="legend-text-col">
                  <strong>{stats.completed} Tasks Finished</strong>
                  <span>{stats.completionRate}% of catalog completed</span>
                </div>
              </div>

              <div className="ring-legend-item">
                <span className="legend-indicator ind-pending" />
                <div className="legend-text-col">
                  <strong>{stats.pending} Tasks In Progress</strong>
                  <span>{100 - stats.completionRate}% remaining workload</span>
                </div>
              </div>

              {stats.overdue > 0 && (
                <div className="ring-legend-item">
                  <span className="legend-indicator ind-overdue" />
                  <div className="legend-text-col">
                    <strong className="text-terracotta">{stats.overdue} Past Deadline</strong>
                    <span>Needs immediate recovery</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Priority Balance Card */}
        <div className="content-card analytics-chart-card">
          <div className="content-card-header">
            <div>
              <h2 className="content-card-title">Priority Distribution</h2>
              <p className="content-card-subtitle">Urgency breakdown of active catalog</p>
            </div>
            <span className="analytics-badge-icon">
              <IconTarget size={16} />
            </span>
          </div>

          <div className="priority-bars-layout">
            {[
              { label: 'High Priority', count: stats.priorityCounts.High, color: 'var(--color-terracotta)', tag: 'Urgent' },
              { label: 'Medium Priority', count: stats.priorityCounts.Medium, color: 'var(--color-gold)', tag: 'Normal' },
              { label: 'Low Priority', count: stats.priorityCounts.Low, color: 'var(--color-sage-dark)', tag: 'Flexible' },
            ].map((p) => {
              const pct = stats.total > 0 ? Math.round((p.count / stats.total) * 100) : 0;
              return (
                <div key={p.label} className="priority-bar-row">
                  <div className="priority-bar-label-line">
                    <div className="priority-bar-name">
                      <span className="priority-dot" style={{ backgroundColor: p.color }} />
                      <span>{p.label}</span>
                    </div>
                    <span className="priority-bar-stats">
                      <strong>{p.count}</strong> tasks ({pct}%)
                    </span>
                  </div>
                  <div className="priority-track">
                    <div
                      className="priority-fill"
                      style={{ width: `${pct}%`, backgroundColor: p.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weekly Workload Schedule (7-Day SVG Bar Chart) */}
      <div className="content-card">
        <div className="content-card-header">
          <div>
            <h2 className="content-card-title">7-Day Upcoming Deadline Velocity</h2>
            <p className="content-card-subtitle">Assignment distribution across the current and upcoming days</p>
          </div>
        </div>

        <div className="weekly-chart-container">
          <div className="weekly-bars-grid">
            {stats.weekDays.map((day) => {
              const heightPct = Math.round((day.total / stats.maxDayTasks) * 100);
              const barHeight = day.total > 0 ? Math.max(heightPct, 18) : 6;
              const isToday = day.label === 'Today';

              return (
                <div key={day.label} className={`weekly-bar-col ${isToday ? 'col-today' : ''}`}>
                  <div className="weekly-bar-track">
                    <div
                      className={`weekly-bar-fill ${day.total === 0 ? 'fill-empty' : ''}`}
                      style={{ height: `${barHeight}%` }}
                    >
                      {day.total > 0 && <span className="weekly-bar-count">{day.total}</span>}
                    </div>
                  </div>
                  <div className="weekly-bar-label">
                    <span className="weekly-day-title">{day.label}</span>
                    <span className="weekly-day-date">{day.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subject Workload Table & Progress */}
      <div className="content-card">
        <div className="content-card-header">
          <div>
            <h2 className="content-card-title">Course & Subject Velocity</h2>
            <p className="content-card-subtitle">Breakdown of workload completion per academic discipline</p>
          </div>
        </div>

        <div className="subject-analytics-table">
          <div className="subject-table-header">
            <span>Course / Subject</span>
            <span>Completed</span>
            <span>Pending</span>
            <span>Total</span>
            <span>Progress</span>
          </div>

          <div className="subject-table-body">
            {stats.subjectList.map(([subjectName, subjStats]) => {
              const rate = Math.round((subjStats.completed / subjStats.total) * 100);
              return (
                <div key={subjectName} className="subject-table-row">
                  <div className="subj-col-name">
                    <span className="pill-subject">{subjectName}</span>
                  </div>
                  <div className="subj-col-val text-forest">
                    {subjStats.completed}
                  </div>
                  <div className="subj-col-val text-charcoal">
                    {subjStats.pending}
                  </div>
                  <div className="subj-col-val font-semibold">
                    {subjStats.total}
                  </div>
                  <div className="subj-col-progress">
                    <div className="subject-bar">
                      <div className="subject-bar-fill" style={{ width: `${rate}%` }} />
                    </div>
                    <span className="subj-rate-label">{rate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
