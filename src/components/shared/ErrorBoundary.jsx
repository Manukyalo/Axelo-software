import React from 'react';

/**
 * ErrorBoundary — catches uncaught render exceptions and renders a recovery
 * screen instead of leaving the user staring at a blank page.
 *
 * Mount once at the root (main.jsx) so every page is covered.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log with enough context to reproduce — swap for Sentry in production
    console.error('[ErrorBoundary] Uncaught render exception:', error, info.componentStack);
  }

  handleReload = () => {
    // Clear state and let React try re-rendering
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a2e1a',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'rgba(201,168,76,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            marginBottom: 24,
          }}
        >
          ⚠️
        </div>

        <h1
          style={{
            fontFamily: 'Playfair Display, serif',
            color: '#fff',
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Something went wrong
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', maxWidth: 400, marginBottom: 8 }}>
          A rendering error occurred on this page. The issue has been logged.
        </p>

        {/* Show the error message in dev only — never expose stack in prod */}
        {import.meta.env.DEV && this.state.error && (
          <pre
            style={{
              background: 'rgba(0,0,0,0.4)',
              color: '#e76f51',
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: '0.75rem',
              textAlign: 'left',
              maxWidth: 600,
              overflowX: 'auto',
              marginBottom: 24,
              border: '1px solid rgba(231,111,81,0.2)',
            }}
          >
            {this.state.error.toString()}
          </pre>
        )}

        <button
          onClick={this.handleReload}
          style={{
            marginTop: 24,
            padding: '12px 32px',
            background: '#C9A84C',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          Reload Application
        </button>
      </div>
    );
  }
}
