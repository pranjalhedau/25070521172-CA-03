import { useState, useEffect, useCallback } from 'react';
import {
  getUser,
  getToken,
  clearAuth,
  checkHealth,
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
} from './api';
import AuthView from './components/AuthView';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DashboardView from './components/DashboardView';
import TasksView from './components/TasksView';
import TaskModal from './components/TaskModal';
import Toast from './components/Toast';
import './App.css';

export default function App() {
  const [user, setUser] = useState(() => getUser());
  const [token, setToken] = useState(() => getToken());
  const [healthStatus, setHealthStatus] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'tasks'
  const [taskFilterPreset, setTaskFilterPreset] = useState('all');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [toast, setToast] = useState(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Helper to trigger toast notifications
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Health check on mount
  useEffect(() => {
    checkHealth()
      .then((data) => setHealthStatus(data))
      .catch(() => setHealthStatus({ status: 'offline', mongoConnected: false }));
  }, []);

  // Fetch tasks when user is authenticated
  useEffect(() => {
    let ignore = false;
    if (user && token) {
      fetchTasks()
        .then((data) => {
          if (!ignore) {
            setTasks(Array.isArray(data) ? data : []);
          }
        })
        .catch((err) => {
          if (!ignore) {
            if (err.status === 401) {
              clearAuth();
              setUser(null);
              setToken(null);
              showToast('Your session has expired. Please sign in again.', 'error');
            } else {
              showToast(err.message || 'Unable to load tasks from server.', 'error');
            }
          }
        })
        .finally(() => {
          if (!ignore) {
            setLoadingTasks(false);
          }
        });
    }
    return () => {
      ignore = true;
    };
  }, [user, token, showToast]);

  // Auth Success Handler
  function handleAuthSuccess(authenticatedUser) {
    setUser(authenticatedUser);
    setToken(getToken());
    showToast(`Welcome to StudyFlow, ${authenticatedUser.name}!`);
  }

  // Logout Handler
  function handleLogout() {
    clearAuth();
    setUser(null);
    setToken(null);
    setTasks([]);
    setCurrentView('dashboard');
    showToast('You have signed out successfully.', 'info');
  }

  // Task Modal Handlers
  function handleOpenNewTask() {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  }

  function handleEditTask(task) {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  }

  function handleCloseModal() {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  }

  // Create or Update task submission
  async function handleSaveTask(taskData) {
    try {
      if (editingTask) {
        const updated = await updateTask(editingTask._id, taskData);
        setTasks((prev) =>
          prev.map((t) => (t._id === editingTask._id ? updated : t))
        );
        showToast('Task updated successfully.');
      } else {
        const created = await createTask(taskData);
        setTasks((prev) => [created, ...prev]);
        showToast('New study task added.');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save task.', 'error');
      throw err;
    }
  }

  // Toggle complete directly
  async function handleToggleComplete(task) {
    const nextCompleted = !task.completed;
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t._id === task._id ? { ...t, completed: nextCompleted } : t
        )
      );

      const updated = await updateTask(task._id, { completed: nextCompleted });
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? updated : t))
      );

      showToast(
        nextCompleted
          ? `Marked "${task.title}" as completed.`
          : `Marked "${task.title}" as active.`
      );
    } catch {
      // Rollback
      setTasks((prev) =>
        prev.map((t) =>
          t._id === task._id ? { ...t, completed: task.completed } : t
        )
      );
      showToast('Could not update task status.', 'error');
    }
  }

  // Delete task
  async function handleDeleteTask(taskId) {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      showToast('Task removed from workspace.');
    } catch (err) {
      showToast(err.message || 'Failed to delete task.', 'error');
    }
  }

  // Navigation helper from dashboard
  function handleNavigateToTasks(preset = 'all') {
    setTaskFilterPreset(preset);
    setCurrentView('tasks');
  }

  // List of existing distinct subjects for modal autocomplete
  const existingSubjects = Array.from(
    new Set(tasks.map((t) => t.subject).filter(Boolean))
  );

  // If not logged in, show Auth View
  if (!user || !token) {
    return (
      <div className="studyflow-app-root">
        <AuthView
          onAuthSuccess={handleAuthSuccess}
          healthStatus={healthStatus}
        />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  return (
    <div className="studyflow-app-root">
      <div className="studyflow-layout">
        {/* Editorial Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            setIsMobileNavOpen(false);
          }}
          onOpenNewTask={handleOpenNewTask}
          user={user}
          onLogout={handleLogout}
          healthStatus={healthStatus}
          isOpenMobile={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
          taskCount={tasks.length}
        />

        {/* Main Content Area */}
        <div className="studyflow-main-wrapper">
          <TopBar
            currentView={currentView}
            onOpenMobileSidebar={() => setIsMobileNavOpen(true)}
            onOpenNewTask={handleOpenNewTask}
            user={user}
          />

          <main className="studyflow-content-area">
            {loadingTasks && tasks.length === 0 ? (
              <div className="loading-state-container">
                <div className="editorial-spinner" />
                <p>Loading your study catalog...</p>
              </div>
            ) : currentView === 'dashboard' ? (
              <DashboardView
                user={user}
                tasks={tasks}
                onOpenNewTask={handleOpenNewTask}
                onToggleComplete={handleToggleComplete}
                onEditTask={handleEditTask}
                onNavigateToTasks={handleNavigateToTasks}
              />
            ) : (
              <TasksView
                tasks={tasks}
                onOpenNewTask={handleOpenNewTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onToggleComplete={handleToggleComplete}
                initialFilter={taskFilterPreset}
              />
            )}
          </main>
        </div>
      </div>

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        task={editingTask}
        existingSubjects={existingSubjects}
      />

      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
