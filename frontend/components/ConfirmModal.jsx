'use client';

import { useState, useCallback } from 'react';

export function useConfirm() {
  const [state, setState] = useState(null);

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setState({ message, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (state) {
      state.resolve(true);
      setState(null);
    }
  }, [state]);

  const handleCancel = useCallback(() => {
    if (state) {
      state.resolve(false);
      setState(null);
    }
  }, [state]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') handleCancel();
  }, [handleCancel]);

  const modal = state ? (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <p className="confirm-message">{state.message}</p>
        <div className="confirm-actions">
          <button className="btn btn-header" onClick={handleCancel}>Cancel</button>
          <button className="btn btn-delete" onClick={handleConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  ) : null;

  return [modal, confirm];
}
