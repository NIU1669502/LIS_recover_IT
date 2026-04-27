'use client'

import { useState, useEffect } from 'react'
import { getAssignacio, getExercicisFaseActual } from '../data/mockRutines'
import styles from './exercicisEnCurs.module.css'

export default function ExercicisEnCurs({ onNavegar, onIniciarSessio }) {
    const [assignacio, setAssignacio] = useState(null)
    const [exercicis, setExercicis] = useState([])

    useEffect(() => {
        const a = getAssignacio()
        setAssignacio(a)
        setExercicis(getExercicisFaseActual())
    }, [])

    if (!assignacio) {
        return (
            <div className={styles.emptyContainer}>
                <div className={styles.emptyIcon}>🏥</div>
                <h2 className={styles.emptyTitle}>Encara no tens cap rutina</h2>
                <p className={styles.emptyText}>
                    Fes el test diagnòstic per rebre el teu programa de recuperació personalitzat.
                </p>
                <button className={styles.primaryButton} onClick={() => onNavegar('test')}>
                    Fer el test diagnòstic →
                </button>
            </div>
        )
    }

    if (assignacio.completada) {
        return (
            <div className={styles.emptyContainer}>
                <div className={styles.emptyIcon}>🎉</div>
                <h2 className={styles.emptyTitle}>Programa completat!</h2>
                <p className={styles.emptyText}>
                    Has completat totes les fases de recuperació. Enhorabona!
                </p>
                <button className={styles.primaryButton} onClick={() => onNavegar('test')}>
                    Fer un nou test →
                </button>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Exercicis en curs</h2>

            <div className={styles.rutinaInfo}>
                <div className={styles.rutinaTag}>
                    <span className={styles.tagLabel}>Múscul</span>
                    <span className={styles.tagValue}>{assignacio.muscle}</span>
                </div>
                <div className={styles.rutinaTag}>
                    <span className={styles.tagLabel}>Lesió</span>
                    <span className={styles.tagValue}>{assignacio.tipus_lesio}</span>
                </div>
                <div className={styles.rutinaTag}>
                    <span className={styles.tagLabel}>Fase</span>
                    <span className={styles.tagValue}>{assignacio.fase_actual} / 3</span>
                </div>
            </div>

            <div className={styles.faseProgress}>
                {[1, 2, 3].map(f => (
                    <div
                        key={f}
                        className={`${styles.faseDot} ${f < assignacio.fase_actual ? styles.faseDotDone : ''} ${f === assignacio.fase_actual ? styles.faseDotActive : ''}`}
                    >
                        <span className={styles.faseNum}>{f}</span>
                        <span className={styles.faseLabel}>
                            {f === 1 ? 'Inicial' : f === 2 ? 'Progressió' : 'Avançada'}
                        </span>
                    </div>
                ))}
            </div>

            <div className={styles.exercicisList}>
                {exercicis.map((ex, idx) => (
                    <div key={ex.id_exercici} className={styles.exerciciCard}>
                        <div className={styles.exerciciNum}>{idx + 1}</div>
                        <div className={styles.exerciciInfo}>
                            <h3 className={styles.exerciciNom}>{ex.nom}</h3>
                            <div className={styles.exerciciMeta}>
                                <span>⏱ {ex.duracio_segons}s</span>
                                <span>🔁 {ex.reps} reps</span>
                                <span>⭐ {ex.punts} pts</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                className={styles.primaryButton}
                onClick={() => onIniciarSessio(exercicis)}
            >
                Iniciar sessió →
            </button>
        </div>
    )
}