'use client'

import { useState, useEffect, useCallback } from 'react'

// ============================================================
// Component: ToastContainer — Sistema de notificacions globals
// Escolta l'event 'app-toast' i mostra avisos flotants
// ============================================================

const ICONS = {
  success: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
}

const STYLES = {
  success: { bg: '#f0fdf4', border: '#86efac', color: '#166534', icon: '#22c55e' },
  error:   { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b', icon: '#ef4444' },
  warning: { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', icon: '#f59e0b' },
  info:    { bg: '#eff6ff', border: '#93c5fd', color: '#1e40af', icon: '#3b82f6' },
}

let toastCounter = 0

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, leaving: true } : t))
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 350)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      const { message, type = 'info' } = e.detail
      const id = ++toastCounter
      setToasts((prev) => [...prev, { id, message, type, leaving: false }])
      setTimeout(() => removeToast(id), 5000)
    }
    window.addEventListener('app-toast', handler)
    return () => window.removeEventListener('app-toast', handler)
  }, [removeToast])

  if (toasts.length === 0) return null

  return (
    <>
      <style>{`
        .toast-container {
          position: fixed;
          top: 1.25rem;
          right: 1.25rem;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          pointer-events: none;
        }

        .toast-item {
          pointer-events: all;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.9rem 1.1rem;
          border-radius: 14px;
          border: 1px solid;
          max-width: 380px;
          min-width: 260px;
          box-shadow:
            0 4px 6px -1px rgba(0,0,0,0.07),
            0 10px 30px -5px rgba(0,0,0,0.1);
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.45;
          animation: toastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .toast-item.leaving {
          animation: toastOut 0.3s ease forwards;
        }

        @keyframes toastIn {
          from { opacity: 0; transform: translateX(60px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }

        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to   { opacity: 0; transform: translateX(60px) scale(0.95); }
        }

        .toast-icon {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .toast-msg {
          flex: 1;
        }

        .toast-close {
          flex-shrink: 0;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          opacity: 0.5;
          transition: opacity 0.15s;
          line-height: 1;
          margin-top: 1px;
        }

        .toast-close:hover {
          opacity: 1;
        }

        .toast-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          border-radius: 0 0 14px 14px;
          animation: toastProgress 5s linear forwards;
        }

        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      <div className="toast-container">
        {toasts.map((t) => {
          const s = STYLES[t.type] || STYLES.info
          return (
            <div
              key={t.id}
              className={`toast-item${t.leaving ? ' leaving' : ''}`}
              style={{
                background: s.bg,
                borderColor: s.border,
                color: s.color,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span className="toast-icon" style={{ color: s.icon }}>
                {ICONS[t.type] || ICONS.info}
              </span>
              <span className="toast-msg">{t.message}</span>
              <button
                className="toast-close"
                onClick={() => removeToast(t.id)}
                aria-label="Tancar"
                style={{ color: s.color }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div
                className="toast-progress"
                style={{ background: s.icon }}
              />
            </div>
          )
        })}
      </div>
    </>
  )
}
