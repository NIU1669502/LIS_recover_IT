'use client'

// ============================================================
// Component: Navbar
// ============================================================
export default function Navbar({ vistaActual, usuariSessio, onTornar, onTancarSessio, onNavegar }) {
    return (
        <nav style={{
            padding: '0.8rem 2rem',
            borderBottom: '1px solid #e5e7eb',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 10,
        }}>
            <span
                onClick={() => onNavegar('inici')}
                style={{ color: '#111827', fontWeight: 800, fontSize: '1.25rem', cursor: 'pointer' }}
            >
                Recover<span style={{ color: '#3b82f6' }}>IT</span>
            </span>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {vistaActual !== 'inici' && (
                    <button
                        onClick={onTornar}
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}
                        onMouseOver={e => e.target.style.color = '#3b82f6'}
                        onMouseOut={e => e.target.style.color = '#6b7280'}
                    >
                        <span style={{ fontSize: '1.1rem' }}></span> Tornar
                    </button>
                )}

                {usuariSessio && (
                    <>
                        <button
                            onClick={() => onNavegar('progres')}
                            style={{
                                background: vistaActual === 'progres' ? '#eff6ff' : 'none',
                                border: vistaActual === 'progres' ? '1px solid #bfdbfe' : 'none',
                                color: vistaActual === 'progres' ? '#3b82f6' : '#6b7280',
                                padding: '0.4rem 0.9rem', borderRadius: '6px',
                                cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.color = '#3b82f6'}
                            onMouseOut={e => e.currentTarget.style.color = vistaActual === 'progres' ? '#3b82f6' : '#6b7280'}
                        >
                            📈 Progrés
                        </button>
                        <button
                            onClick={onTancarSessio}
                            style={{ background: '#ffffff', border: '1px solid #fee2e2', color: '#ef4444', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' }}
                            onMouseOver={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca' }}
                            onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#fee2e2' }}
                        >
                            Tancar sessió
                        </button>
                    </>
                )}
            </div>
        </nav>
    )
}
