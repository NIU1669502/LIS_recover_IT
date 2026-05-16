'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { getDiagnosticsActius } from '../utils/lesions'
import GraficaRecuperacio from './GraficaRecuperacio'
import styles from './historialDiagnostics.module.css'

export default function HistorialDiagnostics({ perfilUsuari, onNavegar, onVeureHistorialSessions,onPreseleccionarDiagnostic }) {
    const [actives, setActives] = useState([])
    const [finalitzades, setFinalitzades] = useState([])
    const [carregant, setCarregant] = useState(true)
    const [nomsLesions, setNomsLesions] = useState({})
    const [nomsMusculs, setNomsMusculs] = useState({})
    // Sessions de TOTS els diagnòstics actius (per a la gràfica)
    const [sessionsActives, setSessionsActives] = useState([])

    const canalRef = useRef(null)

    useEffect(() => {
        const carregarDades = async () => {
            if (!perfilUsuari?.dni) {
                setCarregant(false)
                return
            }

            // 1. Cargar nombres y diagnósticos
            const { data: catLesions } = await supabase.from('lesions').select('id_lesio, nom')
            const mapaNoms = {}
            if (catLesions) catLesions.forEach((l) => { mapaNoms[l.id_lesio] = l.nom })
            setNomsLesions(mapaNoms)

            const [diagnosticsActius, { data: finalitzats }] = await Promise.all([
                getDiagnosticsActius(perfilUsuari.dni),
                supabase
                    .from('diagnostic')
                    .select('*')
                    .eq('dni_pacient', perfilUsuari.dni)
                    .eq('finalitzat', true)
                    .order('data_fi', { ascending: false })
            ])

            const activesData = diagnosticsActius ?? []
            setActives(activesData)
            setFinalitzades(finalitzats ?? [])

            // 2. Cargar nombres de músculos
            const tots = [...activesData, ...(finalitzats ?? [])]
            const partIds = [...new Set(tots.map((d) => d.part_cos).filter(Boolean))]
            if (partIds.length > 0) {
                const { data: musculsRows } = await supabase
                    .from('musculs')
                    .select('id_cos, nom')
                    .in('id_cos', partIds)
                const mapaMusculs = {}
                if (musculsRows) musculsRows.forEach((m) => { mapaMusculs[m.id_cos] = m.nom })
                setNomsMusculs(mapaMusculs)
            }

            // 3. Cargar sesiones de TODOS los diagnósticos activos para la gráfica
            if (activesData.length > 0) {
                const ids = activesData.map((d) => d.id_diagnostic)
                const { data: sess } = await supabase
                    .from('historial_sessions')
                    .select('data_realitzacio, punts_obtinguts')
                    .eq('dni_pacient', perfilUsuari.dni)
                    .in('id_diagnostic', ids) // <-- todos los activos
                    .order('data_realitzacio', { ascending: true })
                setSessionsActives(sess || [])
            } else {
                setSessionsActives([])
            }

            setCarregant(false)
        }

        carregarDades()

        // Realtime
        if (perfilUsuari?.dni) {
            if (canalRef.current) supabase.removeChannel(canalRef.current)
            const channelName = `historial-diag-${perfilUsuari.dni}-${Math.random().toString(36).substring(2, 9)}`
            canalRef.current = supabase
                .channel(channelName)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'diagnostic', filter: `dni_pacient=eq.${perfilUsuari.dni}` }, carregarDades)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'historial_sessions', filter: `dni_pacient=eq.${perfilUsuari.dni}` }, carregarDades)
                .subscribe()
        }

        return () => {
            if (canalRef.current) supabase.removeChannel(canalRef.current)
        }
    }, [perfilUsuari?.dni])

    if (carregant) {
        return <div className={styles.container}><p>Carregant l&apos;historial de lesions...</p></div>
    }

    // Punts objectiu = suma de tots els diagnòstics actius
    const puntsFinalsTotals = actives.reduce((acc, d) => acc + (d.puntsFinals ?? 0), 0)

    return (
        <section className={styles.container}>
            <h1 className={styles.title}>Progrés i Historial</h1>

            <div className={styles.layoutDuoColumnes}>

                {/* Columna esquerra */}
                <div className={styles.columnaEsquerra}>

                    {/* SECCIÓ 1: Lesions Actives */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>🔄 Lesions Actives</h2>

                        {actives.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>No tens cap tractament de lesió actiu ara mateix.</p>
                                <button
                                    className={styles.actionButton}
                                    onClick={() => onNavegar('test')}
                                    style={{ maxWidth: '200px', margin: '1rem auto' }}
                                >
                                    Fer un Test Nou
                                </button>
                            </div>
                        ) : (
                            <div className={styles.grid}>
                                {actives.map((diag) => {
                                    const puntsActuals = diag.punts_recuperacio ?? 0
                                    const puntsObjectiu = diag.puntsFinals ?? 0
                                    const pct = puntsObjectiu > 0 ? Math.min(100, (puntsActuals / puntsObjectiu) * 100) : 0

                                    return (
                                        <div key={diag.id_diagnostic} className={styles.card}>
                                            <div className={styles.cardHeader}>
                                                <div>
                                                    <h3 className={styles.lesioName}>
                                                        {nomsLesions[diag.id_lesio] || 'Lesió Desconeguda'}
                                                    </h3>
                                                    <p className={styles.lesioDate}>
                                                        {nomsMusculs[diag.part_cos] ? `${nomsMusculs[diag.part_cos]} · ` : ''}
                                                        Fase actual: {diag.fase_actual} / 3
                                                    </p>
                                                </div>
                                                <span className={`${styles.badge} ${styles.badgeActive}`}>En curs</span>
                                            </div>

                                            {diag.descripcio && diag.descripcio !== 'Sense descripció' && (
                                                <div className={styles.descripcio}>{diag.descripcio}</div>
                                            )}

                                            <div className={styles.progressContainer}>
                                                <div className={styles.progressHeader}>
                                                    <span>Progrés de recuperació</span>
                                                    <span>{puntsActuals} / {puntsObjectiu} pts</span>
                                                </div>
                                                <div className={styles.progressBar}>
                                                    <div className={styles.progressFill} style={{ width: `${pct}%` }}></div>
                                                </div>
                                            </div>

                                            <button
                                                className={styles.actionButton}
                                                onClick={() => {onPreseleccionarDiagnostic(diag.id_diagnostic)
                                                    onNavegar('exercicis-en-curs')}
                                                }
                                            >
                                                Continuar exercicis
                                            </button>

                                            <button
                                                type="button"
                                                className={styles.secondaryButton}
                                                onClick={() => onVeureHistorialSessions?.(diag.id_diagnostic)}
                                            >
                                                Veure historial de la sessió
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* SECCIÓ 2: Historial de Lesions Curades */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>✅ Historial de Lesions Curades</h2>

                        {finalitzades.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>Encara no tens lesions completades a l&apos;historial.</p>
                            </div>
                        ) : (
                            <div className={styles.grid}>
                                {finalitzades.map((diag) => {
                                    const dataFormatada = diag.data_fi
                                        ? new Date(diag.data_fi).toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                                        : 'Desconeguda'

                                    return (
                                        <div key={diag.id_diagnostic} className={styles.card} style={{ opacity: 0.85 }}>
                                            <div className={styles.cardHeader}>
                                                <div>
                                                    <h3 className={styles.lesioName}>
                                                        {nomsLesions[diag.id_lesio] || 'Lesió Desconeguda'}
                                                    </h3>
                                                    <p className={styles.lesioDate}>
                                                        {nomsMusculs[diag.part_cos] ? `${nomsMusculs[diag.part_cos]} · ` : ''}
                                                        Curada el: {dataFormatada}
                                                    </p>
                                                </div>
                                                <span className={`${styles.badge} ${styles.badgeDone}`}>Recuperat</span>
                                            </div>

                                            {diag.descripcio && diag.descripcio !== 'Sense descripció' && (
                                                <div className={styles.descripcio}>{diag.descripcio}</div>
                                            )}

                                            <div className={styles.progressContainer}>
                                                <div className={styles.progressHeader}>
                                                    <span>Puntuació final assolida</span>
                                                    <span style={{ color: '#166534' }}>
                                                        {diag.punts_recuperacio ?? 0} / {diag.puntsFinals ?? 0} pts
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                </div>

                {/* Columna dreta: gràfica */}
                <div className={styles.columnaDreta}>
                    <h2 className={styles.sectionTitle}>📈 Evolució de la recuperació</h2>

                    {actives.length > 0 ? (
                        <GraficaRecuperacio
                            sessions={sessionsActives}
                            puntsFinals={puntsFinalsTotals}
                        />
                    ) : (
                        <div className={styles.emptyState}>
                            <p>La gràfica apareixerà quan tinguis un tractament actiu.</p>
                        </div>
                    )}
                </div>

            </div>
        </section>
    )
}