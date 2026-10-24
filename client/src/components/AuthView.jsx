import { useState } from 'react';
import { loginUser, registerUser, setAuth } from '../api';
import { IconBook, IconCheckCircle, IconClock, IconEye, IconEyeOff } from './Icons';

export default function AuthView({ onAuthSuccess, healthStatus }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function switchMode(newMode) {
    setMode(newMode);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Client-side validations
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
    }

    try {
      setLoading(true);
      let response;
      if (mode === 'register') {
        response = await registerUser({
          name: name.trim(),
          email: cleanEmail,
          password,
        });
      } else {
        response = await loginUser({
          email: cleanEmail,
          password,
        });
      }

      // Store token and user in sessionStorage
      if (response.token && response.user) {
        setAuth(response.token, response.user);
        onAuthSuccess(response.user);
      } else {
        throw new Error('Authentication succeeded but received incomplete response.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Editorial Brand Showcase */}
        <div className="auth-hero">
          <div className="auth-brand-badge">
            <span className="auth-brand-icon">
              <IconBook size={20} />
            </span>
            <span className="auth-brand-name">StudyFlow</span>
          </div>

          <h1 className="auth-headline">
            Order & composure for your academic life.
          </h1>

          <p className="auth-subhead">
            A quiet workspace engineered for college coursework, assignment deadlines, and exam preparations. Without distraction or visual noise.
          </p>

          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <IconCheckCircle size={18} />
              </div>
              <div>
                <strong>Coursework Catalog</strong>
                <p>Organize assignments by subject with customizable priorities.</p>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <IconClock size={18} />
              </div>
              <div>
                <strong>Deadline Radar</strong>
                <p>Always know what is due today, tomorrow, and later this week.</p>
              </div>
            </div>
          </div>

          <div className="auth-system-status">
            <span className={`status-dot ${healthStatus?.mongoConnected ? 'online' : 'offline'}`} />
            <span>
              {healthStatus?.mongoConnected
                ? 'Backend API & MongoDB online'
                : 'Connecting to local API...'}
            </span>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="auth-card">
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Create Account
            </button>
          </div>

          <div className="auth-card-body">
            <div className="auth-form-header">
              <h2 className="auth-form-title">
                {mode === 'login' ? 'Welcome back' : 'Start your semester'}
              </h2>
              <p className="auth-form-desc">
                {mode === 'login'
                  ? 'Sign in to access your study tasks and deadlines.'
                  : 'Register a student account to organize your academic tasks.'}
              </p>
            </div>

            {error && (
              <div className="form-error-banner" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'register' && (
                <div className="form-group">
                  <label htmlFor="reg-name" className="form-label">
                    Full Name <span className="req">*</span>
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g., Alex Bennett"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={mode === 'register'}
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="auth-email" className="form-label">
                  University Email <span className="req">*</span>
                </label>
                <input
                  id="auth-email"
                  type="email"
                  className="form-input"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <div className="label-with-action">
                  <label htmlFor="auth-password" className="form-label">
                    Password <span className="req">*</span>
                  </label>
                  {mode === 'register' && (
                    <span className="label-hint">Min. 6 characters</span>
                  )}
                </div>
                <div className="input-with-button">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input input-pr-btn"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    className="input-inline-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary btn-block btn-auth-submit"
                disabled={loading}
              >
                {loading
                  ? mode === 'register'
                    ? 'Creating Account...'
                    : 'Authenticating...'
                  : mode === 'register'
                  ? 'Register & Open StudyFlow'
                  : 'Sign In to Workspace'}
              </button>
            </form>

            <div className="auth-footer-toggle">
              {mode === 'login' ? (
                <p>
                  First time using StudyFlow?{' '}
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => switchMode('register')}
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => switchMode('login')}
                  >
                    Sign in here
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
