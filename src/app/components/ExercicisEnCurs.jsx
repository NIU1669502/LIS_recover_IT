'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../utils/supabase'
import { getDiagnosticsActius, getExercicisDelaFase, getResumSessions } from '../utils/lesions'
import { comprovarIAplicarPenalitzacio } from '../utils/penalitzacio'
import styles from './exercicisEnCurs.module.css'

const storageKeyDiagnostic = (dni) => `recoverit_exercicis_diagnostic_${dni}`

function deriveSelectedId(list, currentId, userDni) {
    if (currentId != null && list.some((d) => d.id_diagnostic === currentId)) {
        return currentId
    }
    if (typeof window !== 'undefined' && userDni) {
        const raw = localStorage.getItem(storageKeyDiagnostic(userDni))
        const stored = raw != null ? Number(raw) : NaN
        if (!Number.isNaN(stored) && list.some((d) => d.id_diagnostic === stored)) {
            return stored
        }
    }
    return list[0]?.id_diagnostic ?? null
}

export default function ExercicisEnCurs({ onNavegar, onIniciarSessio, perfilUsuari,idDiagnosticInicial }) {
    const [diagnosticsOpcions, setDiagnosticsOpcions] = useState([])
    const [idDiagnosticSeleccionat, setIdDiagnosticSeleccionat] = useState(null)
    const [diagnostic, setDiagnostic] = useState(null)
    const [exercicis, setExercicis] = useState([])
    const [infoMuscul, setInfoMuscul] = useState({ id_cos: 0, nom: '' })
    const [nomLesio, setNomLesio] = useState('')
    const [sessionsFetes, setSessionsFetes] = useState(0)
    const [sessionsTotals, setSessionsTotals] = useState(0)
    const [carregant, setCarregant] = useState(true)
    const [refreshNonce, setRefreshNonce] = useState(0)
    /** Informació de penalització activa per al diagnòstic seleccionat */
    const [infoPenalitzacio, setInfoPenalitzacio] = useState(null)
    /** Amb diverses lesions: false = només llistat; true = resum de sessió (exercicis, iniciar…). */
    const [mostrarResumSessio, setMostrarResumSessio] = useState(false)

    const canalRef = useRef(null)

    useEffect(() => {
        if (!idDiagnosticInicial) return
        obrirResumSessio(idDiagnosticInicial)
    }, [idDiagnosticInicial])

    const seleccionarDiagnostic = useCallback(
        (id) => {
            setIdDiagnosticSeleccionat(id)
            if (perfilUsuari?.dni && typeof window !== 'undefined') {
                localStorage.setItem(storageKeyDiagnostic(perfilUsuari.dni), String(id))
            }
        },
        [perfilUsuari?.dni]
    )

    const obrirResumSessio = useCallback(
        (id) => {
            seleccionarDiagnostic(id)
            setMostrarResumSessio(true)
        },
        [seleccionarDiagnostic]
    )

    const tornarALlistatSessions = useCallback(() => {
        setMostrarResumSessio(false)
    }, [])

    useEffect(() => {
        let cancelat = false

        const carregar = async () => {
            if (!perfilUsuari?.dni) {
                setCarregant(false)
                return
            }

            setCarregant(true)
            setInfoPenalitzacio(null)
            const userDni = perfilUsuari.dni
            const listRaw = await getDiagnosticsActius(userDni)

            if (cancelat) return

            if (!listRaw.length) {
                setDiagnosticsOpcions([])
                setDiagnostic(null)
                setExercicis([])
                setIdDiagnosticSeleccionat(null)
                setCarregant(false)
                return
            }

            const partIds = [...new Set(listRaw.map((d) => d.part_cos).filter(Boolean))]
            const lesIds = [...new Set(listRaw.map((d) => d.id_lesio).filter(Boolean))]

            const [{ data: musculsRows }, { data: lesionsRows }] = await Promise.all([
                partIds.length
                    ? supabase.from('musculs').select('id_cos, nom').in('id_cos', partIds)
                    : Promise.resolve({ data: [] }),
                lesIds.length
                    ? supabase.from('lesions').select('id_lesio, nom').in('id_lesio', lesIds)
                    : Promise.resolve({ data: [] }),
            ])

            if (cancelat) return

            const muscleMap = Object.fromEntries((musculsRows ?? []).map((m) => [m.id_cos, m.nom]))
            const lesioMap = Object.fromEntries((lesionsRows ?? []).map((l) => [l.id_lesio, l.nom]))

            const enriched = listRaw.map((d) => ({
                ...d,
                nomMuscul: muscleMap[d.part_cos] ?? '—',
                nomLesio: lesioMap[d.id_lesio] ?? '—',
            }))

            setDiagnosticsOpcions(enriched)

            const seleccionat = deriveSelectedId(enriched, idDiagnosticSeleccionat, userDni)
            if (seleccionat !== idDiagnosticSeleccionat) {
                setIdDiagnosticSeleccionat(seleccionat)
            }

            const diag = enriched.find((d) => d.id_diagnostic === seleccionat)
            if (!diag) {
                setDiagnostic(null)
                setExercicis([])
                setCarregant(false)
                return
            }

            // ── Comprovació de penalització per inactivitat (>72h) ──────────
            let infoPen = { penalitzat: false }
            try {
                infoPen = await comprovarIAplicarPenalitzacio(userDni, seleccionat)
            } catch (e) {
                console.error('[Penalització] Error en la comprovació:', e)
            }
            if (cancelat) return
            setInfoPenalitzacio(infoPen)

            // Si s'acaba d'aplicar una penalització, tornem a llegir el diagnòstic
            // de la BD per tenir num_sessions i punts_recuperacio actualitzats
            let diagActualitzat = diag
            if (infoPen.penalitzat && !infoPen.jaPenalitzat) {
                const { data: freshDiag } = await supabase
                    .from('diagnostic')
                    .select('*')
                    .eq('id_diagnostic', seleccionat)
                    .maybeSingle()
                if (freshDiag) diagActualitzat = { ...diag, ...freshDiag }
            }
            if (cancelat) return
            // ────────────────────────────────────────────────────────────────

            const [{ data: muscul }, { data: lesio }, exs, { fetes, totals }] = await Promise.all([
                supabase.from('musculs').select('id_cos, nom').eq('id_cos', diagActualitzat.part_cos).single(),
                supabase.from('lesions').select('nom').eq('id_lesio', diagActualitzat.id_lesio).single(),
                getExercicisDelaFase(diagActualitzat),
                getResumSessions(diagActualitzat),
            ])

            if (cancelat) return

            if (muscul) setInfoMuscul(muscul)
            if (lesio) setNomLesio(lesio.nom)
            setExercicis(exs)
            setSessionsFetes(fetes)
            setSessionsTotals(totals)
            setDiagnostic(diagActualitzat)
            setCarregant(false)
        }

        carregar()

        return () => {
            cancelat = true
        }
    }, [perfilUsuari?.dni, idDiagnosticSeleccionat, refreshNonce])

    useEffect(() => {
        if (!perfilUsuari?.dni) return

        const userDni = perfilUsuari.dni
        const bump = () => setRefreshNonce((n) => n + 1)

        if (canalRef.current) {
            supabase.removeChannel(canalRef.current)
            canalRef.current = null
        }

        canalRef.current = supabase
            .channel('exercicis-en-curs-rt')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'diagnostic', filter: `dni_pacient=eq.${userDni}` },
                bump
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'relacio_fisio_pacient', filter: `dni_pacient=eq.${userDni}` },
                bump
            )
            .subscribe()

        return () => {
            if (canalRef.current) {
                supabase.removeChannel(canalRef.current)
                canalRef.current = null
            }
        }
    }, [perfilUsuari?.dni])

    if (carregant && !diagnostic && diagnosticsOpcions.length === 0) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>Carregant exercicis...</p>
            </div>
        )
    }

    if (!diagnostic && diagnosticsOpcions.length === 0) {
        return (
            <div className={styles.emptyContainer}>
                <div className={styles.emptyIcon}>🏥</div>
                <h2 className={styles.emptyTitle}>Encara no tens cap rutina</h2>
                <p className={styles.emptyText}>
                    Fes el test diagnòstic per crear un programa de recuperació, o consulta el teu fisioterapeuta. Si ja n&apos;has completat un, pots començar-ne un altre amb el mateix test.
                </p>
                <button className={styles.primaryButton} onClick={() => onNavegar('test')}>
                    Fer el test diagnòstic
                </button>
            </div>
        )
    }

    if (carregant && diagnostic) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>Carregant rutina seleccionada...</p>
            </div>
        )
    }

    if (!diagnostic) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>Carregant...</p>
            </div>
        )
    }

    const estaCompletat = sessionsTotals > 0 && sessionsFetes >= sessionsTotals
    const puntsActuals = diagnostic?.punts_recuperacio ?? 0
    const puntsObjectiu = diagnostic?.puntsFinals ?? 0

    if (estaCompletat) {
        return (
            <div className={styles.emptyContainer}>
                <div className={styles.emptyIcon}>🎉</div>
                <h2 className={styles.emptyTitle}>Programa completat!</h2>
                <p className={styles.emptyText}>
                    Has completat totes les sessions d&apos;aquesta recuperació. Enhorabona!
                </p>
                {diagnosticsOpcions.length > 1 && (
                    <p className={styles.emptyText}>
                        Si tens altres lesions en curs, torna a la pantalla d&apos;Exercicis en curs i tria una altra sessió al llistat.
                    </p>
                )}
                <button className={styles.primaryButton} onClick={() => onNavegar('test')}>
                    Fer un nou test
                </button>
            </div>
        )
    }

    const multiples = diagnosticsOpcions.length > 1
    const mostrarResum = !multiples || mostrarResumSessio

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Exercicis en curs</h2>

            {multiples && !mostrarResumSessio && (
                <div className={styles.sessioSelector}>
                    <p className={styles.sessioSelectorTitle}>Tria la sessió de recuperació</p>
                    <p className={styles.sessioSelectorHint}>
                        Tens {diagnosticsOpcions.length} lesions en curs. Toca la que vols treballar per veure el resum i iniciar la sessió.
                    </p>
                    <div className={styles.sessioCards}>
                        {diagnosticsOpcions.map((d) => {
                            const seleccionat = d.id_diagnostic === idDiagnosticSeleccionat
                            return (
                                <button
                                    key={d.id_diagnostic}
                                    type="button"
                                    className={`${styles.sessioCard} ${seleccionat ? styles.sessioCardSelected : ''}`}
                                    onClick={() => obrirResumSessio(d.id_diagnostic)}
                                >
                                    <span className={styles.sessioCardMuscle}>{d.nomMuscul}</span>
                                    <span className={styles.sessioCardLesio}>{d.nomLesio}</span>
                                    <span className={styles.sessioCardMeta}>
                                        Fase {d.fase_actual}/3 · {d.punts_recuperacio ?? 0}/{d.puntsFinals ?? 0} pts
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {mostrarResum && (
                <>
                    {multiples && (
                        <button
                            type="button"
                            className={styles.backToListButton}
                            onClick={tornarALlistatSessions}
                        >
                            Tornar al llistat de lesions
                        </button>
                    )}

                    {infoPenalitzacio?.penalitzat && (
                        <div className={styles.penalitzacioBanner}>
                            <span className={styles.penalitzacioIcon}>⚠️</span>
                            <div className={styles.penalitzacioText}>
                                <strong>Penalització per inactivitat</strong>
                                <p>
                                    Han passat més de 3 dies des de l&apos;última sessió.
                                    S&apos;han restat <strong>{infoPenalitzacio.puntsRestats ?? 0} punts</strong> i una sessió del teu progrés.
                                    Completa la sessió avui per recuperar-los!
                                </p>
                            </div>
                        </div>
                    )}

                    <div className={styles.rutinaInfo}>
                        <div className={styles.rutinaTag}>
                            <span className={styles.tagLabel}>Múscul</span>
                            <span className={styles.tagValue}>{infoMuscul.nom}</span>
                        </div>
                        <div className={styles.rutinaTag}>
                            <span className={styles.tagLabel}>Lesió</span>
                            <span className={styles.tagValue}>{nomLesio}</span>
                        </div>
                        <div className={styles.rutinaTag}>
                            <span className={styles.tagLabel}>Fase</span>
                            <span className={styles.tagValue}>{diagnostic.fase_actual} / 3</span>
                        </div>
                        <div className={styles.rutinaTag}>
                            <span className={styles.tagLabel}>Progrés</span>
                            <span className={styles.tagValue}>
                                {puntsActuals} / {puntsObjectiu} pts
                            </span>
                        </div>
                    </div>

                    <div className={styles.sessionsCounter}>
                        <span>Sessions necessàries/dia per superar la fase (fetes / requerides): </span>
                        <strong>
                            {sessionsFetes} / {sessionsTotals}
                        </strong>
                    </div>

                    <div className={styles.faseProgress}>
                        {[1, 2, 3].map((f) => (
                            <div
                                key={f}
                                className={`${styles.faseDot} ${f < diagnostic.fase_actual ? styles.faseDotDone : ''} ${f === diagnostic.fase_actual ? styles.faseDotActive : ''}`}
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
                                        <span>🔁 {ex.Repeticions} reps</span>
                                        <span>⭐ {ex.punts * diagnostic.fase_actual} pts</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        className={styles.primaryButton}
                        onClick={() => onIniciarSessio(exercicis, diagnostic.fase_actual, infoMuscul, diagnostic.id_diagnostic)}
                    >
                        Iniciar sessió d&apos;exercicis
                    </button>
                </>
            )}
        </div>
    )
}
