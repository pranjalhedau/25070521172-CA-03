import { useState, useEffect } from 'react';
import { IconX } from './Icons';
import { toInputDateFormat } from '../utils/dateUtils';

function TaskModalForm({ task, onClose, onSave, existingSubjects = [] }) {
  const [title, setTitle] = useState(task?.title || '');
  const [subject, setSubject] = useState(task?.subject || '');
  const [priority, setPriority] = useState(task?.priority || 'Medium');
  const [dueDate, setDueDate] = useState(toInputDateFormat(task?.dueDate));
  const [description, setDescription] = useState(task?.description || '');
  const [completed, setCompleted] = useState(Boolean(task?.completed));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Handle ESC key to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSave({
        title: title.trim(),
        subject: subject.trim(),
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        description: description.trim(),
        ...(task ? { completed } : {}),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-heading">
      <div className="modal-header">
        <div>
          <span className="modal-eyebrow">{task ? 'Edit Assignment' : 'New Academic Task'}</span>
          <h2 id="modal-heading" className="modal-title">
            {task ? 'Update Task Details' : 'Record New Study Task'}
          </h2>
        </div>
        <button type="button" className="btn-icon-close" onClick={onClose} aria-label="Close dialog">
          <IconX size={18} />
        </button>
      </div>

      {error && (
        <div className="form-error-banner" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-group">
          <label htmlFor="task-title" className="form-label">
            Task Title <span className="req">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            className="form-input"
            placeholder="e.g., Complete Chapter 4 Exercises, CA-3 Presentation Slides"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
          />
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="task-subject" className="form-label">
              Course / Subject
            </label>
            <input
              id="task-subject"
              type="text"
              list="subject-suggestions"
              className="form-input"
              placeholder="e.g., Web Technologies, Data Structures"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            {existingSubjects.length > 0 && (
              <datalist id="subject-suggestions">
                {existingSubjects.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="task-due" className="form-label">
              Due Date
            </label>
            <input
              id="task-due"
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Priority Level</label>
          <div className="priority-segmented-control" role="radiogroup">
            {['Low', 'Medium', 'High'].map((p) => {
              const isSelected = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`priority-btn priority-btn-${p.toLowerCase()} ${isSelected ? 'active' : ''}`}
                  onClick={() => setPriority(p)}
                >
                  <span className={`priority-dot dot-${p.toLowerCase()}`} />
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="task-description" className="form-label">
            Notes & Guidelines <span className="label-hint">(optional)</span>
          </label>
          <textarea
            id="task-description"
            rows={3}
            className="form-textarea"
            placeholder="Add key rubric points, reading pages, or submission links..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {task && (
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
              />
              <span className="checkbox-custom" />
              <span className="checkbox-text">Mark this task as completed</span>
            </label>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TaskModal({ isOpen, onClose, onSave, task, existingSubjects = [] }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <TaskModalForm
        key={task ? task._id : 'new-task'}
        task={task}
        onClose={onClose}
        onSave={onSave}
        existingSubjects={existingSubjects}
      />
    </div>
  );
}
