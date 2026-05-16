'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { getPacientsDeFisio, getProgresTotal } from '../utils/fisio'
import { desassignarFisio } from '../utils/diagFisio'
import AfegirPacientModal from './AfegirPacientModal'
import DetallsPacientModal from './DetallsPacientModal'
import styles from './LlistaPacients.module.css'

// ── Targeta individual de pacient ────────────────────────────
function TarjetaPacient({ pacient, onCanvi }) {
    const [progres, setProgres] = useState(null)
    const [confirmantDesassignar, setConfirmantDesassignar] = useState(false)
    const [desassignant, setDesassignant] = useState(false)
    const [mostrarDetalls, setMostrarDetalls] = useState(false)
    const handleDesassignar = async () => {
        if (!confirmantDesassignar) {
            setConfirmantDesassignar(true)
            return
        }

        setDesassignant(true)
        const res = await desassignarFisio(pacient.dni)
        setDesassignant(false)
        setConfirmantDesassignar(false)

        if (res.ok) {
            if (onCanvi) onCanvi()
        } else {
            alert(res.missatge || 'Error en desassignar el pacient')
        }
    }

    useEffect(() => {
        if (pacient.diagnostic) {
            getProgresTotal(pacient.diagnostic).then(setProgres)
        }
    }, [pacient])

    const esPendent = pacient.confirmat === false
    const fase = pacient.diagnostic?.fase_actual
    const finalitzat = pacient.diagnostic?.finalitzat

    // ── Badge: pendent / fase / completat / sense pla ───────
    const badgeLabel = esPendent
        ? 'Pla en confirmació'
        : finalitzat
            ? 'Completat'
            : fase
                ? `Fase ${fase}`
                : 'Sense pla'

    const badgeClass = esPendent
        ? styles.badgePendent
        : finalitzat
            ? styles.badgeComplet
            : fase
                ? styles.badgeFase
                : styles.badgeSensePla

    return (
        <div className={styles.tarjeta}>
            <div className={styles.tarjetaTop}>
                <div className={styles.avatar}>
                    {pacient.nom.charAt(0).toUpperCase()}
                </div>
                <span className={`${styles.badge} ${badgeClass}`}>{badgeLabel}</span>
            </div>

            <h3 className={styles.nom}>{pacient.nom}</h3>
            <p className={styles.dni}>DNI: {pacient.dni}</p>

            {/* ── Cas pendent: mostra info del diagnòstic assignat + codi ── */}
            {esPendent ? (
                <div>
                    {pacient.diagnosticPendent && (
                        <p className={styles.lesio}>
                            {pacient.diagnosticPendent.nom_lesio} · {pacient.diagnosticPendent.nom_muscul}
                        </p>
                    )}
                    <p className={styles.pendentText}>
                        El pacient encara no ha confirmat l'assignació
                    </p>
                    {pacient.codi_validacio && (
                        <p className={styles.codiValidacio}>
                            Codi: <strong>{pacient.codi_validacio}</strong>
                        </p>
                    )}
                    {/* ── Botó detalls (pendent) ── */}
                    <button onClick={() => setMostrarDetalls(true)} className={styles.veureDetallsBtn}>
                        Veure detalls pacient
                    </button>
                    <button onClick={() => desassignarFisio(pacient.dni)} className={styles.cancelarPendentBtn}>
                        Cancel·lar assignació
                    </button>
                </div>
            ) : pacient.diagnostic ? (
                // ── Cas normal: diagnòstic actiu amb progrés ─────────────
                <>
                    <p className={styles.lesio}>
                        {pacient.diagnostic.nom_lesio} · {pacient.diagnostic.nom_muscul}
                    </p>
                    {progres !== null && (
                        <div className={styles.progresBox}>
                            <div className={styles.progresCapçalera}>
                                <span className={styles.progresText}>Progrés</span>
                                <span className={styles.progresNum}>{progres}%</span>
                            </div>
                            <div className={styles.progresBarBg}>
                                <div
                                    className={styles.progresBarFill}
                                    style={{ width: `${progres}%` }}
                                />
                            </div>
                        </div>
                    )}
                    {/* ── Botó detalls (dalt del desvincular) ── */}
                    <button onClick={() => setMostrarDetalls(true)} className={styles.veureDetallsBtn}>
                        Veure detalls pacient
                    </button>
                    {!confirmantDesassignar ? (
                        <button onClick={handleDesassignar} className={styles.desvincularBtn}>
                            Desvincular
                        </button>
                    ) : (
                        <div className={styles.confirmInlineRow}>
                            <span className={styles.confirmText}>Segur? Deixarà de fer-lo seguiment.</span>
                            <button onClick={handleDesassignar} disabled={desassignant} className={styles.desvincularBtnActiu}>
                                {desassignant ? '...' : 'Sí'}
                            </button>
                            <button onClick={() => setConfirmantDesassignar(false)} className={styles.cancelInlineButton}>✕</button>
                        </div>
                    )}
                </>
            ) : (
                // ── Cas sense diagnòstic ──────────────────────────────────
                <>
                    <p className={styles.senseDiag}>Sense diagnòstic assignat</p>
                    <button onClick={() => setMostrarDetalls(true)} className={styles.veureDetallsBtn}>
                        Veure detalls pacient
                    </button>
                </>
            )}

            {/* ── Modal de detalls ── */}
            {mostrarDetalls && (
                <DetallsPacientModal
                    dniPacient={pacient.dni}
                    nomPacient={pacient.nom}
                    onTancar={() => setMostrarDetalls(false)}
                />
            )}
        </div>
    )
}

