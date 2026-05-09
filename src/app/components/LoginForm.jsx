'use client'

import { useState } from 'react'
import { supabase } from '../../utils/supabase'
import styles from './loginForm.module.css'

// ============================================================
// Component: LoginForm — RF-AUTH-02, RF-AUTH-06
// ============================================================

export default function LoginForm({ loginForm, setLoginForm, onSubmit, errorAuth, carregantAuth }) {
    const [focusedField, setFocusedField] = useState(null)
    const [mostrarRecuperar, setMostrarRecuperar] = useState(false)
    const [emailRecuperar, setEmailRecuperar] = useState('')
    const [missatgeRecuperar, setMissatgeRecuperar] = useState(null)
    const [enviant, setEnviant] = useState(false)

    const inputClass = (field) =>
        `${styles.input} ${focusedField === field ? styles.inputFocus : ''}`

    const enviarEmailRecuperar = async () => {
        if (!emailRecuperar.trim()) return
        setEnviant(true)
        const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperar.trim(), {
            redirectTo: `${window.location.origin}#canviar-contrasenya`,
        })
        setEnviant(false)
        if (error) {
            setMissatgeRecuperar({ tipus: 'error', text: `Error: ${error.message}` })
        } else {
            setMissatgeRecuperar({ tipus: 'ok', text: 'Correu enviat! Revisa la teva bústia.' })
        }
    }

    // ── Pantalla de recuperar contrasenya ───────────────────
    if (mostrarRecuperar) {
        return (
            <div className={styles.wrapper}>
                <div className={`${styles.orb} ${styles.orb1}`} />
                <div className={`${styles.orb} ${styles.orb2}`} />
                <div className={`${styles.orb} ${styles.orb3}`} />

                <div className={styles.card}>
                    <div className={`${styles.header} ${styles.anim} ${styles.anim1}`}>
                        <div className={styles.logo}>Recover<span>IT</span></div>
                        <p className={styles.tagline}>La teva plataforma de recuperació guiada</p>
                    </div>

                    <div className={styles.content}>
                        <h2 className={`${styles.title} ${styles.anim} ${styles.anim2}`}>
                            Recuperar contrasenya
                        </h2>
                        <p className={`${styles.subtitle} ${styles.anim} ${styles.anim2}`}>
                            T'enviarem un correu per restablir la teva contrasenya.
                        </p>

                        <div className={`${styles.field} ${styles.anim} ${styles.anim3}`}>
                            <label>Email</label>
                            <input
                                type="email"
                                value={emailRecuperar}
                                onChange={(e) => setEmailRecuperar(e.target.value)}
                                onFocus={() => setFocusedField('emailRecuperar')}
                                onBlur={() => setFocusedField(null)}
                                className={inputClass('emailRecuperar')}
                                placeholder="el-teu@email.com"
                            />
                        </div>

                        {missatgeRecuperar && (
                            <div className={missatgeRecuperar.tipus === 'ok' ? styles.success : styles.error}>
                                {missatgeRecuperar.text}
                            </div>
                        )}

                        <div className={`${styles.anim} ${styles.anim4}`}>
                            <button
                                onClick={enviarEmailRecuperar}
                                disabled={enviant}
                                className={styles.button}
                            >
                                {enviant ? (
                                    <span className={styles.loadingDots}>
                                        <span /><span /><span />
                                    </span>
                                ) : 'Enviar correu'}
                            </button>
                        </div>

                        <button
                            onClick={() => { setMostrarRecuperar(false); setMissatgeRecuperar(null) }}
                            className={styles.forgotLink}
                        >
                            Tornar al login
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ── Pantalla de login normal ────────────────────────────
    return (
        <div className={styles.wrapper}>
            <div className={`${styles.orb} ${styles.orb1}`} />
            <div className={`${styles.orb} ${styles.orb2}`} />
            <div className={`${styles.orb} ${styles.orb3}`} />

            <div className={styles.card}>
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

                        <div className={styles.forgotRow}>
                            <button
                                type="button"
                                onClick={() => setMostrarRecuperar(true)}
                                className={styles.forgotLink}
                            >
                                Has oblidat la contrasenya?
                            </button>
                        </div>

                        {errorAuth && (
                            <div className={styles.error}>
                                {errorAuth}
                            </div>
                        )}

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