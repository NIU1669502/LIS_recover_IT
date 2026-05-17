'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { vincularPacient, afegirDiagnosticAPacient } from '../utils/fisio'
import { showToast } from '../utils/toast'
import styles from './AfegirPacientModal.module.css'

// ============================================================
// Component: AfegirPacientModal — Flux de 3 passos:
//   1. Selecció del diagnòstic (múscul, lesió, descripció)
//   2. DNI del pacient + generar codi
//   3. Mostrar el codi generat
// ============================================================
const lesions_per_muscul = {
                1: [1, 2, 3],
                2: [1, 2, 3],
                3: [1, 2, 3],
                4: [2, 3],
                5: [2, 3],
                6: [2, 3],
                7: [2, 3],
            }
export default function AfegirPacientModal({ dniFisio, infoPacientInicial, onTancar, onPacientAfegit }) {
    // ── Pas actual del flux (1, 2 o 3) ──────────────────────
    const [pas, setPas] = useState(1)

    // ── Pas 1: dades del diagnòstic ──────────────────────────
    const [musculs, setMusculs] = useState([])
    const [lesions, setLesions] = useState([])
    const [partCosSelec, setPartCosSelec] = useState('')
    const [idLesioSelec, setIdLesioSelec] = useState('')
    const [descripcio, setDescripcio] = useState('')
    const [dni, setDni] = useState('')  

    // ── Pas 2: DNI del pacient ───────────────────────────────

    const [carregant, setCarregant] = useState(false)
    const [error, setError] = useState('')

    // ── Pas 3: codi generat ──────────────────────────────────
    const [codiGenerat, setCodiGenerat] = useState('')
    const [nomPacient, setNomPacient] = useState('')

    // ── Carregar músculs i lesions en muntar ─────────────────
    useEffect(() => {
        const carregarOpcions = async () => {
            const [{ data: musculsDB }, { data: lesionsDB }] = await Promise.all([
                supabase.from('musculs').select('*'),
                supabase.from('lesions').select('*')
            ])
            setMusculs(musculsDB ?? [])
            setLesions(lesionsDB ?? [])
            
        }
        carregarOpcions()
    }, [])

    const lesionsFiltrades = partCosSelec
        ? lesions.filter(l => (lesions_per_muscul[partCosSelec] ?? []).includes(l.id_lesio))
        : []
    // ── Validació i avanç del pas 1 al pas 2 ────────────────
    const handleSeguent = () => {
        if (!partCosSelec || !idLesioSelec) {
            setError('Selecciona el múscul i el tipus de lesió.')
            return
        }
        setError('')
        if (infoPacientInicial?.dniPacient) {
            handleGenerar()
        } else {
            setPas(2)
        }
    }

    // ── Generar codi: vincular pacient a la BD ───────────────
   const handleGenerar = async () => {
    const dniAUtilitzar = infoPacientInicial?.dniPacient || dni
    if (!dniAUtilitzar.trim()) {
        setError('Introdueix el DNI del pacient.')
        return
    }
    setError('')
    setCarregant(true)
    try {
        let resultat

        if (infoPacientInicial?.dniPacient) {
            // Pacient ja vinculat → crear diagnòstic directament
            resultat = await afegirDiagnosticAPacient(
                dniFisio,
                infoPacientInicial.dniPacient,
                parseInt(partCosSelec),
                parseInt(idLesioSelec),
                descripcio.trim()
            )
            if (resultat.ok) {
                showToast(`Nou diagnòstic afegit correctament`, 'success')
                onPacientAfegit()
                onTancar()
            } else {
                setError(resultat.missatge)
            }
        } else {
            // Pacient nou → vincular i generar codi
            const { data: relacio } = await supabase
                .from('relacio_fisio_pacient')
                .select('dni_fisio')
                .eq('dni_pacient', dniAUtilitzar.trim())
                .maybeSingle()

            if (relacio) {
                showToast(`Aquest pacient ja té un fisioterapeuta assignat.`, 'warning')
                setCarregant(false)
                return
            }

            resultat = await vincularPacient(
                dniFisio,
                dniAUtilitzar,
                parseInt(partCosSelec),
                parseInt(idLesioSelec),
                descripcio.trim()
            )

            if (!resultat.ok) {
                setError(resultat.missatge)
            } else {
                setCodiGenerat(resultat.codi)
                setNomPacient(resultat.nomPacient)
                showToast(`Pacient vinculat correctament en espera de confirmació`, 'success')
                onPacientAfegit()
                setPas(3)
            }
        }
    } catch(e) {
        console.error(e)
        showToast(`S'ha produït un error inesperat.`, 'error')
    } finally {
        setCarregant(false)
    }
}

    // ── Renderitzat ──────────────────────────────────────────
    return (
        <div className={styles.overlay} onClick={onTancar}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                {/* ── Capçalera comuna ──────────────────────── */}
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        {pas === 1 && 'Nou diagnòstic'}
                        {pas === 2 && 'Dades del pacient'}
                        {pas === 3 && 'Codi generat'}
                    </h2>
                    {pas !== 3 && (
                        <button className={styles.closeBtn} onClick={onTancar}>✕</button>
                    )}
                </div>

                {/* ── Indicador de pas ──────────────────────── */}
                {pas !== 3 && !infoPacientInicial?.dniPacient && (
                    <div className={styles.stepIndicator}>
                        <span className={`${styles.step} ${pas >= 1 ? styles.stepActive : ''}`}>1</span>
                        <span className={styles.stepLine} />
                        <span className={`${styles.step} ${pas >= 2 ? styles.stepActive : ''}`}>2</span>
                    </div>
                )}

                {/* ══════════════════════════════════════════
                    PAS 1 — Selecció del diagnòstic
                ══════════════════════════════════════════ */}
                {pas === 1 && (
                    <>
                        <p className={styles.desc}>
                            {infoPacientInicial?.dniPacient
                                ?<> Defineix el diagnòstic que vols afegir al pacient<br/><strong>{infoPacientInicial.nomPacient}.</strong></>
                                : 'Defineix el diagnòstic que vols assignar al pacient.'
                            }
                        </p>

                        {/* Múscul */}
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Múscul afectat</label>
                            <select
                                className={styles.input}
                                value={partCosSelec}
                                onChange={e => (setPartCosSelec(e.target.value),setIdLesioSelec(''))}
                            >
                                <option value="">Selecciona un múscul...</option>
                                {musculs.map(m => (
                                    <option key={m.id_cos} value={m.id_cos}>{m.nom}</option>
                                ))}
                            </select>
                        </div>

                        {/* Tipus de lesió */}
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Tipus de lesió</label>
                            <select
                                className={styles.input}
                                value={idLesioSelec}
                                onChange={e => setIdLesioSelec(e.target.value)}
                            >
                                <option value="">Selecciona el tipus de lesió...</option>
                                {lesionsFiltrades.map(l => (
                                    <option key={l.id_lesio} value={l.id_lesio}>{l.nom}</option>
                                ))}
                            </select>
                        </div>

                        {/* Descripció opcional */}
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Descripció (opcional)</label>
                            <textarea
                                className={`${styles.input} ${styles.textarea}`}
                                placeholder="Afegeix notes sobre la lesió del pacient..."
                                value={descripcio}
                                onChange={e => setDescripcio(e.target.value)}
                                rows={3}
                            />
                        </div>

                        {error && <p className={styles.error}>{error}</p>}

                        <div className={styles.actions}>
                            <button className={styles.cancelBtn} onClick={onTancar}>
                                Cancel·lar
                            </button>
                            <button className={styles.confirmBtn} onClick={handleSeguent}>
                               {infoPacientInicial?.dniPacient ? "Afegir nou diagnòstic" : "Següent"}
                            </button>
                        </div>
                    </>
                )}

                {/* ══════════════════════════════════════════
                    PAS 2 — DNI del pacient
                ══════════════════════════════════════════ */}
                {pas === 2 && (
                    <>
                        <p className={styles.desc}>
                            Introdueix el DNI del pacient al qual vols assignar el diagnòstic.
                        </p>

                       
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>DNI del pacient</label>
                                <input
                                    className={styles.input}
                                    type="text"
                                    placeholder="Ex: 12345678A"
                                    value={dni}
                                    onChange={e => setDni(e.target.value.toUpperCase())}
                                    onKeyDown={e => e.key === 'Enter' && handleGenerar()}
                                    autoFocus
                                />
                                
                                {error && <p className={styles.error}>{error}</p>}
                            </div>
                        
                        <div className={styles.actions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => { setPas(1); setError('') }}
                                disabled={carregant}
                            >
                                Tornar
                            </button>
                            <button
                                className={styles.confirmBtn}
                                onClick={handleGenerar}
                                disabled={carregant}
                            >
                                {carregant ? 'Verificant...' : 'Generar codi per pacient'}
                            </button>
                        </div>
                    </>
                )}
                {/* ══════════════════════════════════════════
                    PAS 3 — Codi generat
                ══════════════════════════════════════════ */}
                {pas === 3 && (
                    <div className={styles.codiContainer}>
                        <p className={styles.codiLabel}>
                            Comparteix el següent codi de validació amb el pacient:
                        </p>
                        <div className={styles.codiBadge}>
                            {codiGenerat}
                        </div>
                        <p className={styles.codiSub}>
                            El pacient <strong>{nomPacient}</strong> haurà d'introduir aquest codi
                            al seu perfil per confirmar l'assignació i activar el diagnòstic.
                        </p>
                        <button
                            className={styles.confirmBtn}
                            style={{ width: '100%', marginTop: '8px' }}
                            onClick={onTancar}
                        >
                            Continuar
                        </button>
                    </div>
                )}

            </div>
        </div>
    )
}
