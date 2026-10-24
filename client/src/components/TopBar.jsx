import { IconMenu, IconPlus } from './Icons';

export default function TopBar({
  currentView,
  onOpenMobileSidebar,
  onOpenNewTask,
  user,
}) {
  const viewTitles = {
    dashboard: 'Dashboard Overview',
    tasks: 'Task Registry',
  };

  return (
    <header className="studyflow-topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="btn-hamburger"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
        >
          <IconMenu size={20} />
        </button>
        <span className="topbar-current-view">
          {viewTitles[currentView] || 'StudyFlow'}
        </span>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="btn-primary btn-sm topbar-create-btn"
          onClick={onOpenNewTask}
        >
          <IconPlus size={14} />
          <span>New Task</span>
        </button>

        <div className="topbar-user-badge">
          <span className="topbar-greeting">Hi, {user?.name?.split(' ')[0] || 'Student'}</span>
        </div>
      </div>
    </header>
  );
}
