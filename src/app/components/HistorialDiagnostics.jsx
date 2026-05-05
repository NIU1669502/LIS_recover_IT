'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import styles from './historialDiagnostics.module.css'

export default function HistorialDiagnostics({ perfilUsuari, onNavegar }) {
    const [actives, setActives] = useState([])
    const [finalitzades, setFinalitzades] = useState([])
    const [carregant, setCarregant] = useState(true)
    const [nomsLesions, setNomsLesions] = useState({})

    useEffect(() => {
        const carregarDades = async () => {
            if (!perfilUsuari?.dni) return;

            // 1. Carregar diccionari de lesions per resoldre l'ID al nom real
            const { data: catLesions } = await supabase.from('lesions').select('id_lesio, nom')
            const mapaNoms = {}
            if (catLesions) {
                catLesions.forEach(l => mapaNoms[l.id_lesio] = l.nom)
            }
            setNomsLesions(mapaNoms)

            // 2. Carregar l'historial infinit de diagnòstics del pacient
            const { data: diagnostics, error } = await supabase
                .from('diagnostic')
                .select('*')
                .eq('dni_pacient', perfilUsuari.dni)
                .order('id_diagnostic', { ascending: false })
            
            if (error) {
                console.error("Error carregant diagnòstics:", error)
                setCarregant(false)
                return
            }

            // 3. Separar en actives (finalitzat=false) i historial (finalitzat=true)
            if (diagnostics) {
                setActives(diagnostics.filter(d => d.finalitzat === false))
                setFinalitzades(diagnostics.filter(d => d.finalitzat === true))
            }
            setCarregant(false)
        }

        carregarDades()
    }, [perfilUsuari])

    if (carregant) {
        return <div className={styles.container}><p>Carregant l'historial de lesions...</p></div>
    }



    return (
        <section className={styles.container}>
            <h1 className={styles.title}>Progrés i Historial</h1>

            {/* SECCIÓ 1: Lesions Actives (RF-PAC-05 Progrés Independent) */}
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
                            const pct = Math.min(100, ((diag.punts_recuperacio || 0) / (diag.puntsFinals || 1)) * 100);
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
                                            <span>{diag.punts_recuperacio || 0} / {diag.puntsFinals || '?'} pts</span>
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

            {/* SECCIÓ 2: Historial de Lesions (RF-PAC-01/06) */}
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
                                            <span style={{color: '#166534'}}>{diag.punts_recuperacio || 0} / {diag.puntsFinals || '?'} pts</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </section>
    )
}
