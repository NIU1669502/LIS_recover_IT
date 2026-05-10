'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../utils/supabase'
import styles from './detallsPacientModal.module.css'

// ============================================================
// Component: DetallsPacientModal
// Mostra informació personal i mèdica completa d'un pacient
// al fisioterapeuta que el té assignat.
// ============================================================

async function getDetallsPacient(dniPacient) {
    // ── 1. Dades personals ───────────────────────────────────
    const { data: usuari } = await supabase
        .from('usuaris')
        .select('dni, nom')
        .eq('dni', dniPacient)
        .maybeSingle()

    // ── 2. Tots els diagnòstics del pacient ──────────────────
    const { data: diagnostics } = await supabase
        .from('diagnostic')
        .select(`
            id_diagnostic,
            fase_actual,
            num_sessions,
            finalitzat,
            punts_recuperacio,
            puntsFinals,
            descripcio,
            id_lesio,
            part_cos
        `)
        .eq('dni_pacient', dniPacient)
        .order('id_diagnostic', { ascending: false })

    // Enriquir cada diagnòstic amb noms de lesió i múscul
    let diagnosticsEnriquits = []
    if (diagnostics && diagnostics.length > 0) {
        const idsLesions = [...new Set(diagnostics.map(d => d.id_lesio).filter(Boolean))]
        const idsMusculs = [...new Set(diagnostics.map(d => d.part_cos).filter(Boolean))]

        const [{ data: lesions }, { data: musculs }] = await Promise.all([
            idsLesions.length > 0
                ? supabase.from('lesions').select('id_lesio, nom').in('id_lesio', idsLesions)
                : Promise.resolve({ data: [] }),
            idsMusculs.length > 0
                ? supabase.from('musculs').select('id_cos, nom').in('id_cos', idsMusculs)
                : Promise.resolve({ data: [] }),
        ])

        const nomLesions = Object.fromEntries((lesions || []).map(l => [l.id_lesio, l.nom]))
        const nomMusculs = Object.fromEntries((musculs || []).map(m => [m.id_cos, m.nom]))

        diagnosticsEnriquits = diagnostics.map(d => ({
            ...d,
            nomLesio: nomLesions[d.id_lesio] || 'Desconeguda',
            nomMuscul: nomMusculs[d.part_cos] || 'Desconegut',
        }))
    }

    // Diagnòstic actiu = el primer no finalitzat, o el més recent si tots estan finalitzats
    const diagnostic = diagnosticsEnriquits.find(d => !d.finalitzat) || diagnosticsEnriquits[0] || null

    // ── 3. Historial de sessions ─────────────────────────────
    const { data: sessions } = await supabase
        .from('historial_sessions')
        .select(`
            id_sessio,
            data_realitzacio,
            fase,
            punts_obtinguts,
            lesions ( nom )
        `)
        .eq('dni_pacient', dniPacient)
        .order('data_realitzacio', { ascending: false })
        .limit(20)

    return {
        usuari,
        diagnostic,
        historialLesions: diagnosticsEnriquits,
        sessions: sessions || [],
    }
}

const formatDia = (iso) => {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleDateString('ca-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    } catch {
        return iso
    }
}

