'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { completarSessio } from '../utils/lesions'
import styles from './sessioExercici.module.css'

export default function SessioExercici({ exercicis = [], indexInicial = 0, fase = 1, onCompletarSessio, musculActual }) {
    const [index, setIndex] = useState(indexInicial)
    const [repActual, setRepActual] = useState(1)
    const [tempsRestant, setTempsRestant] = useState(null)
    const [cronometreActiu, setCronometreActiu] = useState(false)
    const [cronometreFinalitzat, setCronometreFinalitzat] = useState(false)
    const [mostrarCompletada, setMostrarCompletada] = useState(false)
    const [resultCompletada, setResultCompletada] = useState(null)
    const intervalRef = useRef(null)
    const [urlsVideo, setUrlsVideo] = useState({})

    const exercici = exercicis[index]
    const totalReps = exercici.Repeticions
    const esUltimaRep = true
    const esUltimExercici = index === exercicis.length - 1

    // Reset quan canvia d'exercici
    useEffect(() => {
        if (exercici) {
            setTempsRestant(exercici.duracio_segons)
            setCronometreActiu(false)
            setCronometreFinalitzat(false)
            setRepActual(1)
        }
        return () => clearInterval(intervalRef.current)
    }, [index])

    // Cronòmetre
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

    const iniciarCronòmetre = () => { setCronometreActiu(true); setCronometreFinalitzat(false) }
    const pausarCronòmetre = () => setCronometreActiu(false)
    const reiniciarCronòmetre = () => {
        clearInterval(intervalRef.current)
        setCronometreActiu(false)
        setCronometreFinalitzat(false)
        setTempsRestant(exercici.duracio_segons)
    }

    const handleCompletar = async () => {


        if (!esUltimExercici) {
            setIndex(i => i + 1)
            return
        }

        // Últim exercici, última rep — completar sessió a Supabase
        const puntsGuanyats = exercicis.reduce((acc, ex) => acc + ((ex.punts || 0) * fase), 0)
        const { data: { session } } = await supabase.auth.getSession()
        const userDni = session?.user?.user_metadata?.dni
        const resultat = await completarSessio(userDni, puntsGuanyats)
        setResultCompletada({ ...resultat, puntsGuanyats })
        setMostrarCompletada(true)
    }

    useEffect(() => {
        const carregarUrls = async () => {
            const ids = exercicis.map(e => e.id_exercici)

            const { data } = await supabase
                .from('exercici_muscul')
                .select('id_exercici, url_video')
                .in('id_exercici', ids)
                .eq('id_cos', musculActual)

            if (data) {
                const mapa = {}
                data.forEach(row => { mapa[row.id_exercici] = row.url_video })
                setUrlsVideo(mapa)
            }
        }

        if (musculActual && exercicis.length > 0) carregarUrls()
    }, [musculActual, exercicis])

    const formatTemps = (s) => {
        const m = Math.floor(s / 60)
        const seg = s % 60
        return m > 0 ? `${m}:${seg.toString().padStart(2, '0')}` : `${seg}s`
    }

    const pct = exercici ? (tempsRestant / exercici.duracio_segons) * 100 : 100
    const circumferencia = 2 * Math.PI * 54
    const strokeDashoffset = circumferencia * (1 - pct / 100)

    // ── Pantalla completada ────────a
    if (mostrarCompletada && resultCompletada) {
        return (
            <div className={styles.completadaContainer}>

                <h2 className={styles.completadaTitle}>
                    {resultCompletada.completada ? 'Programa completat!' : 'Sessió completada!'}
                </h2>
                <p className={styles.completadaText}>
                    {resultCompletada.completada
                        ? 'Has completat totes les fases del programa. Enhorabona!'
                        : `Molt bé! Ara estàs a la Fase ${resultCompletada.novaFase}.`}
                </p>
                <div className={styles.puntsBadge}>
                    +{resultCompletada.puntsGuanyats} punts guanyats
                </div>
                <button className={styles.primaryButton} onClick={onCompletarSessio}>
                    Tornar als exercicis
                </button>
            </div>
        )
    }

    if (!exercici) return null

    const textBoto = () => {

        if (!esUltimExercici) return `Següent exercici: ${exercicis[index + 1]?.nom}`
        return 'Completar sessió'
    }
    const convertirYoutubeURL = (url) => {
        if (!url) return ''
        let videoId = ''
        const shortMatch = url.match(/youtu\.be\/([^?]+)/)
        if (shortMatch) videoId = shortMatch[1]
        const longMatch = url.match(/[?&]v=([^&]+)/)
        if (longMatch) videoId = longMatch[1]

        if (!videoId) return url
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0`
    }
    return (
        <div className={styles.container}>

            <div className={styles.progressHeader}>
                <span className={styles.progressText}>
                    Exercici {index + 1} de {exercicis.length}
                </span>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${(index / exercicis.length) * 100}%` }}
                    />
                </div>
            </div>

            <h2 className={styles.exerciciNom}>{exercici.nom}</h2>

            {/* Tracker de repeticions */}
            <div className={styles.repsTracker}>
                <span className={styles.repsLabel}>Repeticions necessàries: {totalReps}</span>
            </div>

            <div className={styles.videoPlaceholder}>
                {urlsVideo[exercici.id_exercici] ? (
                    <iframe
                        className={styles.video}
                        src={convertirYoutubeURL(urlsVideo[exercici.id_exercici])}
                        width="100%"
                        allowFullScreen
                        allow="autoplay"
                        frameBorder="0"
                    />
                ) : (
                    <>
                        <div className={styles.videoIcon}>▶</div>
                        <p className={styles.videoText}>Vídeo demostratiu</p>
                        <p className={styles.videoSub}>(disponible aviat)</p>
                    </>
                )}
            </div>

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

            <div className={styles.cronometreControls}>
                {!cronometreActiu && !cronometreFinalitzat && (
                    <button className={styles.playButton} onClick={iniciarCronòmetre}>
                        Iniciar cronòmetre
                    </button>
                )}
                {cronometreActiu && (
                    <button className={styles.pauseButton} onClick={pausarCronòmetre}>
                        Pausar
                    </button>
                )}
                {(cronometreActiu || cronometreFinalitzat || tempsRestant < exercici.duracio_segons) && (
                    <button className={styles.resetButton} onClick={reiniciarCronòmetre}>
                        Reiniciar
                    </button>
                )}
            </div>

            <div className={styles.puntsInfo}>
                {exercici.punts * fase} punts en completar
            </div>

            <button
                className={`${styles.completarButton} ${cronometreFinalitzat ? styles.completarButtonReady : ''}`}
                onClick={handleCompletar}
            >
                {textBoto()}
            </button>

        </div>
    )
}