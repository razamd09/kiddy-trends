import React from 'react'

export default function SyncStatus({ pending, onSync }) {
  return (
    <div className="sync-status">
      <div className="sync-indicator">
        {pending > 0 ? (
          <>
            <span className="status-dot pending"></span>
            <div className="status-info">
              <p className="status-text">{pending} pending changes</p>
              <p className="status-hint">Waiting to sync...</p>
            </div>
          </>
        ) : (
          <>
            <span className="status-dot synced"></span>
            <div className="status-info">
              <p className="status-text">All synced</p>
              <p className="status-hint">Everything is up to date</p>
            </div>
          </>
        )}
      </div>

      <button
        onClick={onSync}
        className={`btn-sync ${pending > 0 ? 'active' : 'inactive'}`}
        disabled={pending === 0}
      >
        🔄 Sync Now
      </button>
    </div>
  )
}
