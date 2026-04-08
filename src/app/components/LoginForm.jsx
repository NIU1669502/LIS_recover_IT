'use client'

import { useState } from 'react'

// ============================================================
// Component: LoginForm — RF-AUTH-02
// ============================================================
export default function LoginForm({ loginForm, setLoginForm, onSubmit, errorAuth, carregantAuth }) {
  const [focusedField, setFocusedField] = useState(null)

  const inputStyle = (field) => ({
    width: '100%',
    padding: '0.9rem 1rem',
    borderRadius: '12px',
    border: `2px solid ${focusedField === field ? '#3b82f6' : '#e5e7eb'}`,
    background: focusedField === field ? '#f0f7ff' : '#f9fafb',
    fontSize: '0.95rem',
    color: '#111827',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    boxShadow: focusedField === field ? '0 0 0 4px rgba(59,130,246,0.12)' : 'none',
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        /* ── Wrapper ── */
        .login-wrapper {
          min-height: calc(100vh - 80px);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 3rem 1rem 2rem;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          position: relative;
          overflow: hidden;
          background: #ffffff;
        }

        /* ── Animated background orbs ── */
        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.55;
          pointer-events: none;
          z-index: 0;
        }
        .login-orb-1 {
          width: 420px; height: 420px;
          background: radial-gradient(circle, #bfdbfe, #818cf8);
          top: -100px; left: -120px;
          animation: orbFloat1 9s ease-in-out infinite;
        }
        .login-orb-2 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, #bbf7d0, #6ee7b7);
          bottom: -80px; right: -100px;
          animation: orbFloat2 11s ease-in-out infinite;
        }
        .login-orb-3 {
          width: 260px; height: 260px;
          background: radial-gradient(circle, #fde68a, #fca5a5);
          top: 40%; right: 5%;
          animation: orbFloat3 13s ease-in-out infinite;
        }

        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(40px, 30px) scale(1.08); }
          66%       { transform: translate(-20px, 50px) scale(0.95); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40%       { transform: translate(-50px, -30px) scale(1.1); }
          70%       { transform: translate(20px, -50px) scale(0.92); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-30px, 40px) scale(1.12); }
        }

        /* ── Card ── */
        .login-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          padding: 0 0 2.25rem 0;
          overflow: hidden;
          box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.06),
            0 24px 70px -10px rgba(59, 130, 246, 0.18),
            0 0 0 1px rgba(255, 255, 255, 0.6) inset;
          animation: cardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(32px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Staggered field animations ── */
        .login-anim {
          opacity: 0;
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .login-anim-1 { animation-delay: 0.1s; }
        .login-anim-2 { animation-delay: 0.2s; }
        .login-anim-3 { animation-delay: 0.3s; }
        .login-anim-4 { animation-delay: 0.4s; }
        .login-anim-5 { animation-delay: 0.5s; }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Icon ── */
        /* ── Brand header ── */
        .login-brand-header {
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          padding: 1.75rem 2.25rem 1.5rem;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          position: relative;
          overflow: hidden;
        }

        .login-brand-header::before {
          content: '';
          position: absolute;
          width: 200px; height: 200px;
          background: rgba(255,255,255,0.07);
          border-radius: 50%;
          top: -80px; right: -60px;
        }
        .login-brand-header::after {
          content: '';
          position: absolute;
          width: 140px; height: 140px;
          background: rgba(255,255,255,0.05);
          border-radius: 50%;
          bottom: -60px; left: -40px;
        }

        .login-brand-logo {
          font-size: 1.6rem;
          font-weight: 900;
          color: white;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .login-brand-logo span {
          opacity: 0.75;
        }

        .login-brand-tagline {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.75);
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        .login-brand-icon {
          position: absolute;
          right: 1.5rem;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.2;
        }

        /* ── Text ── */
        .login-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #111827;
          margin: 0 0 0.35rem 0;
          letter-spacing: -0.03em;
        }
        .login-subtitle {
          font-size: 0.9rem;
          color: #6b7280;
          margin: 0 0 2rem 0;
        }

        /* ── Fields ── */
        .login-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.4rem;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .login-field {
          margin-bottom: 1.25rem;
        }

        /* ── Error ── */
        .login-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          color: #dc2626;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1.25rem;
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }

        /* ── Button ── */
        .login-btn {
          width: 100%;
          padding: 0.9rem 1rem;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          transition: all 0.25s ease;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
          position: relative;
          overflow: hidden;
        }

        /* Shimmer sweep on hover */
        .login-btn::after {
          content: '';
          position: absolute;
          top: 0; left: -75%;
          width: 50%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent);
          transform: skewX(-20deg);
          transition: none;
        }
        .login-btn:hover:not(:disabled)::after {
          animation: shimmer 0.6s ease forwards;
        }
        @keyframes shimmer {
          0%   { left: -75%; }
          100% { left: 130%; }
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(59, 130, 246, 0.55);
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ── Loading dots ── */
        .dot-bounce {
          display: inline-block;
          width: 7px; height: 7px;
          background: white;
          border-radius: 50%;
          margin: 0 2px;
          animation: dotBounce 1s ease-in-out infinite;
        }
        .dot-bounce:nth-child(2) { animation-delay: 0.15s; }
        .dot-bounce:nth-child(3) { animation-delay: 0.30s; }

        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="login-wrapper">
        <div className="login-card">

          {/* Brand header */}
          <div className="login-brand-header login-anim login-anim-1">
            <div className="login-brand-logo">Recover<span>IT</span></div>
            <div className="login-brand-tagline">La teva plataforma de recuperació guiada</div>
            <svg className="login-brand-icon" width="72" height="72" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <div style={{ padding: '0 2.25rem' }}>
          <h2 className="login-title login-anim login-anim-2">Benvingut de nou</h2>
          <p className="login-subtitle login-anim login-anim-2">Inicia sessió al teu compte</p>

          <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} style={{ padding: '0 2.25rem' }}>

            <div className="login-field login-anim login-anim-3">
              <label className="login-label" htmlFor="login-email">Correu electrònic</label>
              <input
                id="login-email"
                type="email"
                placeholder="exemple@correu.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('email')}
                autoComplete="email"
              />
            </div>

            <div className="login-field login-anim login-anim-4">
              <label className="login-label" htmlFor="login-password">Contrasenya</label>
              <input
                id="login-password"
                type="password"
                placeholder="La teva contrasenya"
                value={loginForm.password}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('password')}
                autoComplete="current-password"
              />
            </div>

            {errorAuth && (
              <div className="login-error">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {errorAuth}
              </div>
            )}

            <div className="login-anim login-anim-5">
              <button
                type="submit"
                disabled={carregantAuth}
                className="login-btn"
              >
                {carregantAuth ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <span className="dot-bounce" />
                    <span className="dot-bounce" />
                    <span className="dot-bounce" />
                  </span>
                ) : 'Iniciar sessió'}
              </button>
            </div>

          </form>
          </div>
        </div>
      </div>
    </>
  )
}
