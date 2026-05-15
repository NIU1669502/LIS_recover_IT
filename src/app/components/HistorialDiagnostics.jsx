'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { getDiagnosticActiu } from '../utils/lesions'
import GraficaRecuperacio from './GraficaRecuperacio'

import styles from './historialDiagnostics.module.css'

export default function HistorialDiagnostics({ perfilUsuari, onNavegar }) {
    const [actives, setActives] = useState([])
    const [finalitzades, setFinalitzades] = useState([])
    const [carregant, setCarregant] = useState(true)
    const [nomsLesions, setNomsLesions] = useState({})
    // Sessions del diagnòstic actiu (per a la gràfica)
    const [sessionsActives, setSessionsActives] = useState([])

    const canalRef = useRef(null)

    useEffect(() => {
        const carregarDades = async () => {
            if (!perfilUsuari?.dni) return;

            const { data: catLesions } = await supabase.from('lesions').select('id_lesio, nom')
            const mapaNoms = {}
            if (catLesions) catLesions.forEach(l => mapaNoms[l.id_lesio] = l.nom)
            setNomsLesions(mapaNoms)

            const diagActiu = await getDiagnosticActiu(perfilUsuari.dni)
            setActives(diagActiu ? [diagActiu] : [])

            // Carregar sessions NOMÉS del diagnòstic actiu (per a la gràfica)
            if (diagActiu?.id_diagnostic) {
                const { data: sess } = await supabase
                    .from('historial_sessions')
                    .select('data_realitzacio, punts_obtinguts')
                    .eq('dni_pacient', perfilUsuari.dni)
                    .eq('id_diagnostic', diagActiu.id_diagnostic)
                    .order('data_realitzacio', { ascending: true })
                setSessionsActives(sess || [])
            } else {
                setSessionsActives([])
            }

            const { data: finalitzats, error } = await supabase
                .from('diagnostic')
                .select('*')
                .eq('dni_pacient', perfilUsuari.dni)
                .eq('finalitzat', true)
                .order('id_diagnostic', { ascending: false })
            if (error) { console.error('Error:', error); setCarregant(false); return }
            setFinalitzades(finalitzats ?? [])
            setCarregant(false)
        }

        carregarDades()

        // ── Realtime: actualitzar quan canvia el diagnòstic del pacient ──
        if (perfilUsuari?.dni) {
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
    }, [perfilUsuari])

    if (carregant) {
        return <div className={styles.container}><p>Carregant l'historial de lesions...</p></div>
    }

    const diagActiu = actives[0] ?? null

    return (
        <section className={styles.container}>
            <h1 className={styles.title}>Progrés i Historial</h1>

            {/* ── Layout dues columnes ── */}
            <div className={styles.layoutDuoColumnes}>

                {/* ── Columna esquerra: lesions actives + historial ── */}
                <div className={styles.columnaEsquerra}>

                    {/* SECCIÓ 1: Lesions Actives */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>🔄 Lesions Actives</h2>

                        {actives.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>No tens cap tractament de lesió actiu ara mateix.</p>
                                <button className={styles.actionButton} onClick={() => onNavegar('test')} style={{maxWidth: '200px', margin: '1rem auto'}}>
                                    Fer un Test Nou
                                </button>
                            </div>
                        ) : (
                            <div className={styles.grid}>
                                {actives.map(diag => {
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

                                            <button className={styles.actionButton} onClick={() => onNavegar('exercicis-en-curs')}>
                                                Continuar exercicis
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
                                <p>Encara no tens lesions completades a l'historial.</p>
                            </div>
                        ) : (
                            <div className={styles.grid}>
                                {finalitzades.map(diag => {
                                    const dataFormatada = diag.data_fi
                                        ? new Date(diag.data_fi).toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                                        : 'Desconeguda';

                                    return (
                                        <div key={diag.id_diagnostic} className={styles.card} style={{opacity: 0.85}}>
                                            <div className={styles.cardHeader}>
                                                <div>
                                                    <h3 className={styles.lesioName}>
                                                        {nomsLesions[diag.id_lesio] || 'Lesió Desconeguda'}
                                                    </h3>
                                                    <p className={styles.lesioDate}>
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
                                                    <span style={{color: '#166534'}}>{diag.punts_recuperacio ?? 0} / {diag.puntsFinals ?? 0} pts</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                </div>

                {/* ── Columna dreta: gràfica de recuperació ── */}
                <div className={styles.columnaDreta}>
                    <h2 className={styles.sectionTitle}>📈 Evolució de la recuperació</h2>
                    {diagActiu ? (
                        <GraficaRecuperacio
                            sessions={sessionsActives}
                            puntsFinals={diagActiu.puntsFinals ?? 0}
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
