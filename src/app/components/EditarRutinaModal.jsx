'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../utils/supabase'
import { getRutinaAmbPersonalitzacio, guardarPersonalitzacio } from '../utils/fisio'
import { avancarFasePacient, recullarFasePacient } from '../utils/diagFisio'
import { showToast } from '../utils/toast'
import styles from './EditarRutinaModal.module.css'


// Component: EditarRutinaModal
// Modal per al fisioterapeuta per gestionar la rutina d'un pacient:
//   - Visualitza els 3 slots d'exercicis per fase
//   - Permet editar exercici, duració, repeticions, punts i multiplicador
//   - Permet avançar o recular la fase del pacient manualment
//   - Els canvis s'apliquen només a aquest pacient via rutina_personalitzada_pacient


export default function EditarRutinaModal({ dniPacient, nomPacient, idDiagnostic, idLesio, partCos, dniFisio, onTancar }) {
    const [rutina, setRutina] = useState(null)
    const [carregant, setCarregant] = useState(true)
    const [faseActiva, setFaseActiva] = useState(1)
    const [exercicisDisponibles, setExercicisDisponibles] = useState([])
    const [editant, setEditant] = useState(null)
    const [form, setForm] = useState({})
    const [desant, setDesant] = useState(false)

    const [avancat, setAvancat] = useState(false)
    const [avançant, setAvançant] = useState(false)
    const [faseActualDiag, setFaseActualDiag] = useState(null)
    const [tePenalitzacio, setTePenalitzacio] = useState(false)

    const [reculat, setReculat] = useState(false)
    const [reculant, setReculant] = useState(false)

    useEffect(() => {
        const carregar = async () => {
            setCarregant(true)
            const [rutinaData, { data: exs }, { data: diag }, { data: sessioPenalitzada }] = await Promise.all([
                getRutinaAmbPersonalitzacio(idDiagnostic, idLesio, partCos),
                supabase.from('exercicis').select('id_exercici, nom, duracio_segons, Repeticions, punts'),
                supabase.from('diagnostic').select('fase_actual, finalitzat, punts_recuperacio, num_sessions').eq('id_diagnostic', idDiagnostic).maybeSingle(),
                supabase.from('historial_sessions').select('id_sessio').eq('id_diagnostic', idDiagnostic).eq('penalitzat', true).limit(1).maybeSingle()
            ])

            const diagVal = diag || {}
            let umbralFase1 = 0
            let umbralFase2 = 0

            if (rutinaData) {
                // Calcular umbral fase 1
                const p1 = [rutinaData.fase1?.[0]?.punts_base, rutinaData.fase1?.[1]?.punts_base, rutinaData.fase1?.[2]?.punts_base].reduce((a, b) => a + (b || 0), 0)
                umbralFase1 = p1 * (rutinaData.fase1?.[0]?.multiplicador_base || 1) * (rutinaData.nSessions[1] || 1)

                // Calcular umbral fase 2
                const p2 = [rutinaData.fase2?.[0]?.punts_base, rutinaData.fase2?.[1]?.punts_base, rutinaData.fase2?.[2]?.punts_base].reduce((a, b) => a + (b || 0), 0)
                umbralFase2 = p2 * (rutinaData.fase2?.[0]?.multiplicador_base || 1) * (rutinaData.nSessions[2] || 1)
            }

            let ptsFetsFaseActual = 0
            const puntsTotalsUsuari = diagVal.punts_recuperacio || 0

            // Apliquem la lògica de restar umbrals de fases anteriors
            if (diagVal.fase_actual === 1) {
                ptsFetsFaseActual = puntsTotalsUsuari
            } else if (diagVal.fase_actual === 2) {
                ptsFetsFaseActual = Math.max(0, puntsTotalsUsuari - umbralFase1)
            } else if (diagVal.fase_actual === 3) {
                ptsFetsFaseActual = Math.max(0, puntsTotalsUsuari - umbralFase1 - umbralFase2)
            }

            const rutinaAmbProgres = {
                ...rutinaData,
                ptsFetsFaseActual,
                sessionsFetesFaseActual: diagVal.num_sessions || 0
            }

            setRutina(rutinaAmbProgres)
            setExercicisDisponibles(exs || [])
            setFaseActualDiag(diag?.fase_actual ?? null)
            setTePenalitzacio(!!sessioPenalitzada)
            setCarregant(false)
        }
        carregar()
    }, [idDiagnostic, idLesio, partCos])

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') { if (editant) setEditant(null); else onTancar() } }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [editant, onTancar])

    const slotsActuals = rutina ? rutina[`fase${faseActiva}`] : []

    const handleEditar = (slot) => {
        if (tePenalitzacio) return
        setForm({
            id_exercici: slot.id_exercici,
            duracio_segons: slot.duracio_segons,
            repeticions: slot.repeticions,
            punts: slot.punts,
            multiplicador: slot.multiplicador,
        })
        setEditant({ fase: slot.fase, slot: slot.slot })
    }

    const handleCanviExercici = (idExercici) => {
        const idNum = parseInt(idExercici, 10)
        const ex = exercicisDisponibles.find(e => e.id_exercici === idNum)
        if (!ex) { setForm(prev => ({ ...prev, id_exercici: idNum })); return }
        setForm({ ...form, id_exercici: ex.id_exercici, duracio_segons: ex.duracio_segons, repeticions: ex.Repeticions, punts: ex.punts, multiplicador: form.multiplicador })
    }

    const handleDesar = async () => {
        setDesant(true)
        const resultat = await guardarPersonalitzacio(dniFisio, {
            id_diagnostic: idDiagnostic,
            dni_pacient: dniPacient,
            fase: editant.fase,
            slot_exercici: editant.slot,
            id_exercici: parseInt(form.id_exercici, 10),
            duracio_segons: parseInt(form.duracio_segons),
            repeticions: form.repeticions,
            punts: parseInt(form.punts),
            multiplicador: parseInt(form.multiplicador),
        })

        if (!resultat.ok) { showToast(`Error en desar: ${resultat.missatge}`, 'error'); setDesant(false); return }

        showToast('Canvis desats correctament', 'success')
        const rutinaActualitzada = await getRutinaAmbPersonalitzacio(idDiagnostic, idLesio, partCos)
        setRutina(rutinaActualitzada)
        setEditant(null)
        setDesant(false)
    }

    const handleRecullarFase = async () => {
        if (!reculat) { setReculat(true); return }
        setReculant(true)
        const resultat = await recullarFasePacient(idDiagnostic)
        setReculant(false)
        setReculat(false)

        if (!resultat.ok) { showToast(`Error: ${resultat.missatge}`, 'error'); return }

        showToast(`${nomPacient} ha tornat a la Fase ${resultat.faseAnterior}`, 'success')
        setFaseActualDiag(resultat.faseAnterior)
        setFaseActiva(resultat.faseAnterior)
        const rutinaActualitzada = await getRutinaAmbPersonalitzacio(idDiagnostic, idLesio, partCos)
        setRutina(rutinaActualitzada)
    }

    const handleAvancarFase = async () => {
        if (!avancat) { setAvancat(true); return }
        setAvançant(true)
        const resultat = await avancarFasePacient(idDiagnostic)
        setAvançant(false)
        setAvancat(false)

        if (!resultat.ok) { showToast(`Error: ${resultat.missatge}`, 'error'); return }

        if (resultat.completada) {
            showToast(`${nomPacient} ha completat el programa!`, 'success')
            onTancar()
        } else {
            showToast(`${nomPacient} ha passat a la Fase ${resultat.novaFase}`, 'success')
            setFaseActualDiag(resultat.novaFase)
            setFaseActiva(resultat.novaFase)
            const rutinaActualitzada = await getRutinaAmbPersonalitzacio(idDiagnostic, idLesio, partCos)
            setRutina(rutinaActualitzada)
        }
    }

    const modal = (
        <div className={styles.overlay} onClick={() => { if (!editant) onTancar() }}>
            <div className={styles.panel} onClick={e => e.stopPropagation()}>


                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.avatar}>{nomPacient?.charAt(0).toUpperCase() || '?'}</div>
                        <div>
                            <h2 className={styles.titol}>Editar rutina</h2>
                            <p className={styles.subtitol}>{nomPacient}</p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onTancar}>✕</button>
                </div>

                {carregant ? (
                    <div className={styles.carregant}><div className={styles.spinner} /><p>Carregant rutina...</p></div>
                ) : !rutina ? (
                    <div className={styles.carregant}><p>No s'ha trobat cap rutina per a aquest diagnòstic.</p></div>
                ) : (
                    <div className={styles.cos}>


                        <div className={styles.faseTabs}>
                            {[1, 2, 3].map(f => (
                                <button
                                    key={f}
                                    className={`${styles.faseTab} ${faseActiva === f ? styles.faseTabActiva : ''} ${faseActualDiag === f ? styles.faseTabActual : ''}`}
                                    onClick={() => { setFaseActiva(f); setEditant(null) }}
                                >
                                    Fase {f}
                                    {faseActualDiag === f && <span className={styles.faseActualDot} />}
                                    <span className={styles.faseSessionsLabel}>
                                        {rutina.nSessionsOverride?.[f] ?? rutina.nSessions[f]} sessions
                                        {rutina.nSessionsOverride?.[f] != null && rutina.nSessionsOverride[f] !== rutina.nSessions[f] && (
                                            <span className={styles.faseSessionsOrig}> (orig: {rutina.nSessions[f]})</span>
                                        )}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {tePenalitzacio && (
                            <div className={styles.alertaPenalitzacio}>
                                <span className={styles.alertaPenalitzacioIcon}>⚠️</span>
                                <div className={styles.alertaPenalitzacioText}>
                                    <strong>Rutina bloquejada temporalment</strong>
                                    <p>Aquest pacient té una sessió penalitzada per inactivitat pendent de recuperar. No es poden fer canvis en la rutina fins que la completi.</p>
                                </div>
                            </div>
                        )}

                        {faseActualDiag != null && !tePenalitzacio && (
                            <div className={styles.avancarFaseBox}>
                                <div className={styles.avancarFaseInfo}>
                                    <span className={styles.avancarFaseLabel}>
                                        Fase actual del pacient: <strong>Fase {faseActualDiag}</strong>
                                    </span>
                                    <span className={styles.avancarFaseHint}>
                                        Canvia manualment la fase del pacient
                                    </span>
                                </div>

                                <div className={styles.faseAccions}>

                                    {faseActualDiag > 1 && !avancat && (
                                        !reculat ? (
                                            <button className={styles.recullarBtn} onClick={handleRecullarFase}>
                                                ← Fase {faseActualDiag - 1}
                                            </button>
                                        ) : (
                                            <div className={styles.avancarConfirm}>
                                                <span className={styles.avancarConfirmText}>
                                                    Es restaran els punts guanyats.
                                                </span>
                                                <button className={styles.avancarConfirmSi} onClick={handleRecullarFase} disabled={reculant}>
                                                    {reculant ? '...' : 'Sí, recular'}
                                                </button>
                                                <button className={styles.avancarConfirmNo} onClick={() => setReculat(false)}>
                                                    Cancel·lar
                                                </button>
                                            </div>
                                        )
                                    )}


                                    {faseActualDiag <= 3 && !reculat && (
                                        !avancat ? (
                                            <button className={styles.avancarBtn} onClick={handleAvancarFase}>
                                                {faseActualDiag < 3 ? `Fase ${faseActualDiag + 1} →` : 'Completar programa'}
                                            </button>
                                        ) : (
                                            <div className={styles.avancarConfirm}>
                                                <span className={styles.avancarConfirmText}>
                                                    Les sessions actuals es reiniciaran.
                                                </span>
                                                <button className={styles.avancarConfirmSi} onClick={handleAvancarFase} disabled={avançant}>
                                                    {avançant ? '...' : 'Sí, avançar'}
                                                </button>
                                                <button className={styles.avancarConfirmNo} onClick={() => setAvancat(false)}>
                                                    Cancel·lar
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}


                        <div className={styles.nota}>
                            <span className={styles.notaIcon}>ℹ️</span>
                            Els canvis s'apliquen <strong>només a aquest pacient</strong>. La resta de pacients mantindran la rutina original.
                        </div>


                        <div className={styles.slotsList}>
                            {slotsActuals.map((slot) => {
                                const estaEditant = editant?.fase === slot.fase && editant?.slot === slot.slot
                                return (
                                    <div key={`${slot.fase}-${slot.slot}`} className={`${styles.slotCard} ${slot.personalitzat ? styles.slotPersonalitzat : ''} ${estaEditant ? styles.slotEditant : ''}`}>

                                        <div className={styles.slotHeader}>
                                            <div className={styles.slotHeaderLeft}>
                                                <span className={styles.slotNum}>Exercici {slot.slot}</span>
                                                {slot.personalitzat && <span className={styles.badgeModificat}>✏️ Modificat</span>}
                                            </div>
                                            {!estaEditant && (
                                                <button className={styles.editBtn} onClick={() => handleEditar(slot)}>Editar</button>
                                            )}
                                        </div>

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
                                                    <p className={styles.slotOriginal}>Original: {slot.nom_base}</p>
                                                )}
                                            </div>
                                        )}

                                        {estaEditant && (
                                            <div className={styles.formEdicio}>
                                                <div className={styles.formGroup}>
                                                    <label className={styles.formLabel}>Exercici</label>
                                                    <select className={styles.formInput} value={form.id_exercici} onChange={e => handleCanviExercici(e.target.value)}>
                                                        {exercicisDisponibles.map(ex => (
                                                            <option key={ex.id_exercici} value={ex.id_exercici}>{ex.nom}</option>
                                                        ))}
                                                    </select>
                                                    <span className={styles.formHint}>Original: {slot.nom_base}</span>
                                                </div>

                                                <div className={styles.formRow}>
                                                    <div className={styles.formGroup}>
                                                        <label className={styles.formLabel}>Duració (s)</label>
                                                        <input className={styles.formInput} type="number" min="1" value={form.duracio_segons} onChange={e => setForm(p => ({ ...p, duracio_segons: e.target.value }))} />
                                                        <span className={styles.formHint}>Base: {slot.duracio_segons_base}s</span>
                                                    </div>
                                                    <div className={styles.formGroup}>
                                                        <label className={styles.formLabel}>Punts</label>
                                                        <input className={styles.formInput} type="number" min="0" value={form.punts} onChange={e => setForm(p => ({ ...p, punts: e.target.value }))} />
                                                        <span className={styles.formHint}>Base: {slot.punts_base}</span>
                                                        {(() => {
                                                            const nousPunts = parseInt(form.punts) || 0
                                                            const mult = parseInt(form.multiplicador) || 1
                                                            const nSessionsOriginal = rutina.nSessions[faseActiva] ?? 0
                                                            const altresSlots = slotsActuals.filter(s2 => s2.slot !== slot.slot)
                                                            const puntsSenseAquest = altresSlots.reduce((acc, s2) => acc + ((s2.punts ?? 0) * (s2.multiplicador ?? 1)), 0)
                                                            const ptsPorSessio = puntsSenseAquest + (nousPunts * mult)
                                                            const ptsOriginalsPerSessio = slotsActuals.reduce((acc, s2) => acc + (s2.punts_base ?? 0), 0)
                                                            const multiplicadorBase = slot.multiplicador_base ?? 1
                                                            const umbralFase = ptsOriginalsPerSessio * multiplicadorBase * nSessionsOriginal
                                                            if (ptsPorSessio <= 0 || umbralFase <= 0) return null

                                                            let ptsFetsEnAquestaFase = 0
                                                            let sessionsFetes = 0
                                                            // Només descomptem el que porta si estem simulant la fase activa de l'usuari
                                                            if (faseActualDiag === faseActiva) {
                                                                ptsFetsEnAquestaFase = rutina.ptsFetsFaseActual || 0
                                                                sessionsFetes = rutina.sessionsFetesFaseActual || 0
                                                            }
                                                            console.log("faseActualDiag", faseActualDiag)
                                                            console.log("sessionsFetes", sessionsFetes)
                                                            console.log("faseActiva", faseActiva)
                                                            const puntsRestantsFase = Math.max(0, umbralFase - ptsFetsEnAquestaFase)
                                                            const novasSessions = Math.ceil(puntsRestantsFase / ptsPorSessio)


                                                            const diff = nSessionsOriginal - (novasSessions + sessionsFetes)
                                                            return (
                                                                <div className={styles.previewSessions}>
                                                                    <span className={styles.previewLabel}>⭐ Amb aquest canvi:</span>
                                                                    <span>
                                                                        Sessions necessàries a partir d'ara: <strong>{novasSessions}</strong>
                                                                        {diff > 0 && <span className={styles.previewPositiu}> · S&apos;estalvia {diff} {diff === 1 ? 'sessió' : 'sessions'} del total</span>}
                                                                        {diff < 0 && <span className={styles.previewNegatiu}> · Necessita {Math.abs(diff)} {Math.abs(diff) === 1 ? 'sessió' : 'sessions'} més</span>}
                                                                        {diff === 0 && <span className={styles.previewNeutral}> · (sense canvis)</span>}
                                                                    </span>
                                                                </div>
                                                            )
                                                        })()}
                                                    </div>
                                                    <div className={styles.formGroup}>
                                                        <label className={styles.formLabel}>Multiplicador</label>
                                                        <input className={styles.formInput} type="number" min="1" value={form.multiplicador} onChange={e => setForm(p => ({ ...p, multiplicador: e.target.value }))} />
                                                        <span className={styles.formHint}>Base: ✕{slot.multiplicador_base}</span>
                                                    </div>
                                                </div>

                                                <div className={styles.formGroup}>
                                                    <label className={styles.formLabel}>Repeticions</label>
                                                    <input className={styles.formInput} type="text" placeholder="Ex: 3x10, 4 sèries..." value={form.repeticions} onChange={e => setForm(p => ({ ...p, repeticions: e.target.value }))} />
                                                    <span className={styles.formHint}>Base: {slot.repeticions_base}</span>
                                                </div>

                                                <div className={styles.formActions}>
                                                    <button className={styles.cancelBtn} onClick={() => setEditant(null)} disabled={desant}>Cancel·lar</button>
                                                    <button className={styles.desarBtn} onClick={handleDesar} disabled={desant}>{desant ? 'Desant...' : 'Desar canvis'}</button>
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