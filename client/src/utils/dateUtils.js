// Date formatting and deadline calculations for StudyFlow

export function isOverdue(dueDate, completed = false) {
  if (!dueDate || completed) return false;
  const due = new Date(dueDate);
  const now = new Date();
  // Set to end of due date if no time was specified
  due.setHours(23, 59, 59, 999);
  return due < now;
}

export function isDueSoon(dueDate, completed = false) {
  if (!dueDate || completed) return false;
  const due = new Date(dueDate);
  const now = new Date();
  due.setHours(23, 59, 59, 999);
  const diffHours = (due - now) / (1000 * 60 * 60);
  return diffHours >= 0 && diffHours <= 48;
}

export function formatDueDate(dueDate, completed = false) {
  if (!dueDate) return { label: 'No deadline', isOverdue: false, isSoon: false };

  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const compareDue = new Date(due);
  compareDue.setHours(0, 0, 0, 0);

  const diffDays = Math.round((compareDue - now) / (1000 * 60 * 60 * 24));

  if (completed) {
    return {
      label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isOverdue: false,
      isSoon: false,
    };
  }

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      label: `Overdue by ${daysAgo} ${daysAgo === 1 ? 'day' : 'days'}`,
      isOverdue: true,
      isSoon: false,
    };
  } else if (diffDays === 0) {
    return {
      label: 'Due Today',
      isOverdue: false,
      isSoon: true,
    };
  } else if (diffDays === 1) {
    return {
      label: 'Due Tomorrow',
      isOverdue: false,
      isSoon: true,
    };
  } else if (diffDays <= 7) {
    return {
      label: `Due in ${diffDays} days`,
      isOverdue: false,
      isSoon: diffDays <= 2,
    };
  } else {
    return {
      label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      isOverdue: false,
      isSoon: false,
    };
  }
}

export function formatEditorialDate(date = new Date()) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function toInputDateFormat(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}
