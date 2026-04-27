'use client'

import styles from './historialSessions.module.css'
import { useHistorial } from '../hooks/useHistorial'

// ============================================================
// Component: HistorialUsuari
// Mostra les sessions (dies) amb exercicis en format taula
// ============================================================
export default function HistorialSessions({ perfilUsuari }) {
    const dni = perfilUsuari?.dni

    const { historial, carregant, error } = useHistorial(dni)

    return (
        <section className={styles.container}>
            <h2 className={styles.title}>Historial de sessions</h2>

            {carregant && <p className={styles.muted}>Carregant historial...</p>}
            {error && <p className={styles.error}>Error: {error}</p>}

            {!carregant && Object.keys(historial).length === 0 && (
                <p className={styles.muted}>No hi ha exercicis registrats.</p>
            )}

            {/* ── Sessions agrupades per dia ─────────────────── */}
            {!carregant && Object.entries(historial).map(([data, exercicis]) => (
                <div key={data} className={styles.dayBlock}>

                    <h3 className={styles.dayTitle}>
                        📅 {data}
                    </h3>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Exercici</th>
                                    <th>Temps (s)</th>
                                    <th>Completat</th>
                                    <th>Punts</th>
                                </tr>
                            </thead>

                            <tbody>
                                {exercicis.map(item => (
                                    <tr key={item.id_historial}>
                                        <td>
                                            <div className={styles.exerciseName}>
                                                {item.exercicis?.nom}
                                            </div>
                                            <div className={styles.exerciseDesc}>
                                                {item.exercicis?.descripcio}
                                            </div>
                                        </td>

                                        <td>{item.temps_realitzat_segons}</td>

                                        <td>
                                            {item.completat ? '✔️' : '❌'}
                                        </td>

                                        <td>{item.punts_obtinguts}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            ))}
        </section>
    )
}