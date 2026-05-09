'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { confirmarCodiFisio, desassignarFisio } from '../utils/diagFisio'
import { showToast } from '../utils/toast'
import styles from './perfilUsuari.module.css'

// ============================================================
// Component: PerfilUsuari — RF-AUTH-07, RF-AUTH-09, RF-AUTH-10
// Distingeix entre pacient (mostra progrés + codi fisio)
// i fisioterapeuta (sense progrés ni codi)
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

    // Afegir codi de confirmació del fisio (només pacients)
    const [mostrarCodi, setMostrarCodi] = useState(false)
    const [codiInput, setCodiInput] = useState('')
    const [missatgeCodi, setMissatgeCodi] = useState(null)
    const [enviantCodi, setEnviantCodi] = useState(false)

    // Desassignar fisioterapeuta
    const [confirmantDesassignar, setConfirmantDesassignar] = useState(false)
    const [desassignant, setDesassignant] = useState(false)
    const [teFisioAssignat, setTeFisioAssignat] = useState(false)

    const esFisio = perfilUsuari?.es_fisioterapeuta === true

    useEffect(() => {
        const nous = perfilUsuari?.punts_recuperacio ?? 0
        if (nous > puntsAnteriors.current) {
            setAnimant(true)
            setTimeout(() => setAnimant(false), 600)
        }
        puntsAnteriors.current = nous
    }, [perfilUsuari?.punts_recuperacio])

    // Comprova si el pacient té un fisio assignat + Realtime
    useEffect(() => {
        if (!perfilUsuari?.dni || esFisio) return

        const comprovarFisio = async () => {
            const { data } = await supabase
                .from('relacio_fisio_pacient')
                .select('dni_fisio')
                .eq('dni_pacient', perfilUsuari.dni)
                .eq('confirmat', true)
                .limit(1)
                .maybeSingle()
            setTeFisioAssignat(!!data)
        }

        comprovarFisio()

        // ── Realtime: actualitzar quan canvia la relació fisio-pacient ──
        const canal = supabase
            .channel(`perfil-relacio-${perfilUsuari.dni}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'relacio_fisio_pacient', filter: `dni_pacient=eq.${perfilUsuari.dni}` }, comprovarFisio)
            .subscribe()

        return () => { supabase.removeChannel(canal) }
    }, [perfilUsuari?.dni, esFisio])

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

    // ── RF-PAC-XX — Confirmar codi del fisioterapeuta ────────
    const confirmarCodi = async () => {
        setMissatgeCodi(null)

        if (!codiInput.trim()) {
            setMissatgeCodi({ tipus: 'error', text: 'Introdueix el codi.' })
            return
        }

        setEnviantCodi(true)
        const resultat = await confirmarCodiFisio(perfilUsuari.dni, codiInput)
        setEnviantCodi(false)

        if (!resultat.ok) {
            setMissatgeCodi({ tipus: 'error', text: resultat.missatge })
        } else {
            setMissatgeCodi({ tipus: 'ok', text: 'Codi validat correctament! El teu fisioterapeuta ha estat assignat.' })
            setCodiInput('')
            showToast('Fisioterapeuta assignat correctament!', 'success')
            setTimeout(() => {
                setMostrarCodi(false)
                setMissatgeCodi(null)
            }, 2500)
        }
    }

    // ── Desassignar fisioterapeuta ────────────────────────────
    const handleDesassignar = async () => {
        if (!confirmantDesassignar) {
            setConfirmantDesassignar(true)
            return
        }
        setDesassignant(true)
        const resultat = await desassignarFisio(perfilUsuari.dni)
        setDesassignant(false)
        setConfirmantDesassignar(false)
        if (!resultat.ok) {
            showToast(`Error: ${resultat.missatge}`, 'error')
        } else {
            setTeFisioAssignat(false)
            showToast('Fisioterapeuta desassignat correctament.', 'success')
        }
    }

    return (
    <section className={styles.container}>

        {!perfilUsuari && (
            <p className={styles.textMuted}>No s'han trobat dades del perfil.</p>
        )}

        {perfilUsuari && (
            <>

                <div className={styles.card}>
                    <div className={styles.header}>
                        <div className={styles.avatar}>
                        {perfilUsuari.nom?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className={styles.headerText}>
                            <p className={styles.headerName}>{perfilUsuari.nom}</p>
                            <p className={styles.headerRole}>
                                {esFisio ? 'Fisioterapeuta' : 'Pacient'} · {perfilUsuari.dni}
                            </p>
                        </div>
                    </div>
                    {/* Informació personal */}
                    <p className={styles.sectionTitle}>Informació personal</p>

                    <div className={styles.fieldRow}>
                        <span className={styles.fieldLabel}>
                            <i className="ti ti-user" aria-hidden="true" />
                            Nom
                        </span>
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
                            <div className={styles.fieldRight}>
                                <span className={styles.fieldValue}>{perfilUsuari.nom}</span>
                                <button onClick={iniciarEdicio} className={styles.editInlineButton}>Editar</button>
                            </div>
                        )}
                    </div>

                    <div className={styles.fieldRow}>
                        <span className={styles.fieldLabel}>
                            <i className="ti ti-id-badge" aria-hidden="true" />
                            DNI
                        </span>
                        <span className={styles.fieldValueMono}>{perfilUsuari.dni}</span>
                    </div>

                    <div className={styles.fieldRow}>
                        <span className={styles.fieldLabel}>
                            <i className="ti ti-shield-check" aria-hidden="true" />
                            Rol
                        </span>
                        <span className={styles.badge}>{esFisio ? 'Fisioterapeuta' : 'Pacient'}</span>
                    </div>

                    {/* Recuperació — només pacients */}
                    {!esFisio && (
                        <>
                            <div className={styles.sectionDivider} />
                            <p className={styles.sectionTitle}>Recuperació</p>
                            <div className={styles.progressWrap}>
                                <div className={styles.progressMeta}>
                                    <span>{perfilUsuari.punts_recuperacio ?? 0} / {perfilUsuari.puntsFinals ?? 0} pts</span>
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
                        </>
                    )}

                    {/* Fisioterapeuta — només pacients */}
                    {!esFisio && (
                        <>
                            <div className={styles.sectionDivider} />
                            <p className={styles.sectionTitle}>Fisioterapeuta</p>

                            {!teFisioAssignat && (
                                <div className={styles.fieldRow}>
                                    <span className={styles.fieldLabel}>
                                        <i className="ti ti-stethoscope" aria-hidden="true" />
                                        Codi de confirmació
                                    </span>
                                    {!mostrarCodi ? (
                                        <button onClick={() => setMostrarCodi(true)} className={styles.codiButton}>
                                            <i className="ti ti-plus" aria-hidden="true" />
                                            Afegir codi
                                        </button>
                                    ) : (
                                        <div className={styles.editRow}>
                                            <input
                                                type="text"
                                                placeholder="Codi del fisioterapeuta"
                                                value={codiInput}
                                                onChange={(e) => setCodiInput(e.target.value.toUpperCase())}
                                                onKeyDown={(e) => e.key === 'Enter' && confirmarCodi()}
                                                className={styles.inputEdit}
                                                style={{ letterSpacing: '0.1em', fontFamily: 'monospace' }}
                                                autoFocus
                                            />
                                            <button onClick={confirmarCodi} disabled={enviantCodi} className={styles.saveButton}>
                                                {enviantCodi ? '...' : 'Confirmar'}
                                            </button>
                                            <button onClick={() => { setMostrarCodi(false); setMissatgeCodi(null); setCodiInput('') }} className={styles.cancelButton}>✕</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {missatgeCodi && (
                                <p className={missatgeCodi.tipus === 'ok' ? styles.successText : styles.errorText} style={{ padding: '0 1.25rem 0.75rem' }}>
                                    {missatgeCodi.text}
                                </p>
                            )}

                            {teFisioAssignat && (
                                <div className={styles.fieldRow}>
                                    <span className={styles.fieldLabel}>
                                        <i className="ti ti-stethoscope" aria-hidden="true" />
                                        Fisioterapeuta assignat
                                    </span>
                                    {!confirmantDesassignar ? (
                                        <button onClick={handleDesassignar} className={styles.dangerButton}>
                                            Desassignar
                                        </button>
                                    ) : (
                                        <div className={styles.confirmInlineRow}>
                                            <span className={styles.confirmText}>Segur? Es finalitzarà el diagnòstic actiu.</span>
                                            <button onClick={handleDesassignar} disabled={desassignant} className={styles.dangerButton}>
                                                {desassignant ? '...' : 'Sí'}
                                            </button>
                                            <button onClick={() => setConfirmantDesassignar(false)} className={styles.cancelInlineButton}>✕</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* Seguretat */}
                    <div className={styles.sectionDivider} />
                    <p className={styles.sectionTitle}>Seguretat</p>

                    <div className={styles.fieldRow}>
                        <span className={styles.fieldLabel}>
                            <i className="ti ti-lock" aria-hidden="true" />
                            Contrasenya
                        </span>
                        {!mostrarContrasenya ? (
                            <button onClick={() => setMostrarContrasenya(true)} className={styles.editInlineButton}>
                                Canviar
                            </button>
                        ) : null}
                    </div>

                    {mostrarContrasenya && (
                        <div className={styles.passwordSection}>
                            <input type="password" placeholder="Nova contrasenya" value={novaContrasenya} onChange={(e) => setNovaContrasenya(e.target.value)} className={styles.inputEdit} />
                            <input type="password" placeholder="Confirmar contrasenya" value={confirmarContrasenya} onChange={(e) => setConfirmarContrasenya(e.target.value)} className={styles.inputEdit} />
                            {missatgeContrasenya && (
                                <p className={missatgeContrasenya.tipus === 'ok' ? styles.successText : styles.errorText}>
                                    {missatgeContrasenya.text}
                                </p>
                            )}
                            <div className={styles.editRow}>
                                <button onClick={canviarContrasenya} disabled={guardantContrasenya} className={styles.saveButton}>
                                    {guardantContrasenya ? 'Guardant...' : 'Guardar'}
                                </button>
                                <button onClick={() => { setMostrarContrasenya(false); setMissatgeContrasenya(null); setNovaContrasenya(''); setConfirmarContrasenya('') }} className={styles.cancelButton}>✕</button>
                            </div>
                        </div>
                    )}

                </div>
            </>
        )}
    </section>
)}