export default function LlistaPacients({ perfilUsuari }) {
    const [pacients, setPacients] = useState([])
    const [carregant, setCarregant] = useState(true)
    const [modalObert, setModalObert] = useState(false)
    const [cerca, setCerca] = useState('')
    const [confirmantDesassignar, setConfirmantDesassignar] = useState(false)
    

    const canalRef = useRef(null)

    const carregarPacients = async () => {
        if (!perfilUsuari?.dni) return
        setCarregant(true)
        const llista = await getPacientsDeFisio(perfilUsuari.dni)
        setPacients(llista)
        setCarregant(false)
    }

    useEffect(() => {
        carregarPacients()

        // ── Realtime: actualitzar quan canvia la llista de pacients o diagnòstics ──
        if (perfilUsuari?.dni) {
            canalRef.current = supabase
                .channel(`llista-pacients-${perfilUsuari.dni}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'relacio_fisio_pacient', filter: `dni_fisio=eq.${perfilUsuari.dni}` }, carregarPacients)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'diagnostic' }, carregarPacients)
                .subscribe()
        }

        return () => {
            if (canalRef.current) supabase.removeChannel(canalRef.current)
        }
    }, [perfilUsuari?.dni])

    const pacientsFiltrats = pacients.filter(p =>
        p.nom.toLowerCase().includes(cerca.toLowerCase()) ||
        p.dni.toLowerCase().includes(cerca.toLowerCase())
    )

    return (
        <div className={styles.contenidor}>
            <div className={styles.topBar}>
                <div>
                    <h1 className={styles.titol}>Pacients</h1>
                    <p className={styles.subtitol}>{pacients.length} pacients vinculats</p>
                </div>
                <button className={styles.afegirBtn} onClick={() => setModalObert(true)}>
                    <span>+</span> Afegir pacient
                </button>
            </div>

            <div className={styles.cercaBox}>
                <span className={styles.cercaIcon}>🔍</span>
                <input
                    className={styles.cercaInput}
                    type="text"
                    placeholder="Cercar per nom o DNI..."
                    value={cerca}
                    onChange={e => setCerca(e.target.value)}
                />
            </div>

            {carregant ? (
                <div className={styles.carregant}>
                    <div className={styles.spinner} />
                </div>
            ) : pacientsFiltrats.length === 0 ? (
                <div className={styles.buit}>
                    {cerca
                        ? <p>No s'ha trobat cap pacient amb "{cerca}".</p>
                        : <>
                            <p>Encara no tens cap pacient vinculat.</p>
                            <button
                                className={styles.afegirBtnSecundari}
                                onClick={() => setModalObert(true)}
                            >
                                Afegir el primer pacient
                            </button>
                        </>
                    }
                </div>
            ) : (
                <div className={styles.grid}>
                    {pacientsFiltrats.map(p => (
                        <TarjetaPacient key={p.dni} pacient={p} onCanvi={carregarPacients} />
                    ))}
                </div>
            )}

            {modalObert && (
                <AfegirPacientModal
                    dniFisio={perfilUsuari.dni}
                    onTancar={() => setModalObert(false)}
                    onPacientAfegit={carregarPacients}
                />
            )}
        </div>
    )
}
