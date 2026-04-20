'use client'

import styles from './loginForm.module.css'

export default function LoginForm({ loginForm, setLoginForm, onSubmit, errorAuth, carregantAuth }) {
    return (
        <section>
            <h2 className={styles.title}>Inici de sessió</h2>

            <form
                onSubmit={(e) => { e.preventDefault(); onSubmit() }}
                className={styles.form}
            >
                <input
                    type="email"
                    placeholder="Email"
                    value={loginForm.email}
                    onChange={(e) =>
                        setLoginForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className={styles.input}
                />

                <input
                    type="password"
                    placeholder="Contrasenya"
                    value={loginForm.password}
                    onChange={(e) =>
                        setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className={styles.input}
                />

                {errorAuth && (
                    <p className={styles.error}>{errorAuth}</p>
                )}

                <button
                    type="submit"
                    disabled={carregantAuth}
                    className={styles.submitButton}
                >
                    {carregantAuth ? 'Iniciant sessió...' : 'Iniciar sessió'}
                </button>
            </form>
        </section>
    )
}
