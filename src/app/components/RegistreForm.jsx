'use client'

import { useState } from 'react'
import styles from './registreForm.module.css'

// ============================================================
// Component: RegistreForm — pantalla pública (sin sidebar)
// ============================================================

export default function RegistreForm({
    registreForm,
    setRegistreForm,
    onSubmit,
    errorAuth,
    carregantAuth
}) {
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
                    <div className={styles.logo}>
                        Recover<span>IT</span>
                    </div>
                    <p className={styles.tagline}>
                        La teva plataforma de recuperació guiada
                    </p>
                </div>

                <div className={styles.content}>
                    <h2 className={`${styles.title} ${styles.anim} ${styles.anim2}`}>
                        Crea el teu compte
                    </h2>

                    <p className={`${styles.subtitle} ${styles.anim} ${styles.anim2}`}>
                        Comença la teva recuperació avui mateix
                    </p>

                    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }}>

                        <div className={`${styles.field} ${styles.anim} ${styles.anim3}`}>
                            <label>Nom complet</label>
                            <input
                                type="text"
                                value={registreForm.nom}
                                onChange={(e) =>
                                    setRegistreForm(prev => ({ ...prev, nom: e.target.value }))
                                }
                                onFocus={() => setFocusedField('nom')}
                                onBlur={() => setFocusedField(null)}
                                className={inputClass('nom')}
                            />
                        </div>

                        <div className={`${styles.field} ${styles.anim} ${styles.anim3}`}>
                            <label>DNI (8 xifres i lletra)</label>
                            <input
                                type="text"
                                inputMode="text"
                                autoComplete="off"
                                maxLength={9}
                                placeholder="12345678Z"
                                value={registreForm.dni}
                                onChange={(e) =>
                                    setRegistreForm(prev => ({ ...prev, dni: e.target.value }))
                                }
                                onFocus={() => setFocusedField('dni')}
                                onBlur={() => setFocusedField(null)}
                                className={inputClass('dni')}
                            />
                        </div>

                        <div className={`${styles.field} ${styles.anim} ${styles.anim4}`}>
                            <label>Correu electrònic</label>
                            <input
                                type="email"
                                autoComplete="email"
                                placeholder="nom@exemple.cat"
                                value={registreForm.email}
                                onChange={(e) =>
                                    setRegistreForm(prev => ({ ...prev, email: e.target.value }))
                                }
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                className={inputClass('email')}
                            />
                        </div>

                        <div className={`${styles.field} ${styles.anim} ${styles.anim5}`}>
                            <label>Contrasenya</label>
                            <input
                                type="password"
                                value={registreForm.password}
                                onChange={(e) =>
                                    setRegistreForm(prev => ({ ...prev, password: e.target.value }))
                                }
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                className={inputClass('password')}
                            />
                        </div>

                        {errorAuth && (
                            <div className={styles.error}>
                                {errorAuth}
                            </div>
                        )}

                        <div className={`${styles.anim} ${styles.anim6}`}>
                            <button
                                type="submit"
                                disabled={carregantAuth}
                                className={styles.button}
                            >
                                {carregantAuth ? (
                                    <span className={styles.loadingDots}>
                                        <span /><span /><span />
                                    </span>
                                ) : 'Registrar-me'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    )
}
