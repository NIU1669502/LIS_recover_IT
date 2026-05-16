'use client'

import styles from './historialSessions.module.css'
import { useHistorial } from '../hooks/useHistorial'

// ============================================================
// Component: HistorialSessions
// Mostra una entrada per cada sessió d'exercicis completada
// indicant: data, fase i lesió associada.
// ============================================================
export default function HistorialSessions({ perfilUsuari, idDiagnosticFiltre = null, onClearFiltreHistorial }) {
    const dni = perfilUsuari?.dni
    const teFiltre = idDiagnosticFiltre != null && idDiagnosticFiltre !== ''
    const { sessions, carregant, error } = useHistorial(dni, teFiltre ? idDiagnosticFiltre : null)

    const formatDia = (iso) => {
        if (!iso) return '—'
        try {
            return new Date(iso).toLocaleDateString('ca-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            })
        } catch {
            return iso
        }
    }

    const formatHora = (iso) => {
        if (!iso) return ''
        try {
            return new Date(iso).toLocaleTimeString('ca-ES', {
                hour: '2-digit',
                minute: '2-digit',
            })
        } catch {
            return ''
        }
    }

    const etiquetaFase = (fase) => {
        if (fase === 1) return 'Fase 1 · Inicial'
        if (fase === 2) return 'Fase 2 · Progressió'
        if (fase === 3) return 'Fase 3 · Avançada'
        return `Fase ${fase}`
    }

    return (
        <section className={styles.container}>
            <h2 className={styles.title}>Historial de sessions</h2>

            {teFiltre && (
                <div className={styles.filtreBanner}>
                    <p className={styles.filtreBannerText}>
                        Mostrant només les sessions d&apos;aquesta lesió en curs.
                    </p>
                    {onClearFiltreHistorial && (
                        <button type="button" className={styles.filtreBannerButton} onClick={onClearFiltreHistorial}>
                            Veure totes les sessions
                        </button>
                    )}
                </div>
            )}

            {carregant && <p className={styles.muted}>Carregant historial...</p>}
            {error && <p className={styles.error}>Error: {error}</p>}

            {!carregant && sessions.length === 0 && (
                <p className={styles.muted}>
                    {teFiltre
                        ? 'Encara no hi ha sessions registrades per aquesta lesió.'
                        : 'Encara no hi ha sessions registrades.'}
                </p>
            )}

            {!carregant && sessions.length > 0 && (
                <div className={styles.dayBlock}>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Dia</th>
                                    <th>Lesió</th>
                                    <th>Fase</th>
                                    <th>Punts</th>
                                </tr>
                            </thead>

                            <tbody>
                                {sessions.map(s => (
                                    <tr key={s.id_sessio}>
                                        <td>
                                            <div className={styles.exerciseName}>
                                                📅 {formatDia(s.data_realitzacio)}
                                            </div>
                                            <div className={styles.exerciseDesc}>
                                                {formatHora(s.data_realitzacio)}
                                            </div>
                                        </td>

                                        <td>
                                            <div className={styles.exerciseName}>
                                                {s.lesions?.nom || 'Lesió desconeguda'}
                                            </div>
                                        </td>

                                        <td>{etiquetaFase(s.fase)}</td>

                                        <td>+{s.punts_obtinguts ?? 0} pts</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    )
}
