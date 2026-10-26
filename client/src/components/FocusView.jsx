import {
  IconPlay,
  IconPause,
  IconRotateCcw,
  IconCheck,
  IconTarget,
} from './Icons';

export default function FocusView({
  tasks = [],
  timerState,
  onStart,
  onPause,
  onReset,
  onSelectMode,
  onSelectTask,
  onToggleComplete,
}) {
  const { mode, secondsLeft, isRunning, selectedTaskId, sessionsCompleted } = timerState;

  // Format MM:SS
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Mode configurations
  const MODES = [
    { id: 'pomodoro', label: 'Study Pomodoro', durationSeconds: 25 * 60, subtitle: '25 min focused study' },
    { id: 'shortBreak', label: 'Short Break', durationSeconds: 5 * 60, subtitle: '5 min restoration' },
    { id: 'longBreak', label: 'Long Break', durationSeconds: 15 * 60, subtitle: '15 min deep rest' },
  ];

  const currentModeConfig = MODES.find((m) => m.id === mode) || MODES[0];
  const totalSeconds = currentModeConfig.durationSeconds;
  const progressRatio = Math.max(0, Math.min(1, (totalSeconds - secondsLeft) / totalSeconds));

  // Circular SVG progress ring parameters
  const ringRadius = 120;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - progressRatio * ringCircumference;

  // Active task object
  const activeTask = tasks.find((t) => t._id === selectedTaskId);
  const pendingTasks = tasks.filter((t) => !t.completed);

  return (
    <div className="focus-view">
      {/* Header */}
      <header className="focus-header">
        <div>
          <span className="editorial-date-stamp">Deep Work Environment</span>
          <h1 className="focus-title">Focus Mode & Pomodoro</h1>
          <p className="focus-subtitle">
            Timed single-task concentration blocks paired with deliberate restorative intervals.
          </p>
        </div>
      </header>

      {/* Main Focus Container */}
      <div className="focus-container-grid">
        {/* Left / Center: Timer Card */}
        <div className="focus-timer-card">
          {/* Mode Switcher Tabs */}
          <div className="focus-mode-tabs" role="tablist" aria-label="Timer interval mode">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                className={`focus-mode-tab ${mode === m.id ? 'active' : ''}`}
                onClick={() => onSelectMode(m.id, m.durationSeconds)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Circular Countdown Ring */}
          <div className="timer-display-area">
            <svg width="290" height="290" viewBox="0 0 290 290" className="timer-svg">
              <circle
                cx="145"
                cy="145"
                r={ringRadius}
                className="timer-track"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="145"
                cy="145"
                r={ringRadius}
                className={`timer-progress-ring ${mode === 'shortBreak' || mode === 'longBreak' ? 'ring-break' : ''}`}
                strokeWidth="10"
                fill="none"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                transform="rotate(-90 145 145)"
              />
            </svg>

            <div className="timer-center-content">
              <span className="timer-mode-eyebrow">{currentModeConfig.label}</span>
              <div className="timer-time-digits" aria-live="polite">
                {timeString}
              </div>
              <span className="timer-status-hint">
                {isRunning ? 'Session in progress...' : secondsLeft === totalSeconds ? 'Ready to focus' : 'Session paused'}
              </span>
            </div>
          </div>

          {/* Timer Action Controls */}
          <div className="timer-controls-row">
            {!isRunning ? (
              <button
                type="button"
                className="btn-timer-primary"
                onClick={onStart}
                title="Start or Resume Countdown"
              >
                <IconPlay size={18} />
                <span>{secondsLeft === totalSeconds ? 'Begin Focus' : 'Resume'}</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-timer-pause"
                onClick={onPause}
                title="Pause Countdown"
              >
                <IconPause size={18} />
                <span>Pause</span>
              </button>
            )}

            <button
              type="button"
              className="btn-timer-reset"
              onClick={onReset}
              title="Reset Timer to Initial Duration"
              aria-label="Reset timer"
            >
              <IconRotateCcw size={18} />
              <span>Reset</span>
            </button>
          </div>

          {/* Session Streak Counter */}
          <div className="sessions-counter-badge">
            <IconTarget size={15} />
            <span>
              <strong>{sessionsCompleted}</strong> {sessionsCompleted === 1 ? 'Focus Session' : 'Focus Sessions'} completed today
            </span>
          </div>
        </div>

        {/* Right Column: Task Assignment & Guidance */}
        <aside className="focus-task-panel">
          {/* Active Assignment Card */}
          <div className="content-card focus-task-card">
            <h2 className="content-card-title">Assigned Assignment</h2>
            <p className="content-card-subtitle">Anchor this study interval to a specific task</p>

            <div className="task-selector-wrapper">
              <label htmlFor="focus-task-select" className="form-label">
                Select Task to Focus On:
              </label>
              <select
                id="focus-task-select"
                className="filter-select focus-select"
                value={selectedTaskId || ''}
                onChange={(e) => onSelectTask(e.target.value || null)}
              >
                <option value="">General Study Session (No specific task)</option>
                {pendingTasks.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.subject ? `[${t.subject}] ` : ''}{t.title} ({t.priority} Priority)
                  </option>
                ))}
              </select>
            </div>

            {activeTask ? (
              <div className="focus-active-task-box">
                <div className="active-task-header">
                  <div>
                    {activeTask.subject && (
                      <span className="pill-subject">{activeTask.subject}</span>
                    )}
                    <span className={`pill-priority pill-${activeTask.priority.toLowerCase()}`}>
                      {activeTask.priority}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => onToggleComplete(activeTask)}
                    title="Mark task completed"
                  >
                    <IconCheck size={14} />
                    <span>Finish Task</span>
                  </button>
                </div>

                <h3 className="active-task-title">{activeTask.title}</h3>
                {activeTask.description && (
                  <p className="active-task-notes">{activeTask.description}</p>
                )}
              </div>
            ) : (
              <div className="focus-empty-task-prompt">
                <p>
                  Tip: Associating a specific task helps eliminate tab-switching and cognitive fragmentation during the 25-minute cycle.
                </p>
              </div>
            )}
          </div>

          {/* Study Discipline Guidelines */}
          <div className="content-card focus-rules-card">
            <h3 className="rules-heading">The 25/5 Study Method</h3>
            <ul className="rules-list">
              <li>
                <span className="rule-number">1</span>
                <div>
                  <strong>Single-Task Purity</strong>
                  <p>Commit to one subject or assignment for the full 25 minutes without checking messages.</p>
                </div>
              </li>
              <li>
                <span className="rule-number">2</span>
                <div>
                  <strong>Genuine Rest Intervals</strong>
                  <p>When the 5-minute break begins, step away from the screen to rest cognitive fatigue.</p>
                </div>
              </li>
              <li>
                <span className="rule-number">3</span>
                <div>
                  <strong>Four-Cycle Cadence</strong>
                  <p>After completing 4 consecutive study intervals, reward yourself with a 15-minute long break.</p>
                </div>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
