'use client'

// ============================================================
// Component: RegistreForm — RF-AUTH-01
// ============================================================
export default function RegistreForm({ registreForm, setRegistreForm, onSubmit, errorAuth, carregantAuth }) {
    return (
        <section>
            <h2>Registre</h2>
            <form
                onSubmit={(e) => { e.preventDefault(); onSubmit() }}
                style={{ display: 'grid', gap: '0.75rem', maxWidth: '420px' }}
            >
                <input
                    type="text"
                    placeholder="Nom complet"
                    value={registreForm.nom}
                    onChange={(e) => setRegistreForm((prev) => ({ ...prev, nom: e.target.value }))}
                    style={{ padding: '0.65rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
                <input
                    type="text"
                    placeholder="DNI"
                    value={registreForm.dni}
                    onChange={(e) => setRegistreForm((prev) => ({ ...prev, dni: e.target.value }))}
                    style={{ padding: '0.65rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={registreForm.email}
                    onChange={(e) => setRegistreForm((prev) => ({ ...prev, email: e.target.value }))}
                    style={{ padding: '0.65rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
                <input
                    type="password"
                    placeholder="Contrasenya"
                    value={registreForm.password}
                    onChange={(e) => setRegistreForm((prev) => ({ ...prev, password: e.target.value }))}
                    style={{ padding: '0.65rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
                {errorAuth && <p style={{ color: '#dc2626', margin: 0 }}>{errorAuth}</p>}
                <button
                    type="submit"
                    disabled={carregantAuth}
                    style={{ padding: '0.65rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                    {carregantAuth ? 'Registrant...' : 'Registrar-me'}
                </button>
            </form>
        </section>
    )
}
