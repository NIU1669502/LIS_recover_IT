'use client'

import { useState, useEffect } from 'react'
import { sincronitzarObjectius } from '../utils/objectius'
import styles from './objectiusPacient.module.css'

// ============================================================
// Component: ObjectiusPacient
// Mostra els 4 objectius/missions del pacient a la pàgina d'inici.
// Es sincronitza automàticament amb la BD cada cop que es renderitza.
// ============================================================

const OBJECTIUS = [
    {
        clau: 'primera_sessio',
        titol: 'Realitza la teva primera sessió',
        emoji: '🏋️',
    },
    {
        clau: 'primer_diagnostic',
        titol: 'Realitza el teu primer test diagnòstic',
        emoji: '🩺',
    },
    {
        clau: 'primera_cura',
        titol: 'Cura\'t completament de la teva primera lesió',
        emoji: '💪',
    },
    {
        clau: 'fisio_assignat',
        titol: 'Assigna un fisio amb tu',
        emoji: '👨‍⚕️',
    },
]

export default function ObjectiusPacient({ dniPacient }) {
    const [objectius, setObjectius] = useState(null)
    const [carregant, setCarregant] = useState(true)

    useEffect(() => {
        if (!dniPacient) return
        let actiu = true

        setCarregant(true)
        sincronitzarObjectius(dniPacient).then((obj) => {
            if (actiu) {
                setObjectius(obj)
                setCarregant(false)
            }
        })

        return () => { actiu = false }
    }, [dniPacient])

    if (carregant) {
        return (
            <div className={styles.objectiusContainer}>
                <div className={styles.loading}>Carregant objectius...</div>
            </div>
        )
    }

    if (!objectius) return null

    const completats = OBJECTIUS.filter((o) => objectius[o.clau]).length
    const total = OBJECTIUS.length
    const percentatge = Math.round((completats / total) * 100)

    return (
        <div className={styles.objectiusContainer}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerIcon}>🎯</div>
                <h3 className={styles.headerTitle}>Objectius</h3>
                <span className={styles.headerCount}>{completats}/{total}</span>
            </div>

            {/* Progress bar */}
            <div className={styles.progressBar}>
                <div
                    className={styles.progressFill}
                    style={{ width: `${percentatge}%` }}
                />
            </div>

            {/* Grid of objectives */}
            <div className={styles.objectiusGrid}>
                {OBJECTIUS.map((obj) => {
                    const completat = objectius[obj.clau]
                    return (
                        <div
                            key={obj.clau}
                            className={`${styles.objectiuCard} ${completat ? styles.objectiuCardComplet : ''}`}
                        >
                            <div className={`${styles.iconCircle} ${completat ? styles.iconCircleComplet : ''}`}>
                                {completat ? '✓' : obj.emoji}
                            </div>
                            <div className={styles.objectiuInfo}>
                                <span className={`${styles.objectiuTitol} ${completat ? styles.objectiuTitolComplet : ''}`}>
                                    {obj.titol}
                                </span>
                                <span className={`${styles.objectiuEstat} ${completat ? styles.objectiuEstatComplet : ''}`}>
                                    {completat ? 'Completat ✓' : 'Pendent'}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
