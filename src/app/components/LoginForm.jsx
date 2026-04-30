'use client'

import { useState } from 'react'
import styles from './loginForm.module.css'


// ============================================================
// Component: LoginForm — RF-AUTH-02
// ============================================================

export default function LoginForm({ loginForm, setLoginForm, onSubmit, errorAuth, carregantAuth }) {
    const [focusedField, setFocusedField] = useState(null)

    const inputClass = (field) =>
        `${styles.input} ${focusedField === field ? styles.inputFocus : ''}`

    return (
        <div className={styles.wrapper}>

            {/* ORBS */}
            <div className={`${styles.orb} ${styles.orb1}`} />
            <div className={`${styles.orb} ${styles.orb2}`} />
            <div className={`${styles.orb} ${styles.orb3}`} />

            <div className={styles.card}>

                {/* HEADER */}
                <div className={`${styles.header} ${styles.anim} ${styles.anim1}`}>
                    <div className={styles.logo}>Recover<span>IT</span></div>
                    <p className={styles.tagline}>La teva plataforma de recuperació guiada</p>
                </div>

                <div className={styles.content}>
                    <h2 className={`${styles.title} ${styles.anim} ${styles.anim2}`}>
                        Benvingut de nou
                    </h2>

                    <p className={`${styles.subtitle} ${styles.anim} ${styles.anim2}`}>
                        Inicia sessió al teu compte
                    </p>

                    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }}>

                        {/* EMAIL */}
                        <div className={`${styles.field} ${styles.anim} ${styles.anim3}`}>
                            <label>Email</label>
                            <input
                                type="email"
                                value={loginForm.email}
                                onChange={(e) =>
                                    setLoginForm(prev => ({ ...prev, email: e.target.value }))
                                }
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                className={inputClass('email')}
                            />
                        </div>

                        {/* PASSWORD */}
                        <div className={`${styles.field} ${styles.anim} ${styles.anim4}`}>
                            <label>Contrasenya</label>
                            <input
                                type="password"
                                value={loginForm.password}
                                onChange={(e) =>
                                    setLoginForm(prev => ({ ...prev, password: e.target.value }))
                                }
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                className={inputClass('password')}
                            />
                        </div>

                        {/* ERROR */}
                        {errorAuth && (
                            <div className={styles.error}>
                                {errorAuth}
                            </div>
                        )}

                        {/* BUTTON */}
                        <div className={`${styles.anim} ${styles.anim5}`}>
                            <button
                                type="submit"
                                disabled={carregantAuth}
                                className={styles.button}
                            >
                                {carregantAuth ? (
                                    <span className={styles.loadingDots}>
                                        <span /><span /><span />
                                    </span>
                                ) : 'Iniciar sessió'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    )
}
