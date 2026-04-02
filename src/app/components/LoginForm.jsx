'use client'

// ============================================================
// Component: LoginForm — RF-AUTH-02
// ============================================================
export default function LoginForm({ loginForm, setLoginForm, onSubmit, errorAuth, carregantAuth }) {
    return (
        <section>
            <h2>Inici de sessió</h2>
            <form
                onSubmit={(e) => { e.preventDefault(); onSubmit() }}
                style={{ display: 'grid', gap: '0.75rem', maxWidth: '420px' }}
            >
                <input
                    type="email"
                    placeholder="Email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                    style={{ padding: '0.65rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
                <input
                    type="password"
                    placeholder="Contrasenya"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                    style={{ padding: '0.65rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
                {errorAuth && <p style={{ color: '#dc2626', margin: 0 }}>{errorAuth}</p>}
                <button
                    type="submit"
                    disabled={carregantAuth}
                    style={{ padding: '0.65rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                    {carregantAuth ? 'Iniciant sessió...' : 'Iniciar sessió'}
                </button>
            </form>
        </section>
    )
}