export default function DetallsPacientModal({ dniPacient, nomPacient, onTancar }) {
    const [dades, setDades] = useState(null)
    const [carregant, setCarregant] = useState(true)

    useEffect(() => {
        setCarregant(true)
        getDetallsPacient(dniPacient).then(res => {
            setDades(res)
            setCarregant(false)
        })
    }, [dniPacient])

    // Tancar amb Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onTancar() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onTancar])

    const diag = dades?.diagnostic
    const progres = diag?.puntsFinals > 0
        ? Math.min(Math.round((diag.punts_recuperacio / diag.puntsFinals) * 100), 100)
        : 0

    const modal = (
        <div className={styles.overlay} onClick={onTancar}>
            <div className={styles.panel} onClick={e => e.stopPropagation()}>

                {/* ── Capçalera ── */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.avatar}>
                            {nomPacient?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                            <h2 className={styles.nom}>{nomPacient}</h2>
                            <span className={styles.rolBadge}>Pacient</span>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onTancar} aria-label="Tancar">✕</button>
                </div>

                {carregant ? (
                    <div className={styles.carregant}>
                        <div className={styles.spinner} />
                        <p>Carregant dades del pacient...</p>
                    </div>
                ) : (
                    <div className={styles.cos}>

                        {/* ── Informació personal ── */}
                        <section className={styles.seccio}>
                            <p className={styles.seccioTitol}>
                                <span className={styles.seccioIcon}>👤</span>
                                Informació personal
                            </p>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Nom complet</span>
                                    <span className={styles.infoValue}>{dades?.usuari?.nom || '—'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>DNI</span>
                                    <span className={`${styles.infoValue} ${styles.mono}`}>{dades?.usuari?.dni || '—'}</span>
                                </div>
                            </div>
                        </section>

                        <div className={styles.divider} />

                        {/* ── Diagnòstic actiu ── */}
                        <section className={styles.seccio}>
                            <p className={styles.seccioTitol}>
                                <span className={styles.seccioIcon}>🩺</span>
                                Diagnòstic actiu
                            </p>

                            {diag ? (
                                <>
                                    <div className={styles.infoGrid}>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Lesió</span>
                                            <span className={styles.infoValue}>{diag.nomLesio}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Múscul / Zona</span>
                                            <span className={styles.infoValue}>{diag.nomMuscul}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Fase actual</span>
                                            <span className={styles.infoValue}>
                                                {diag.finalitzat
                                                    ? <span className={styles.badgeComplet}>Completat</span>
                                                    : <span className={styles.badgeFase}>Fase {diag.fase_actual}</span>
                                                }
                                            </span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Sessions completades</span>
                                            <span className={styles.infoValue}>{diag.num_sessions ?? 0}</span>
                                        </div>
                                    </div>

                                    {diag.descripcio && (
                                        <div className={styles.descripcioBox}>
                                            <span className={styles.infoLabel}>Descripció clínica</span>
                                            <p className={styles.descripcioText}>{diag.descripcio}</p>
                                        </div>
                                    )}

                                    {/* Barra de progrés */}
                                    <div className={styles.progresBox}>
                                        <div className={styles.progresCapcalera}>
                                            <span className={styles.progresLabel}>Progrés de recuperació</span>
                                            <span className={styles.progresNum}>{progres}%</span>
                                        </div>
                                        <div className={styles.progresBarBg}>
                                            <div
                                                className={styles.progresBarFill}
                                                style={{ width: `${progres}%` }}
                                            />
                                        </div>
                                        <p className={styles.progresDetall}>
                                            {diag.punts_recuperacio ?? 0} / {diag.puntsFinals ?? 0} punts
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <p className={styles.senseDades}>Aquest pacient no té cap diagnòstic actiu.</p>
                            )}
                        </section>

                        <div className={styles.divider} />

                        {/* ── Historial de sessions ── */}
                        <section className={styles.seccio}>
                            <p className={styles.seccioTitol}>
                                <span className={styles.seccioIcon}>📋</span>
                                Historial de sessions
                                <span className={styles.comptador}>{dades?.sessions?.length ?? 0}</span>
                            </p>

                            {dades?.sessions?.length > 0 ? (
                                <div className={styles.sessionsList}>
                                    {dades.sessions.map((s) => (
                                        <div key={s.id_sessio} className={styles.sessioRow}>
                                            <div className={styles.sessioData}>{formatDia(s.data_realitzacio)}</div>
                                            <div className={styles.sessioBadge}>Fase {s.fase}</div>
                                            <div className={styles.sessioLesio}>{s.lesions?.nom || '—'}</div>
                                            <div className={styles.sessioPunts}>+{s.punts_obtinguts ?? 0} pts</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.senseDades}>Encara no hi ha sessions registrades.</p>
                            )}
                        </section>

                        <div className={styles.divider} />

                        {/* ── Historial de lesions ── */}
                        <section className={styles.seccio}>
                            <p className={styles.seccioTitol}>
                                <span className={styles.seccioIcon}>🦴</span>
                                Historial de lesions
                                <span className={styles.comptador}>{dades?.historialLesions?.length ?? 0}</span>
                            </p>

                            {dades?.historialLesions?.length > 0 ? (
                                <div className={styles.lesionsList}>
                                    {dades.historialLesions.map((d) => (
                                        <div key={d.id_diagnostic} className={styles.lesioRow}>
                                            <div className={styles.lesioLeft}>
                                                <span className={styles.lesioNom}>{d.nomLesio}</span>
                                                <span className={styles.lesioMuscul}>{d.nomMuscul}</span>
                                            </div>
                                            <div className={styles.lesioRight}>
                                                <span className={styles.lesioSessions}>{d.num_sessions ?? 0} sessions</span>
                                                {d.finalitzat
                                                    ? <span className={styles.badgeComplet}>Completat</span>
                                                    : <span className={styles.badgeFase}>En curs · Fase {d.fase_actual}</span>
                                                }
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.senseDades}>Encara no hi ha lesions registrades.</p>
                            )}
                        </section>

                    </div>
                )}
            </div>
        </div>
    )

    if (typeof document === 'undefined') return null
    return createPortal(modal, document.body)
}
