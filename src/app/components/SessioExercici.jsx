'use client'

import { useState, useEffect, useRef } from 'react'
import { avancarFase, getAssignacio } from '../data/mockRutines'
import styles from './sessioExercici.module.css'

export default function SessioExercici({ exercicis = [], indexInicial = 0, onCompletarSessio }) {
    const [index, setIndex] = useState(indexInicial)
    const [tempsRestant, setTempsRestant] = useState(null)
    const [cronometreActiu, setCronometreActiu] = useState(false)
    const [cronometreFinalitzat, setCronometreFinalitzat] = useState(false)
    const [mostrarCompletada, setMostrarCompletada] = useState(false)
    const assignacio = getAssignacio()
    const fase = assignacio?.fase_actual ?? 1
    const intervalRef = useRef(null)


    const exercici = exercicis[index]
    const esUltim = index === exercicis.length - 1

    // Reset cronòmetre quan canvia d'exercici
    useEffect(() => {
        if (exercici) {
            setTempsRestant(exercici.duracio_segons)
            setCronometreActiu(false)
            setCronometreFinalitzat(false)
        }
        return () => clearInterval(intervalRef.current)
    }, [index, exercici])

    // Lògica del cronòmetre
    useEffect(() => {
        if (cronometreActiu && tempsRestant > 0) {
            intervalRef.current = setInterval(() => {
                setTempsRestant(t => {
                    if (t <= 1) {
                        clearInterval(intervalRef.current)
                        setCronometreActiu(false)
                        setCronometreFinalitzat(true)
                        return 0
                    }
                    return t - 1
                })
            }, 1000)
        }
        return () => clearInterval(intervalRef.current)
    }, [cronometreActiu])

    const iniciarCronòmetre = () => {
        setCronometreActiu(true)
        setCronometreFinalitzat(false)
    }

    const pausarCronòmetre = () => setCronometreActiu(false)

    const reiniciarCronòmetre = () => {
        clearInterval(intervalRef.current)
        setCronometreActiu(false)
        setCronometreFinalitzat(false)
        setTempsRestant(exercici.duracio_segons)
    }

    const handleCompletar = () => {
        if (esUltim) {
            // Última sessió — avançar fase i mostrar pantalla de completat
            avancarFase()
            setMostrarCompletada(true)
        } else {
            setIndex(i => i + 1)
        }
    }

    const formatTemps = (s) => {
        const m = Math.floor(s / 60)
        const seg = s % 60
        return m > 0 ? `${m}:${seg.toString().padStart(2, '0')}` : `${seg}s`
    }

    const pct = exercici ? (tempsRestant / exercici.duracio_segons) * 100 : 100
    const circumferencia = 2 * Math.PI * 54 // radi 54
    const strokeDashoffset = circumferencia * (1 - pct / 100)

    // ── Pantalla completada ─────────────────────────────────
    if (mostrarCompletada) {
        const assignacio = getAssignacio()
        const faseSeguent = assignacio?.fase_actual
        const completada = assignacio?.completada

        return (
            <div className={styles.completadaContainer}>
                <div className={styles.completadaIcon}>{completada ? '🏆' : '🎯'}</div>
                <h2 className={styles.completadaTitle}>
                    {completada ? 'Programa completat!' : 'Sessió completada!'}
                </h2>
                <p className={styles.completadaText}>
                    {completada
                        ? 'Has completat totes les fases del programa de recuperació. Enhorabona!'
                        : `Molt bé! Ara estàs a la Fase ${faseSeguent}.`}
                </p>
                <div className={styles.puntsBadge}>
                    +{exercicis.reduce((acc, ex) => acc + (ex.punts * fase || 0), 0)} punts guanyats
                </div>
                <button className={styles.primaryButton} onClick={onCompletarSessio}>
                    Tornar als exercicis →
                </button>
            </div>
        )
    }

    if (!exercici) return null

    return (
        <div className={styles.container}>

            {/* Progrés de la sessió */}
            <div className={styles.progressHeader}>
                <span className={styles.progressText}>
                    Exercici {index + 1} de {exercicis.length}
                </span>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${((index) / exercicis.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Nom i info */}
            <h2 className={styles.exerciciNom}>{exercici.nom}</h2>
            <p className={styles.exerciciReps}>🔁 {exercici.reps} repeticions</p>

            {/* Video placeholder */}
            <div className={styles.videoPlaceholder}>
                <div className={styles.videoIcon}>▶</div>
                <p className={styles.videoText}>Vídeo demostratiu</p>
                <p className={styles.videoSub}>(disponible aviat)</p>
            </div>

            {/* Cronòmetre circular */}
            <div className={styles.cronometreWrapper}>
                <svg className={styles.cronometreSvg} viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" className={styles.trackCircle} />
                    <circle
                        cx="60" cy="60" r="54"
                        className={`${styles.progressCircle} ${cronometreFinalitzat ? styles.progressCircleDone : ''}`}
                        strokeDasharray={circumferencia}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: cronometreActiu ? 'stroke-dashoffset 1s linear' : 'none' }}
                    />
                </svg>
                <div className={styles.cronometreCenter}>
                    <span className={styles.cronometreTemps}>{formatTemps(tempsRestant)}</span>
                    <span className={styles.cronometreLabel}>
                        {cronometreFinalitzat ? '✓ fet!' : cronometreActiu ? 'en curs' : 'preparat'}
                    </span>
                </div>
            </div>

            {/* Controls cronòmetre */}
            <div className={styles.cronometreControls}>
                {!cronometreActiu && !cronometreFinalitzat && (
                    <button className={styles.playButton} onClick={iniciarCronòmetre}>
                        ▶ Iniciar cronòmetre
                    </button>
                )}
                {cronometreActiu && (
                    <button className={styles.pauseButton} onClick={pausarCronòmetre}>
                        ⏸ Pausar
                    </button>
                )}
                {(cronometreActiu || cronometreFinalitzat || tempsRestant < exercici.duracio_segons) && (
                    <button className={styles.resetButton} onClick={reiniciarCronòmetre}>
                        ↺ Reiniciar
                    </button>
                )}
            </div>

            {/* Punts d'aquest exercici */}
            <div className={styles.puntsInfo}>
                ⭐ {exercici.punts * fase} punts en completar
            </div>

            {/* Botó completar */}
            <button
                className={`${styles.completarButton} ${cronometreFinalitzat ? styles.completarButtonReady : ''}`}
                onClick={handleCompletar}
            >
                {esUltim ? '🏁 Completar sessió' : `Següent exercici → ${exercicis[index + 1]?.nom}`}
            </button>

        </div>
    )
}