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
import PlannerView from './components/PlannerView';
import AnalyticsView from './components/AnalyticsView';
import FocusView from './components/FocusView';
import TaskModal from './components/TaskModal';
import Toast from './components/Toast';
import './App.css';
import './components/NewViews.css';

export default function App() {
  const [user, setUser] = useState(() => getUser());
  const [token, setToken] = useState(() => getToken());
  const [healthStatus, setHealthStatus] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'tasks' | 'planner' | 'analytics' | 'focus'
  const [taskFilterPreset, setTaskFilterPreset] = useState('all');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [toast, setToast] = useState(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Focus Mode / Pomodoro Timer State (Managed at App level to persist across page switches without speeding up or creating duplicate intervals)
  const [focusMode, setFocusMode] = useState('pomodoro'); // 'pomodoro' (25m) | 'shortBreak' (5m) | 'longBreak' (15m)
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(25 * 60);
  const [focusIsRunning, setFocusIsRunning] = useState(false);
  const [focusSelectedTaskId, setFocusSelectedTaskId] = useState(null);
  const [focusSessionsCompleted, setFocusSessionsCompleted] = useState(0);

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

  // Pomodoro Countdown Timer Effect: accurately counts down and cleans up intervals properly
  useEffect(() => {
    if (!focusIsRunning) return;

    const interval = setInterval(() => {
      setFocusSecondsLeft((prev) => {
        if (prev <= 1) {
          // Play a gentle audio chime using Web Audio API (no external audio files needed)
          try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
              const ctx = new AudioContextClass();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
              osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25); // A5
              gain.gain.setValueAtTime(0.12, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.5);
            }
          } catch {
            // Audio context not allowed or unsupported
          }

          setFocusIsRunning(false);
          if (focusMode === 'pomodoro') {
            setFocusSessionsCompleted((c) => c + 1);
            showToast('Focus session complete! Time for a short break.', 'success');
          } else {
            showToast('Break completed! Ready for another study block.', 'info');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [focusIsRunning, focusMode, showToast]);

  // Timer Handlers
  function handleStartTimer() {
    setFocusIsRunning(true);
  }

  function handlePauseTimer() {
    setFocusIsRunning(false);
  }

  function handleResetTimer() {
    setFocusIsRunning(false);
    const durations = { pomodoro: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };
    setFocusSecondsLeft(durations[focusMode] || 25 * 60);
  }

  function handleSelectFocusMode(newMode, durationSeconds) {
    setFocusIsRunning(false);
    setFocusMode(newMode);
    setFocusSecondsLeft(durationSeconds);
  }

  function handleSelectFocusTask(taskId) {
    setFocusSelectedTaskId(taskId);
  }

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
    setFocusIsRunning(false);
    showToast('You have signed out successfully.', 'info');
  }

  // Task Modal Handlers
  function handleOpenNewTask(prefillData) {
    setEditingTask(prefillData && prefillData.dueDate ? prefillData : null);
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
      if (editingTask && editingTask._id) {
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
            ) : currentView === 'tasks' ? (
              <TasksView
                tasks={tasks}
                onOpenNewTask={handleOpenNewTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onToggleComplete={handleToggleComplete}
                initialFilter={taskFilterPreset}
              />
            ) : currentView === 'planner' ? (
              <PlannerView
                tasks={tasks}
                onOpenNewTask={handleOpenNewTask}
                onEditTask={handleEditTask}
                onToggleComplete={handleToggleComplete}
              />
            ) : currentView === 'analytics' ? (
              <AnalyticsView
                tasks={tasks}
                onOpenNewTask={handleOpenNewTask}
              />
            ) : currentView === 'focus' ? (
              <FocusView
                tasks={tasks}
                timerState={{
                  mode: focusMode,
                  secondsLeft: focusSecondsLeft,
                  isRunning: focusIsRunning,
                  selectedTaskId: focusSelectedTaskId,
                  sessionsCompleted: focusSessionsCompleted,
                }}
                onStart={handleStartTimer}
                onPause={handlePauseTimer}
                onReset={handleResetTimer}
                onSelectMode={handleSelectFocusMode}
                onSelectTask={handleSelectFocusTask}
                onToggleComplete={handleToggleComplete}
              />
            ) : null}
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
