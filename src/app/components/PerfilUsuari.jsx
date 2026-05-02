'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import styles from './perfilUsuari.module.css'

// ============================================================
// Component: PerfilUsuari — RF-AUTH-07, RF-AUTH-09, RF-AUTH-10
// ============================================================
export default function PerfilUsuari({ perfilUsuari, onEditarPerfil }) {
    const [editant, setEditant] = useState(false)
    const [nouNom, setNouNom] = useState('')
    const [animant, setAnimant] = useState(false)
    const puntsAnteriors = useRef(perfilUsuari?.punts_recuperacio ?? 0)

    // Canvi de contrasenya
    const [mostrarContrasenya, setMostrarContrasenya] = useState(false)
    const [novaContrasenya, setNovaContrasenya] = useState('')
    const [confirmarContrasenya, setConfirmarContrasenya] = useState('')
    const [missatgeContrasenya, setMissatgeContrasenya] = useState(null)
    const [guardantContrasenya, setGuardantContrasenya] = useState(false)

    useEffect(() => {
        const nous = perfilUsuari?.punts_recuperacio ?? 0
        if (nous > puntsAnteriors.current) {
            setAnimant(true)
            setTimeout(() => setAnimant(false), 600)
        }
        puntsAnteriors.current = nous
    }, [perfilUsuari?.punts_recuperacio])

    const iniciarEdicio = () => {
        setNouNom(perfilUsuari?.nom || '')
        setEditant(true)
    }

    const cancellarEdicio = () => {
        setEditant(false)
        setNouNom('')
    }

    const guardarNom = async () => {
        if (!nouNom.trim()) return
        await onEditarPerfil(nouNom)
        setEditant(false)
        setNouNom('')
    }

    const canviarContrasenya = async () => {
        setMissatgeContrasenya(null)

        if (!novaContrasenya || !confirmarContrasenya) {
            setMissatgeContrasenya({ tipus: 'error', text: 'Omple tots els camps.' })
            return
        }
        if (novaContrasenya.length < 6) {
            setMissatgeContrasenya({ tipus: 'error', text: 'La contrasenya ha de tenir mínim 6 caràcters.' })
            return
        }
        if (novaContrasenya !== confirmarContrasenya) {
            setMissatgeContrasenya({ tipus: 'error', text: 'Les contrasenyes no coincideixen.' })
            return
        }

        setGuardantContrasenya(true)
        const { error } = await supabase.auth.updateUser({ password: novaContrasenya })
        setGuardantContrasenya(false)

        if (error) {
            setMissatgeContrasenya({ tipus: 'error', text: `Error: ${error.message}` })
        } else {
            setMissatgeContrasenya({ tipus: 'ok', text: 'Contrasenya canviada correctament.' })
            setNovaContrasenya('')
            setConfirmarContrasenya('')
            setTimeout(() => {
                setMostrarContrasenya(false)
                setMissatgeContrasenya(null)
            }, 2000)
        }
    }

    return (
        <section className={styles.container}>
            <h2 className={styles.title}>El meu perfil</h2>

            {!perfilUsuari && (
                <p className={styles.textMuted}>No s'han trobat dades del perfil.</p>
            )}

            {perfilUsuari && (
                <div className={styles.card}>

                    {/* Nom */}
                    <div className={styles.field}>
                        <span className={styles.label}>Nom</span>
                        {editant ? (
                            <div className={styles.editRow}>
                                <input
                                    type="text"
                                    value={nouNom}
                                    onChange={(e) => setNouNom(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') guardarNom()
                                        if (e.key === 'Escape') cancellarEdicio()
                                    }}
                                    autoFocus
                                    className={styles.inputEdit}
                                />
                                <button onClick={guardarNom} className={styles.saveButton}>Guardar</button>
                                <button onClick={cancellarEdicio} className={styles.cancelButton}>✕</button>
                            </div>
                        ) : (
                            <div className={styles.displayRow}>
                                <p className={styles.value}>{perfilUsuari.nom}</p>
                                <button onClick={iniciarEdicio} className={styles.editInlineButton}>
                                    Editar
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={styles.divider} />

                    {/* DNI */}
                    <div className={styles.field}>
                        <span className={styles.label}>DNI</span>
                        <p className={styles.value}>{perfilUsuari.dni}</p>
                    </div>

                    <div className={styles.divider} />

                    {/* Progrés de recuperació */}
                    <div className={styles.field}>
                        <span className={styles.label}>Progrés de recuperació</span>
                        <div className={styles.progressInfo}>
                            <span className={styles.progressText}>
                                {perfilUsuari.punts_recuperacio ?? 0} / {perfilUsuari.puntsFinals ?? 0} punts
                            </span>
                            <span className={`${styles.progressPercent} ${animant ? styles.puntsAnimat : ''}`}>
                                {perfilUsuari?.puntsFinals > 0
                                    ? Math.round((perfilUsuari.punts_recuperacio / perfilUsuari.puntsFinals) * 100)
                                    : 0}%
                            </span>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{
                                    width: perfilUsuari.puntsFinals > 0
                                        ? `${Math.min((perfilUsuari.punts_recuperacio / perfilUsuari.puntsFinals) * 100, 100)}%`
                                        : '0%'
                                }}
                            />
                        </div>
                    </div>

                    <div className={styles.divider} />

                    {/* Rol */}
                    <div className={styles.field}>
                        <span className={styles.label}>Rol</span>
                        <p className={styles.value}>
                            {perfilUsuari.es_fisioterapeuta ? 'Fisioterapeuta' : 'Pacient'}
                        </p>
                    </div>

                    <div className={styles.divider} />

                    {/* Canviar contrasenya */}
                    <div className={styles.field}>
                        <span className={styles.label}>Contrasenya</span>

                        {!mostrarContrasenya ? (
                            <button
                                onClick={() => setMostrarContrasenya(true)}
                                className={styles.editInlineButton}
                            >
                                Canviar contrasenya
                            </button>
                        ) : (
                            <div className={styles.passwordSection}>
                                <input
                                    type="password"
                                    placeholder="Nova contrasenya"
                                    value={novaContrasenya}
                                    onChange={(e) => setNovaContrasenya(e.target.value)}
                                    className={styles.inputEdit}
                                />
                                <input
                                    type="password"
                                    placeholder="Confirmar contrasenya"
                                    value={confirmarContrasenya}
                                    onChange={(e) => setConfirmarContrasenya(e.target.value)}
                                    className={styles.inputEdit}
                                />

                                {missatgeContrasenya && (
                                    <p className={missatgeContrasenya.tipus === 'ok' ? styles.successText : styles.errorText}>
                                        {missatgeContrasenya.text}
                                    </p>
                                )}

                                <div className={styles.editRow}>
                                    <button
                                        onClick={canviarContrasenya}
                                        disabled={guardantContrasenya}
                                        className={styles.saveButton}
                                    >
                                        {guardantContrasenya ? 'Guardant...' : 'Guardar'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMostrarContrasenya(false)
                                            setMissatgeContrasenya(null)
                                            setNovaContrasenya('')
                                            setConfirmarContrasenya('')
                                        }}
                                        className={styles.cancelButton}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            )}
        </section>
    )
}