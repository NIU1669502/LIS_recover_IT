'use client'

import { useState } from 'react'
import styles from './perfilUsuari.module.css'

// ============================================================
// Component: PerfilUsuari
// ============================================================
export default function PerfilUsuari({ perfilUsuari, onEditarPerfil }) {
    const [editant, setEditant] = useState(false)
    const [nouNom, setNouNom] = useState('')

    const iniciarEdicio = () => {
        setNouNom(perfilUsuari?.nom || '')
        setEditant(true)
    }

    const cancellarEdicio = () => {
        setEditant(false)
        setNouNom('')
    }

    const guardarNom = async () => {
        if (!nouNom.trim()) return
        await onEditarPerfil(nouNom)
        setEditant(false)
        setNouNom('')
    }

    return (
        <section className={styles.container}>
            <h2 className={styles.title}>El meu perfil</h2>

            {!perfilUsuari && (
                <p className={styles.textMuted}>
                    No s'han trobat dades del perfil.
                </p>
            )}

            {perfilUsuari && (
                <div className={styles.card}>

                    {/* Nom */}
                    <div className={styles.field}>
                        <span className={styles.label}>Nom</span>

                        {editant ? (
                            <div className={styles.editRow}>
                                <input
                                    type="text"
                                    value={nouNom}
                                    onChange={(e) => setNouNom(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') guardarNom()
                                        if (e.key === 'Escape') cancellarEdicio()
                                    }}
                                    autoFocus
                                    className={styles.inputEdit}
                                />

                                <button onClick={guardarNom} className={styles.saveButton}>
                                    Guardar
                                </button>

                                <button onClick={cancellarEdicio} className={styles.cancelButton}>
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <div className={styles.displayRow}>
                                <p className={styles.value}>{perfilUsuari.nom}</p>

                                <button onClick={iniciarEdicio} className={styles.editInlineButton}>
                                    ✏️ Editar
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={styles.divider} />

                    {/* DNI */}
                    <div className={styles.field}>
                        <span className={styles.label}>DNI</span>
                        <p className={styles.value}>{perfilUsuari.dni}</p>
                    </div>

                    <div className={styles.divider} />

                    {/* Punts */}
                    <div className={styles.field}>
                        <span className={styles.label}>Punts</span>
                        <p className={styles.value}>{perfilUsuari.punts ?? 0}</p>
                    </div>

                    <div className={styles.divider} />

                    {/* Rol */}
                    <div className={styles.field}>
                        <span className={styles.label}>Rol</span>
                        <p className={styles.value}>
                            {perfilUsuari.es_fisioterapeuta ? '🩺 Fisioterapeuta' : '🏃 Pacient'}
                        </p>
                    </div>

                </div>
            )}
        </section>
    )
}