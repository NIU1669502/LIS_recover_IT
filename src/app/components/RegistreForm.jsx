'use client'

import { useState } from 'react'

// ============================================================
// Component: RegistreForm — RF-AUTH-01
// ============================================================
export default function RegistreForm({ registreForm, setRegistreForm, onSubmit, errorAuth, carregantAuth }) {
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

        .reg-wrapper {
          min-height: calc(100vh - 80px);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 3rem 1rem 2rem;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          position: relative;
          overflow: hidden;
          background: transparent;
        }

        .reg-card {
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
          animation: regCardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes regCardIn {
          from { opacity: 0; transform: translateY(32px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Brand header ── */
        .reg-brand-header {
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          padding: 1.75rem 2.25rem 1.5rem;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          position: relative;
          overflow: hidden;
        }

        .reg-brand-header::before {
          content: '';
          position: absolute;
          width: 200px; height: 200px;
          background: rgba(255,255,255,0.07);
          border-radius: 50%;
          top: -80px; right: -60px;
        }
        .reg-brand-header::after {
          content: '';
          position: absolute;
          width: 140px; height: 140px;
          background: rgba(255,255,255,0.05);
          border-radius: 50%;
          bottom: -60px; left: -40px;
        }

        .reg-brand-logo {
          font-size: 1.6rem;
          font-weight: 900;
          color: white;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .reg-brand-logo span { opacity: 0.75; }

        .reg-brand-tagline {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.75);
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        .reg-brand-icon {
          position: absolute;
          right: 1.5rem;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.2;
        }

        /* ── Staggered animations ── */
        .reg-anim {
          opacity: 0;
          animation: regSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .reg-anim-1 { animation-delay: 0.1s; }
        .reg-anim-2 { animation-delay: 0.18s; }
        .reg-anim-3 { animation-delay: 0.26s; }
        .reg-anim-4 { animation-delay: 0.34s; }
        .reg-anim-5 { animation-delay: 0.42s; }
        .reg-anim-6 { animation-delay: 0.50s; }

        @keyframes regSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Text ── */
        .reg-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #111827;
          margin: 0 0 0.35rem 0;
          letter-spacing: -0.03em;
        }
        .reg-subtitle {
          font-size: 0.9rem;
          color: #6b7280;
          margin: 0 0 2rem 0;
        }

        /* ── Fields ── */
        .reg-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.4rem;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .reg-field { margin-bottom: 1.1rem; }

        /* ── Error ── */
        .reg-error {
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
          animation: regShake 0.4s ease;
        }

        @keyframes regShake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }

        /* ── Button ── */
        .reg-btn {
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

        .reg-btn::after {
          content: '';
          position: absolute;
          top: 0; left: -75%;
          width: 50%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent);
          transform: skewX(-20deg);
        }
        .reg-btn:hover:not(:disabled)::after {
          animation: regShimmer 0.6s ease forwards;
        }
        @keyframes regShimmer {
          0%   { left: -75%; }
          100% { left: 130%; }
        }

        .reg-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(59, 130, 246, 0.55);
        }
        .reg-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }
        .reg-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ── Loading dots ── */
        .reg-dot {
          display: inline-block;
          width: 7px; height: 7px;
          background: white;
          border-radius: 50%;
          margin: 0 2px;
          animation: regDotBounce 1s ease-in-out infinite;
        }
        .reg-dot:nth-child(2) { animation-delay: 0.15s; }
        .reg-dot:nth-child(3) { animation-delay: 0.30s; }

        @keyframes regDotBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>

      <div className="reg-wrapper">
        <div className="reg-card">

          {/* Brand header */}
          <div className="reg-brand-header reg-anim reg-anim-1">
            <div className="reg-brand-logo">Recover<span>IT</span></div>
            <div className="reg-brand-tagline">La teva plataforma de recuperació guiada</div>
            <svg className="reg-brand-icon" width="72" height="72" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>

          <div style={{ padding: '0 2.25rem' }}>
            <h2 className="reg-title reg-anim reg-anim-2">Crea el teu compte</h2>
            <p className="reg-subtitle reg-anim reg-anim-2">Comença la teva recuperació avui mateix</p>

            <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} style={{ padding: '0 2.25rem' }}>

              <div className="reg-field reg-anim reg-anim-3">
                <label className="reg-label" htmlFor="reg-nom">Nom complet</label>
                <input
                  id="reg-nom"
                  type="text"
                  placeholder="nom i cognoms"
                  value={registreForm.nom}
                  onChange={(e) => setRegistreForm((prev) => ({ ...prev, nom: e.target.value }))}
                  onFocus={() => setFocusedField('nom')}
                  onBlur={() => setFocusedField(null)}
                  style={inputStyle('nom')}
                  autoComplete="name"
                />
              </div>

              <div className="reg-field reg-anim reg-anim-3">
                <label className="reg-label" htmlFor="reg-dni">DNI</label>
                <input
                  id="reg-dni"
                  type="text"
                  placeholder="12345678A"
                  value={registreForm.dni}
                  onChange={(e) => setRegistreForm((prev) => ({ ...prev, dni: e.target.value }))}
                  onFocus={() => setFocusedField('dni')}
                  onBlur={() => setFocusedField(null)}
                  style={inputStyle('dni')}
                  autoComplete="off"
                />
              </div>

              <div className="reg-field reg-anim reg-anim-4">
                <label className="reg-label" htmlFor="reg-email">Correu electrònic</label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="exemple@correu.com"
                  value={registreForm.email}
                  onChange={(e) => setRegistreForm((prev) => ({ ...prev, email: e.target.value }))}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  style={inputStyle('email')}
                  autoComplete="email"
                />
              </div>

              <div className="reg-field reg-anim reg-anim-5">
                <label className="reg-label" htmlFor="reg-password">Contrasenya</label>
                <input
                  id="reg-password"
                  type="password"
                  placeholder="Mínim 6 caràcters"
                  value={registreForm.password}
                  onChange={(e) => setRegistreForm((prev) => ({ ...prev, password: e.target.value }))}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={inputStyle('password')}
                  autoComplete="new-password"
                />
              </div>

              {errorAuth && (
                <div className="reg-error">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {errorAuth}
                </div>
              )}

              <div className="reg-anim reg-anim-6">
                <button type="submit" disabled={carregantAuth} className="reg-btn">
                  {carregantAuth ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                      <span className="reg-dot" />
                      <span className="reg-dot" />
                      <span className="reg-dot" />
                    </span>
                  ) : 'Registrar-me'}
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </>
  )
}
