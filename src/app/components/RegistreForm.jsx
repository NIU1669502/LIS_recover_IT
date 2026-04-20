'use client'

import styles from './registreForm.module.css'

export default function RegistreForm({ registreForm, setRegistreForm, onSubmit, errorAuth, carregantAuth }) {
    return (
        <section>
            <h2 className={styles.title}>Registre</h2>

            <form
                onSubmit={(e) => { e.preventDefault(); onSubmit() }}
                className={styles.form}
            >
                <input
                    type="text"
                    placeholder="Nom complet"
                    value={registreForm.nom}
                    onChange={(e) =>
                        setRegistreForm((prev) => ({ ...prev, nom: e.target.value }))
                    }
                    className={styles.input}
                />

                <input
                    type="text"
                    placeholder="DNI"
                    value={registreForm.dni}
                    onChange={(e) =>
                        setRegistreForm((prev) => ({ ...prev, dni: e.target.value }))
                    }
                    className={styles.input}
                />

                <input
                    type="email"
                    placeholder="Email"
                    value={registreForm.email}
                    onChange={(e) =>
                        setRegistreForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className={styles.input}
                />

                <input
                    type="password"
                    placeholder="Contrasenya"
                    value={registreForm.password}
                    onChange={(e) =>
                        setRegistreForm((prev) => ({ ...prev, password: e.target.value }))
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
                    {carregantAuth ? 'Registrant...' : 'Registrar-me'}
                </button>
            </form>
        </section>
    )
}
