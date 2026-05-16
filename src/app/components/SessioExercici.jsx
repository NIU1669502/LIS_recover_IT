'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { completarSessio } from '../utils/lesions'
import styles from './sessioExercici.module.css'

export default function SessioExercici({ exercicis = [], indexInicial = 0, fase = 1, onCompletarSessio, musculActual, idDiagnostic = null }) {
    const [index, setIndex] = useState(indexInicial)
    const [repActual, setRepActual] = useState(1)
    const [tempsRestant, setTempsRestant] = useState(null)
    const [cronometreActiu, setCronometreActiu] = useState(false)
    const [cronometreFinalitzat, setCronometreFinalitzat] = useState(false)
    const [mostrarCompletada, setMostrarCompletada] = useState(false)
    const [resultCompletada, setResultCompletada] = useState(null)
    const intervalRef = useRef(null)
    const [urlsVideo, setUrlsVideo] = useState({})
    const [mostrarPuntsFlash, setMostrarPuntsFlash] = useState(false)
    const [puntsFlash, setPuntsFlash] = useState(0)

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
                        setPuntsFlash(exercici.punts * fase)
                        setMostrarPuntsFlash(true)
                        setTimeout(() => setMostrarPuntsFlash(false), 2000)
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

    const finalitzarCronometre = () => {
        clearInterval(intervalRef.current)
        setCronometreActiu(false)
        setCronometreFinalitzat(true)
        setTempsRestant(0)
        setPuntsFlash(exercici.punts * fase)
        setMostrarPuntsFlash(true)
        setTimeout(() => setMostrarPuntsFlash(false), 2000)
    }

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
    const puntsGuanyats = exercicis.reduce((acc, ex) => acc + ((ex.punts || 0) * fase), 0)
    const { data: { session } } = await supabase.auth.getSession()
    const userDni = session?.user?.user_metadata?.dni
    const resultat = await completarSessio(userDni, puntsGuanyats, idDiagnostic)
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
                .eq('id_cos', musculActual.id_cos)

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

    // ── Pantalla completada (tots els exercicis de la sessió)
    if (mostrarCompletada && resultCompletada) {
        const programaAcabat = resultCompletada.completada === true
        const faseAvançada = resultCompletada.faseAvançada === true
        const novaFase = resultCompletada.novaFase

        return (
            <div className={styles.completadaContainer}>
                <div className={styles.completadaIcon} aria-hidden="true">
                    {programaAcabat ? '🏆' : '✅'}
                </div>

                <h2 className={styles.completadaTitle}>
                    {programaAcabat ? 'Programa completat!' : 'Sessió recuperada!'}
                </h2>

                {programaAcabat ? (
                    <p className={styles.completadaText}>
                        Has completat totes les fases del programa de recuperació d&apos;aquesta lesió. Enhorabona!
                    </p>
                ) : (
                    <>
                        <p className={styles.completadaText}>
                            Has completat tots els exercicis d&apos;aquesta sessió i s&apos;ha registrat la teva recuperació al teu programa.
                        </p>
                        {faseAvançada && novaFase != null && (
                            <p className={styles.completadaSubtext}>
                                Has completat les sessions d&apos;aquesta fase i passes a la <strong>fase {novaFase} de 3</strong>.
                            </p>
                        )}
                        {!faseAvançada && (
                            <p className={styles.completadaSubtext}>
                                Continua amb les sessions que et quedin en aquesta fase per avançar al següent nivell.
                            </p>
                        )}
                    </>
                )}

                <div className={styles.puntsBadge}>
                    +{resultCompletada.puntsGuanyats ?? 0} punts guanyats
                </div>

                <button type="button" className={styles.primaryButton} onClick={onCompletarSessio}>
                    Tornar a exercicis en curs
                </button>
            </div>
        )
    }

    if (!exercici) return null

    const textBoto = () => {

        if (!esUltimExercici) return `Següent exercici: ${exercicis[index + 1]?.nom + " del " + musculActual.nom.toLowerCase()}`
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
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0&loop=1&playlist=${videoId}&enablejsapi=0`
        }
    return (
        <div className={styles.container}>
            {mostrarPuntsFlash && (
            <div className={styles.puntsFlash}>
                +{puntsFlash} pts ⭐
            </div>
        )}
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

            <h2 className={styles.exerciciNom}>{exercici.nom + " del " + musculActual.nom.toLowerCase()}</h2>

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

            <div className={`${styles.cronometreWrapper} ${cronometreActiu ? styles.actiu : ''}`}>
                <svg className={styles.cronometreSvg} viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" className={styles.trackCircle} />
                    <circle
                        cx="60" cy="60" r="54"
                        className={`
                            ${styles.progressCircle}
                            ${cronometreFinalitzat ? styles.progressCircleDone : ''}
                            ${tempsRestant <= 10 && tempsRestant > 0 ? styles.progressCircleUrgent : ''}
                            ${tempsRestant <= 20 && tempsRestant > 10 ? styles.progressCircleWarning : ''}
                        `}
                        strokeDasharray={circumferencia}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: cronometreActiu ? 'stroke-dashoffset 1s linear' : 'none' }}
                    />
                </svg>
                <div className={styles.cronometreCenter}>
                    <span className={`
                        ${styles.cronometreTemps}
                        ${tempsRestant <= 10 && tempsRestant > 0 ? styles.cronometreTempsUrgent : ''}
                        ${tempsRestant <= 20 && tempsRestant > 10 ? styles.cronometreTempsWarning : ''}
                    `}>
                        {formatTemps(tempsRestant)}
                </span>
                <span className={styles.cronometreLabel}>
                    {cronometreFinalitzat ? '✓ fet' : cronometreActiu ? 'en curs' : 'preparat'}
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
                {(!cronometreFinalitzat && tempsRestant < exercici.duracio_segons) && (
                    <button className={styles.doneButton} onClick={finalitzarCronometre}>
                        Fet
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
                disabled={!cronometreFinalitzat}
            >
                {textBoto()}
            </button>

        </div>
    )
}