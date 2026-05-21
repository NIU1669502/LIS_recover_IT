'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../utils/supabase'
import { getRutinaAmbPersonalitzacio, guardarPersonalitzacio } from '../utils/fisio'
import { showToast } from '../utils/toast'
import styles from './EditarRutinaModal.module.css'

// ============================================================
// Component: EditarRutinaModal
// Permet al fisioterapeuta personalitzar la rutina d'un pacient:
//   - Canviar l'exercici de cada slot
//   - Modificar duració, repeticions, punts i multiplicador
// ============================================================

export default function EditarRutinaModal({ dniPacient, nomPacient, idDiagnostic, idLesio, partCos, dniFisio, onTancar }) {
    const [rutina, setRutina] = useState(null)
    const [carregant, setCarregant] = useState(true)
    const [faseActiva, setFaseActiva] = useState(1)
    const [exercicisDisponibles, setExercicisDisponibles] = useState([])

    // Edició: { fase, slot } del slot que s'està editant ara
    const [editant, setEditant] = useState(null)
    // Valors del formulari d'edició
    const [form, setForm] = useState({})
    const [desant, setDesant] = useState(false)

    // Carregar rutina + tots els exercicis disponibles
    useEffect(() => {
        const carregar = async () => {
            setCarregant(true)
            const [rutinaData, { data: exs }] = await Promise.all([
                getRutinaAmbPersonalitzacio(idDiagnostic, idLesio, partCos),
                supabase.from('exercicis').select('id_exercici, nom, duracio_segons, Repeticions, punts'),
            ])
            setRutina(rutinaData)
            setExercicisDisponibles(exs || [])
            setCarregant(false)
        }
        carregar()
    }, [idDiagnostic, idLesio, partCos])

    // Tancar amb Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') { if (editant) setEditant(null); else onTancar() } }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [editant, onTancar])

    const slotsActuals = rutina ? rutina[`fase${faseActiva}`] : []

    // Obre el formulari d'edició per a un slot
    const handleEditar = (slot) => {
        setForm({
            id_exercici: slot.id_exercici,
            duracio_segons: slot.duracio_segons,
            repeticions: slot.repeticions,
            punts: slot.punts,
            multiplicador: slot.multiplicador,
        })
        setEditant({ fase: slot.fase, slot: slot.slot })
    }

    // Quan es canvia l'exercici al select, omple els camps amb els valors base del nou exercici
    const handleCanviExercici = (idExercici) => {
        const ex = exercicisDisponibles.find(e => e.id_exercici === parseInt(idExercici))
        if (!ex) return
        setForm(prev => ({
            ...prev,
            id_exercici: ex.id_exercici,
            duracio_segons: ex.duracio_segons,
            repeticions: ex.Repeticions,
            punts: ex.punts,
        }))
    }

    const handleDesar = async () => {
        setDesant(true)
        const slotOriginal = rutina[`fase${editant.fase}`][editant.slot - 1]

        const resultat = await guardarPersonalitzacio(dniFisio, {
            id_diagnostic: idDiagnostic,
            dni_pacient: dniPacient,
            fase: editant.fase,
            slot_exercici: editant.slot,
            id_exercici: parseInt(form.id_exercici),
            duracio_segons: parseInt(form.duracio_segons),
            repeticions: form.repeticions,
            punts: parseInt(form.punts),
            multiplicador: parseInt(form.multiplicador),
        })

        if (!resultat.ok) {
            showToast(`Error en desar: ${resultat.missatge}`, 'error')
            setDesant(false)
            return
        }

        showToast('Canvis desats correctament', 'success')

        // Recarregar la rutina per reflectir els canvis
        const rutinaActualitzada = await getRutinaAmbPersonalitzacio(idDiagnostic, idLesio, partCos)
        setRutina(rutinaActualitzada)
        setEditant(null)
        setDesant(false)
    }

    const modal = (
        <div className={styles.overlay} onClick={() => { if (!editant) onTancar() }}>
            <div className={styles.panel} onClick={e => e.stopPropagation()}>

                {/* ── Capçalera ── */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.avatar}>
                            {nomPacient?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                            <h2 className={styles.titol}>Editar rutina</h2>
                            <p className={styles.subtitol}>{nomPacient}</p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onTancar}>✕</button>
                </div>

                {carregant ? (
                    <div className={styles.carregant}>
                        <div className={styles.spinner} />
                        <p>Carregant rutina...</p>
                    </div>
                ) : !rutina ? (
                    <div className={styles.carregant}>
                        <p>No s'ha trobat cap rutina per a aquest diagnòstic.</p>
                    </div>
                ) : (
                    <div className={styles.cos}>

                        {/* ── Selector de fase ── */}
                        <div className={styles.faseTabs}>
                            {[1, 2, 3].map(f => (
                                <button
                                    key={f}
                                    className={`${styles.faseTab} ${faseActiva === f ? styles.faseTabActiva : ''}`}
                                    onClick={() => { setFaseActiva(f); setEditant(null) }}
                                >
                                    Fase {f}
                                    <span className={styles.faseSessionsLabel}>
                                        {rutina.nSessions[f]} sessions
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* ── Nota informativa ── */}
                        <div className={styles.nota}>
                            <span className={styles.notaIcon}>ℹ️</span>
                            Els canvis s'apliquen <strong>només a aquest pacient</strong>. La resta de pacients mantindran la rutina original.
                        </div>

                        {/* ── Llista de slots ── */}
                        <div className={styles.slotsList}>
                            {slotsActuals.map((slot) => {
                                const estaEditant = editant?.fase === slot.fase && editant?.slot === slot.slot
                                return (
                                    <div key={`${slot.fase}-${slot.slot}`} className={`${styles.slotCard} ${slot.personalitzat ? styles.slotPersonalitzat : ''} ${estaEditant ? styles.slotEditant : ''}`}>

                                        {/* ── Capçalera del slot ── */}
                                        <div className={styles.slotHeader}>
                                            <div className={styles.slotHeaderLeft}>
                                                <span className={styles.slotNum}>Exercici {slot.slot}</span>
                                                {slot.personalitzat && (
                                                    <span className={styles.badgeModificat}>✏️ Modificat</span>
                                                )}
                                            </div>
                                            {!estaEditant && (
                                                <button
                                                    className={styles.editBtn}
                                                    onClick={() => handleEditar(slot)}
                                                >
                                                    Editar
                                                </button>
                                            )}
                                        </div>

                                        {/* ── Vista resum (quan no s'edita) ── */}
                                        {!estaEditant && (
                                            <div className={styles.slotResum}>
                                                <p className={styles.slotNom}>{slot.nom}</p>
                                                <div className={styles.slotParams}>
                                                    <span className={styles.param}>⏱ {slot.duracio_segons}s</span>
                                                    <span className={styles.param}>🔄 {slot.repeticions}</span>
                                                    <span className={styles.param}>⭐ {slot.punts} pts</span>
                                                    <span className={styles.param}>✕{slot.multiplicador} mult.</span>
                                                </div>
                                                {slot.personalitzat && slot.id_exercici !== slot.id_exercici_base && (
                                                    <p className={styles.slotOriginal}>
                                                        Original: {slot.nom_base}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* ── Formulari d'edició ── */}
                                        {estaEditant && (
                                            <div className={styles.formEdicio}>

                                                {/* Exercici */}
                                                <div className={styles.formGroup}>
                                                    <label className={styles.formLabel}>Exercici</label>
                                                    <select
                                                        className={styles.formInput}
                                                        value={form.id_exercici}
                                                        onChange={e => handleCanviExercici(e.target.value)}
                                                    >
                                                        {exercicisDisponibles.map(ex => (
                                                            <option key={ex.id_exercici} value={ex.id_exercici}>
                                                                {ex.nom}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <span className={styles.formHint}>Original: {slot.nom_base}</span>
                                                </div>

                                                {/* Fila de 3 camps numèrics */}
                                                <div className={styles.formRow}>
                                                    <div className={styles.formGroup}>
                                                        <label className={styles.formLabel}>Duració (s)</label>
                                                        <input
                                                            className={styles.formInput}
                                                            type="number"
                                                            min="1"
                                                            value={form.duracio_segons}
                                                            onChange={e => setForm(p => ({ ...p, duracio_segons: e.target.value }))}
                                                        />
                                                        <span className={styles.formHint}>Base: {slot.duracio_segons_base}s</span>
                                                    </div>
                                                    <div className={styles.formGroup}>
                                                        <label className={styles.formLabel}>Punts</label>
                                                        <input
                                                            className={styles.formInput}
                                                            type="number"
                                                            min="0"
                                                            value={form.punts}
                                                            onChange={e => setForm(p => ({ ...p, punts: e.target.value }))}
                                                        />
                                                        <span className={styles.formHint}>Base: {slot.punts_base}</span>
                                                    </div>
                                                    <div className={styles.formGroup}>
                                                        <label className={styles.formLabel}>Multiplicador</label>
                                                        <input
                                                            className={styles.formInput}
                                                            type="number"
                                                            min="1"
                                                            value={form.multiplicador}
                                                            onChange={e => setForm(p => ({ ...p, multiplicador: e.target.value }))}
                                                        />
                                                        <span className={styles.formHint}>Base: ✕{slot.multiplicador_base}</span>
                                                    </div>
                                                </div>

                                                {/* Repeticions */}
                                                <div className={styles.formGroup}>
                                                    <label className={styles.formLabel}>Repeticions</label>
                                                    <input
                                                        className={styles.formInput}
                                                        type="text"
                                                        placeholder="Ex: 3x10, 4 sèries..."
                                                        value={form.repeticions}
                                                        onChange={e => setForm(p => ({ ...p, repeticions: e.target.value }))}
                                                    />
                                                    <span className={styles.formHint}>Base: {slot.repeticions_base}</span>
                                                </div>

                                                {/* Botons */}
                                                <div className={styles.formActions}>
                                                    <button
                                                        className={styles.cancelBtn}
                                                        onClick={() => setEditant(null)}
                                                        disabled={desant}
                                                    >
                                                        Cancel·lar
                                                    </button>
                                                    <button
                                                        className={styles.desarBtn}
                                                        onClick={handleDesar}
                                                        disabled={desant}
                                                    >
                                                        {desant ? 'Desant...' : 'Desar canvis'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                    </div>
                )}
            </div>
        </div>
    )

    if (typeof document === 'undefined') return null
    return createPortal(modal, document.body)
}
