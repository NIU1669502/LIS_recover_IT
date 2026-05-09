'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { getDiagnosticActiu, getExercicisDelaFase, getResumSessions } from '../utils/lesions'
import styles from './exercicisEnCurs.module.css'

export default function ExercicisEnCurs({ onNavegar, onIniciarSessio, perfilUsuari }) {
    const [diagnostic, setDiagnostic] = useState(null)
    const [exercicis, setExercicis] = useState([])
    const [nomMuscul, setNomMuscul] = useState('')
    const [nomLesio, setNomLesio] = useState('')
    const [sessionsFetes, setSessionsFetes] = useState(0)
    const [sessionsTotals, setSessionsTotals] = useState(0)
    const [carregant, setCarregant] = useState(true)

    const canalRef = useRef(null)

    useEffect(() => {
        let cancelat = false

        const carregar = async () => {
            if (!perfilUsuari?.dni) { setCarregant(false); return }

            setCarregant(true)
            const userDni = perfilUsuari.dni
            const diag = await getDiagnosticActiu(userDni)

            if (cancelat) return
            if (!diag) { setDiagnostic(null); setCarregant(false); return }

            const [
                { data: muscul },
                { data: lesio },
                exs,
                { fetes, totals }
            ] = await Promise.all([
                supabase.from('musculs').select('nom').eq('id_cos', diag.part_cos).single(),
                supabase.from('lesions').select('nom').eq('id_lesio', diag.id_lesio).single(),
                getExercicisDelaFase(diag),
                getResumSessions(diag)
            ])

            if (cancelat) return

            if (muscul) setNomMuscul(muscul.nom)
            if (lesio) setNomLesio(lesio.nom)
            setExercicis(exs)
            setSessionsFetes(fetes)
            setSessionsTotals(totals)
            setDiagnostic(diag)
            setCarregant(false)

            if (canalRef.current) return
            canalRef.current = supabase
                .channel('exercicis-en-curs-rt')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'diagnostic', filter: `dni_pacient=eq.${userDni}` }, carregar)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'relacio_fisio_pacient', filter: `dni_pacient=eq.${userDni}` }, carregar)
                .subscribe()
        }

        carregar()

        return () => {
            cancelat = true
            if (canalRef.current) {
                supabase.removeChannel(canalRef.current)
                canalRef.current = null
            }
        }
    }, [perfilUsuari?.dni])

    if (carregant && !diagnostic) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>Carregant exercicis...</p>
            </div>
        )
    }

    if (!diagnostic) {
        return (
            <div className={styles.emptyContainer}>
                <div className={styles.emptyIcon}>🏥</div>
                <h2 className={styles.emptyTitle}>Encara no tens cap rutina</h2>
                <p className={styles.emptyText}>
                    Fes el test diagnòstic per rebre el teu programa de recuperació aproximat o consulta amb un fisioterapeuta per un personalitzat.
                </p>
                <button className={styles.primaryButton} onClick={() => onNavegar('test')}>
                    Fer el test diagnòstic
                </button>
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
                    Has completat totes les sessions de la teva recuperació. Enhorabona!
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
                    <span className={styles.tagValue}>{nomMuscul}</span>
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
                    <span className={styles.tagValue}>{puntsActuals} / {puntsObjectiu} pts</span>
                </div>
            </div>

            <div className={styles.sessionsCounter}>
                <span>Sessions necessàries/dia per superar la fase (fetes / requerides): </span>
                <strong>{sessionsFetes} / {sessionsTotals}</strong>
            </div>

            <div className={styles.faseProgress}>
                {[1, 2, 3].map(f => (
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
                onClick={() => onIniciarSessio(exercicis, diagnostic.fase_actual, diagnostic.part_cos)}
            >
                Iniciar sessió d'exercicis
            </button>
        </div>
    )
}