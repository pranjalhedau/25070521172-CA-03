import {
  IconBook,
  IconGrid,
  IconList,
  IconPlus,
  IconLogOut,
  IconX,
} from './Icons';

export default function Sidebar({
  currentView,
  onNavigate,
  onOpenNewTask,
  user,
  onLogout,
  healthStatus,
  isOpenMobile,
  onCloseMobile,
  taskCount = 0,
}) {
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'SF';

  function handleNav(view) {
    onNavigate(view);
    if (onCloseMobile) onCloseMobile();
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`studyflow-sidebar ${isOpenMobile ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-section">
          <div className="brand-logo-lockup">
            <div className="brand-icon-box">
              <IconBook size={20} />
            </div>
            <div className="brand-text-stack">
              <span className="brand-title">StudyFlow</span>
              <span className="brand-tagline">Academic Workspace</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Quick New Task Action */}
        <div className="sidebar-action-wrap">
          <button
            type="button"
            className="btn-sidebar-create"
            onClick={() => {
              onOpenNewTask();
              if (onCloseMobile) onCloseMobile();
            }}
          >
            <IconPlus size={16} />
            <span>Create New Task</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav" aria-label="Main Navigation">
          <span className="sidebar-nav-heading">Views</span>
          <button
            type="button"
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNav('dashboard')}
          >
            <span className="nav-item-icon">
              <IconGrid size={18} />
            </span>
            <span className="nav-item-label">Dashboard</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentView === 'tasks' ? 'active' : ''}`}
            onClick={() => handleNav('tasks')}
          >
            <span className="nav-item-icon">
              <IconList size={18} />
            </span>
            <span className="nav-item-label">Task Registry</span>
            {taskCount > 0 && <span className="nav-item-badge">{taskCount}</span>}
          </button>
        </nav>

        {/* System & Term Metadata */}
        <div className="sidebar-meta-box">
          <div className="system-health-pill">
            <span
              className={`health-dot ${
                healthStatus?.mongoConnected ? 'healthy' : 'disconnected'
              }`}
            />
            <span className="health-label">
              {healthStatus?.mongoConnected ? 'Local DB Online' : 'Connecting DB...'}
            </span>
          </div>
          <span className="term-label">College CA-3 • Evaluation</span>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="sidebar-footer">
          <div className="user-profile-card">
            <div className="user-avatar" title={user?.name || 'Student'}>
              {initials}
            </div>
            <div className="user-text-info">
              <span className="user-name">{user?.name || 'Student'}</span>
              <span className="user-email">{user?.email || 'student@college.edu'}</span>
            </div>
          </div>
          <button
            type="button"
            className="btn-logout"
            onClick={onLogout}
            title="Sign out of StudyFlow"
            aria-label="Sign out"
          >
            <IconLogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
