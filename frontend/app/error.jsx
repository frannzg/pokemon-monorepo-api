'use client';

export default function Error({ error, reset }) {
  return (
    <div className="container">
      <div className="error-boundary">
        <div className="error-boundary-icon">!</div>
        <h2>Something went wrong</h2>
        <p>{error?.message || 'An unexpected error occurred.'}</p>
        <button className="btn btn-sync" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
