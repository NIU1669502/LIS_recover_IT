'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../utils/supabase'
import GraficaRecuperacio from './GraficaRecuperacio'
import styles from './detallsPacientModal.module.css'
import EditarRutinaModal from './EditarRutinaModal'

// ── Helper: color i etiqueta segons nivell de dolor ─────────
function dolorColor(valor) {
    if (valor == null) return '#94a3b8'
    if (valor <= 3) return '#22c55e'
    if (valor <= 6) return '#f59e0b'
    return '#ef4444'
}

function dolorEtiqueta(valor) {
    if (valor == null) return '—'
    if (valor <= 3) return 'Baix'
    if (valor <= 6) return 'Moderat'
    return 'Alt'
}

// ── Fila de sessió expandible ────────────────────────────────
function FilaSessio({ sessio }) {
    const [expandit, setExpandit] = useState(false)

    const dolorExercicis = (() => {
        try {
            if (!sessio.dolor_exercicis) return []
            if (typeof sessio.dolor_exercicis === 'string') return JSON.parse(sessio.dolor_exercicis)
            return sessio.dolor_exercicis
        } catch { return [] }
    })()

    const teDolor = sessio.dolor_sessio != null || dolorExercicis.length > 0

    return (
        <div className={styles.sessioCard}>
            <div
                className={`${styles.sessioRow} ${teDolor ? styles.sessioRowClickable : ''}`}
                onClick={() => teDolor && setExpandit(e => !e)}
            >
                <div className={styles.sessioData}>{formatDia(sessio.data_realitzacio)}</div>
                <div className={styles.sessioBadge}>Fase {sessio.fase}</div>
                <div className={styles.sessioLesio}>{sessio.lesions?.nom || '—'}</div>
                <div className={styles.sessioLesio}>{sessio.diagnostic?.musculs?.nom || '—'}</div>
                <div className={styles.sessioPunts}>+{sessio.punts_obtinguts ?? 0} pts</div>

                {/* Indicador dolor sessió */}
                {sessio.dolor_sessio != null ? (
                    <div
                        className={styles.dolorBadge}
                        style={{ background: dolorColor(sessio.dolor_sessio) + '20', color: dolorColor(sessio.dolor_sessio), borderColor: dolorColor(sessio.dolor_sessio) + '40' }}
                    >
                        {sessio.dolor_sessio}/10 · {dolorEtiqueta(sessio.dolor_sessio)}
                    </div>
                ) : (
                    <div className={styles.dolorBadgeNull}>Sense valoració</div>
                )}

                {teDolor && (
                    <span className={styles.expandIcon}>{expandit ? '▲' : '▼'}</span>
                )}
            </div>

            {/* Detall per exercici */}
            {expandit && dolorExercicis.length > 0 && (
                <div className={styles.dolorDetall}>
                    <p className={styles.dolorDetallTitol}>Dolor per exercici:</p>
                    {dolorExercicis.map((ex, i) => (
                        <div key={i} className={styles.dolorExerciciRow}>
                            <span className={styles.dolorExerciciNom}>{ex.nom}</span>
                            {ex.dolor != null ? (
                                <span
                                    className={styles.dolorExerciciVal}
                                    style={{ color: dolorColor(ex.dolor) }}
                                >
                                    {ex.dolor}/10
                                </span>
                            ) : (
                                <span className={styles.dolorExerciciNull}>No valorat</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Helpers ──────────────────────────────────────────────────
async function getDetallsPacient(dniPacient) {
    const { data: usuari } = await supabase
        .from('usuaris')
        .select('dni, nom')
        .eq('dni', dniPacient)
        .maybeSingle()

    const { data: diagnostics } = await supabase
        .from('diagnostic')
        .select(`id_diagnostic, fase_actual, num_sessions, finalitzat, punts_recuperacio, puntsFinals, descripcio, id_lesio, part_cos`)
        .eq('dni_pacient', dniPacient)
        .order('id_diagnostic', { ascending: false })

    const { data: relacions } = await supabase
        .from('relacio_fisio_pacient')
        .select('id_lesio, part_cos, confirmat, descripcio, codi_validacio')
        .eq('dni_pacient', dniPacient)

    const allLesions = [...(diagnostics || []).map(d => d.id_lesio), ...(relacions || []).map(r => r.id_lesio)]
    const allMusculs = [...(diagnostics || []).map(d => d.part_cos), ...(relacions || []).map(r => r.part_cos)]

    const idsLesions = [...new Set(allLesions.filter(Boolean))]
    const idsMusculs = [...new Set(allMusculs.filter(Boolean))]

    const [{ data: lesions }, { data: musculs }] = await Promise.all([
        idsLesions.length > 0 ? supabase.from('lesions').select('id_lesio, nom').in('id_lesio', idsLesions) : Promise.resolve({ data: [] }),
        idsMusculs.length > 0 ? supabase.from('musculs').select('id_cos, nom').in('id_cos', idsMusculs) : Promise.resolve({ data: [] }),
    ])

    const nomLesions = Object.fromEntries((lesions || []).map(l => [l.id_lesio, l.nom]))
    const nomMusculs = Object.fromEntries((musculs || []).map(m => [m.id_cos, m.nom]))

    let diagnosticsEnriquits = []
    let diagnosticsPendents = []

    if (diagnostics?.length > 0) {
        diagnosticsEnriquits = diagnostics.map(d => {
            const relacio = (relacions || []).find(r => r.id_lesio === d.id_lesio && r.part_cos === d.part_cos)
            return { ...d, nomLesio: nomLesions[d.id_lesio] || 'Desconeguda', nomMuscul: nomMusculs[d.part_cos] || 'Desconegut', confirmat: relacio ? relacio.confirmat : true }
        })
    }

    if (relacions?.length > 0) {
        diagnosticsPendents = relacions.filter(r => r.confirmat === false).map((r, i) => ({
            id_diagnostic_pendent: `pendent-${i}`,
            nomLesio: nomLesions[r.id_lesio] || 'Desconeguda',
            nomMuscul: nomMusculs[r.part_cos] || 'Desconegut',
            descripcio: r.descripcio || 'Sense descripció',
            codi_validacio: r.codi_validacio,
            confirmat: false,
        }))
    }

    const diagnosticsActius = diagnosticsEnriquits.filter(d => !d.finalitzat)
    const diagnostic = diagnosticsActius[0] || diagnosticsEnriquits[0] || null

    // Sessions amb dolor
    const { data: sessions } = await supabase
        .from('historial_sessions')
        .select(`
            id_sessio,
            data_realitzacio,
            fase,
            punts_obtinguts,
            dolor_sessio,
            dolor_exercicis,
            diagnostic!inner ( musculs:part_cos ( nom ) ),
            lesions (nom)
        `)
        .eq('dni_pacient', dniPacient)
        .in('id_diagnostic', diagnosticsActius.map(d => d.id_diagnostic))
        .order('data_realitzacio', { ascending: false })
        .limit(20)

    let sessionsGraficaAsc = []
    if (diagnosticsActius.length > 0) {
        const ids = diagnosticsActius.map(d => d.id_diagnostic)
        const { data: sessGrafica } = await supabase
            .from('historial_sessions')
            .select('data_realitzacio, punts_obtinguts')
            .eq('dni_pacient', dniPacient)
            .in('id_diagnostic', ids)
            .order('data_realitzacio', { ascending: true })
        sessionsGraficaAsc = sessGrafica || []
    }

    const puntsFinalsTotals = diagnosticsActius.reduce((acc, d) => acc + (d.puntsFinals ?? 0), 0)

    return { usuari, diagnostic, diagnosticsActius, diagnosticsPendents, puntsFinalsTotals, historialLesions: diagnosticsEnriquits, sessions: sessions || [], sessionsGraficaAsc }
}

const formatDia = (iso) => {
    if (!iso) return '—'
    try { return new Date(iso).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', year: 'numeric' }) }
    catch { return iso }
}

// ── Component principal ──────────────────────────────────────
export default function DetallsPacientModal({ dniPacient, nomPacient, dniFisio, onTancar }) {
    const [dades, setDades] = useState(null)
    const [carregant, setCarregant] = useState(true)
    const [modalRutina, setModalRutina] = useState(null)

    useEffect(() => {
        setCarregant(true)
        getDetallsPacient(dniPacient).then(res => { setDades(res); setCarregant(false) })
    }, [dniPacient])

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onTancar() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onTancar])

    const modal = (
        <div className={styles.overlay} onClick={onTancar}>
            <div className={styles.panel} onClick={e => e.stopPropagation()}>

                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.avatar}>{nomPacient?.charAt(0).toUpperCase() || '?'}</div>
                        <div>
                            <h2 className={styles.nom}>{nomPacient}</h2>
                            <span className={styles.rolBadge}>Pacient</span>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onTancar} aria-label="Tancar">✕</button>
                </div>

                {carregant ? (
                    <div className={styles.carregant}><div className={styles.spinner} /><p>Carregant dades del pacient...</p></div>
                ) : (
                    <div className={styles.cos}>

                        {/* Informació personal */}
                        <section className={styles.seccio}>
                            <p className={styles.seccioTitol}><span className={styles.seccioIcon}>👤</span>Informació personal</p>
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

                        {/* Diagnòstics pendents */}
                        {dades?.diagnosticsPendents?.length > 0 && (
                            <>
                                <section className={styles.seccio}>
                                    <p className={styles.seccioTitol}><span className={styles.seccioIcon}>⏳</span>Pendents de confirmació<span className={styles.comptador}>{dades.diagnosticsPendents.length}</span></p>
                                    {dades.diagnosticsPendents.map((diag) => (
                                        <div key={diag.id_diagnostic_pendent} className={styles.diagCard}>
                                            <div className={styles.diagCardHeader}>
                                                <div>
                                                    <span className={styles.diagNom}>{diag.nomLesio + ' '}</span>
                                                    <span className={styles.diagMuscul}>{diag.nomMuscul}</span>
                                                </div>
                                            </div>
                                            {diag.descripcio && diag.descripcio !== 'Sense descripció' && (
                                                <div className={styles.descripcioBox}><p className={styles.descripcioText}>{diag.descripcio}</p></div>
                                            )}
                                            {diag.codi_validacio && (
                                                <div className={styles.progresBox} style={{ marginTop: '0.75rem' }}>
                                                    <p className={styles.progresDetall}>Codi de validació: <strong>{diag.codi_validacio}</strong></p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </section>
                                <div className={styles.divider} />
                            </>
                        )}

                        {/* Diagnòstics actius */}
                        <section className={styles.seccio}>
                            <p className={styles.seccioTitol}><span className={styles.seccioIcon}>🩺</span>Diagnòstics actius<span className={styles.comptador}>{dades?.diagnosticsActius?.length ?? 0}</span></p>
                            {dades?.diagnosticsActius?.length > 0 ? (
                                dades.diagnosticsActius.map((diag) => {
                                    const progres = diag.puntsFinals > 0 ? Math.min(Math.round((diag.punts_recuperacio / diag.puntsFinals) * 100), 100) : 0
                                    return (
                                        <div key={diag.id_diagnostic} className={styles.diagCard}>
                                            <div className={styles.diagCardHeader}>
                                                <div>
                                                    <span className={styles.diagNom}>{diag.nomLesio + ' '}</span>
                                                    <span className={styles.diagMuscul}>{diag.nomMuscul}</span>
                                                </div>
                                                <div className={styles.diagBadges}>
                                                    <span className={styles.badgeFase}>Fase {diag.fase_actual}</span>
                                                    {diag.confirmat === false && <span className={styles.badgeNoConfirmat}>No confirmat</span>}
                                                    <button className={styles.editarRutinaBtn} onClick={() => setModalRutina({ idDiagnostic: diag.id_diagnostic, idLesio: diag.id_lesio, partCos: diag.part_cos })}>
                                                        Editar rutina
                                                    </button>
                                                </div>
                                            </div>
                                            {diag.descripcio && diag.descripcio !== 'Sense descripció' && (
                                                <div className={styles.descripcioBox}><p className={styles.descripcioText}>{diag.descripcio}</p></div>
                                            )}
                                            <div className={styles.progresBox}>
                                                <div className={styles.progresCapcalera}>
                                                    <span className={styles.progresLabel}>Progrés de recuperació</span>
                                                    <span className={styles.progresNum}>{progres}%</span>
                                                </div>
                                                <div className={styles.progresBarBg}>
                                                    <div className={styles.progresBarFill} style={{ width: `${progres}%` }} />
                                                </div>
                                                <p className={styles.progresDetall}>{diag.punts_recuperacio ?? 0} / {diag.puntsFinals ?? 0} punts · {diag.num_sessions ?? 0} sessions</p>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <p className={styles.senseDades}>Aquest pacient no té cap diagnòstic actiu.</p>
                            )}
                        </section>

                        <div className={styles.divider} />

                        {/* Historial de sessions amb dolor */}
                        <section className={styles.seccio}>
                            <p className={styles.seccioTitol}>
                                <span className={styles.seccioIcon}>📋</span>
                                Historial de sessions
                                <span className={styles.comptador}>{dades?.sessions?.length ?? 0}</span>
                            </p>
                            <p className={styles.dolorHint}>Clica una sessió per veure el detall de dolor per exercici.</p>

                            {dades?.sessions?.length > 0 ? (
                                <div className={styles.sessionsList}>
                                    {dades.sessions.map((s) => (
                                        <FilaSessio key={s.id_sessio} sessio={s} />
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.senseDades}>Encara no hi ha sessions registrades.</p>
                            )}
                        </section>

                        <div className={styles.divider} />

                        {/* Historial de lesions */}
                        <section className={styles.seccio}>
                            <p className={styles.seccioTitol}><span className={styles.seccioIcon}>🦴</span>Historial de lesions<span className={styles.comptador}>{dades?.historialLesions?.length ?? 0}</span></p>
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
                                                {d.finalitzat ? <span className={styles.badgeComplet}>Completat</span> : <span className={styles.badgeFase}>En curs · Fase {d.fase_actual}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.senseDades}>Encara no hi ha lesions registrades.</p>
                            )}
                        </section>

                        <div className={styles.divider} />

                        {/* Gràfica */}
                        <section className={styles.seccio}>
                            <p className={styles.seccioTitol}><span className={styles.seccioIcon}>📈</span>Gràfica de recuperació</p>
                            <GraficaRecuperacio sessions={dades?.sessionsGraficaAsc || []} puntsFinals={dades?.puntsFinalsTotals ?? 0} />
                        </section>

                    </div>
                )}
            </div>
        </div>
    )

    if (typeof document === 'undefined') return null
    return (
        <>
            {createPortal(modal, document.body)}
            {modalRutina && (
                <EditarRutinaModal
                    dniPacient={dniPacient}
                    nomPacient={nomPacient}
                    idDiagnostic={modalRutina.idDiagnostic}
                    idLesio={modalRutina.idLesio}
                    partCos={modalRutina.partCos}
                    dniFisio={dniFisio}
                    onTancar={() => setModalRutina(null)}
                />
            )}
        </>
    )
}