'use client'

import { useState } from 'react'
import { TEST_STEPS } from '../data/testSteps.js'
import { determinarLesio } from '../utils/lesions'
import styles from './testDiagnostic.module.css'

// ============================================================
// Component: TestDiagnostic — RF-PAC-01
// Props:
//   onGuardar(resultat) — crida quan l'usuari confirma el resultat
//   onCancel()          — crida quan l'usuari tanca el test
// ============================================================
export default function TestDiagnostic({ onGuardar, onCancel }) {
    const [pas, setPas] = useState(0)
    const [respostes, setRespostes] = useState({})
    const [resultat, setResultat] = useState(null)
    const [textInput, setTextInput] = useState('')

    const seleccionar = (valor) => {
        const novesRespostes = { ...respostes, [pas]: valor }
        setRespostes(novesRespostes)
        setTextInput('')

        if (pas < TEST_STEPS.length - 1) {
            setPas(pas + 1)
        } else {
            const detall = determinarLesio(novesRespostes)
            const muscle = TEST_STEPS[0].opcions[novesRespostes[0]]
            setResultat({ muscle, ...detall, descripcio: novesRespostes[4] })
        }
    }

    const reiniciar = () => {
        setPas(0)
        setRespostes({})
        setResultat(null)
        setTextInput('')
    }

    // ── Pantalla de resultat ────────────────────────────────
    if (resultat) {
        return (
            <div className={styles.resultContainer}>
                <button onClick={onCancel} className={styles.closeButton} title="Tancar resultats">
                    &times;
                </button>

                <div className={styles.emoji}>{resultat.emoji}</div>

                <h2 className={styles.resultTitle}>{resultat.tipus}</h2>

                <p className={styles.resultText}>
                    Hem detectat una <strong className={styles.highlight}>{resultat.tipus}</strong> als{' '}
                    <strong className={styles.highlight}>{resultat.muscle}</strong>.
                </p>

                <div className={styles.resultGrid}>
                    {[
                        { label: 'Múscul afectat', valor: resultat.muscle },
                        { label: 'Temps recuperació', valor: resultat.temps },
                        { label: 'Sessions neces.', valor: resultat.sessions },
                        { label: 'Fase inicial', valor: resultat.fase },
                    ].map(({ label, valor }) => (
                        <div key={label} className={styles.resultCard}>
                            <p className={styles.resultLabel}>{label}</p>
                            <p className={styles.resultValue}>{valor}</p>
                        </div>
                    ))}
                </div>

                <button onClick={() => onGuardar(resultat)} className={styles.primaryButton}>
                    Començar programa →
                </button>

                <button onClick={reiniciar} className={styles.secondaryButton}>
                    ↺ Tornar a fer el test
                </button>
            </div>
        )
    }

    // ── Pantalla de preguntes ───────────────────────────────
    const step = TEST_STEPS[pas]

    return (
        <div className={styles.questionContainer}>
            <button onClick={onCancel} className={styles.closeButton}>
                &times;
            </button>

            {/* Barra de progrés */}
            <p className={styles.progressText}>
                Pas {pas + 1} de {TEST_STEPS.length}
            </p>

            <div className={styles.progressBar}>
                <div
                    className={styles.progressFill}
                    style={{ width: `${(pas / TEST_STEPS.length) * 100}%` }}
                />
            </div>

            <div className={styles.warningBox}>
                <span className={styles.warningIcon}>❗</span>
                <p>
                    <strong>Atenció:</strong> Aquest pla és una aproximació, es recomana consultar a un
                    fisioterapeuta.
                </p>
            </div>

            <h3 className={styles.questionTitle}>{step.pregunta}</h3>

            <div className={styles.optionsContainer}>
                {step.tipus === 'text' ? (
                    <>
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            className={styles.textarea}
                        />

                        <button
                            onClick={() => seleccionar(textInput)}
                            disabled={!textInput.trim()}
                            className={`${styles.nextButton} ${textInput.trim() ? styles.nextButtonEnabled : styles.nextButtonDisabled
                                }`}
                        >
                            Següent →
                        </button>
                    </>
                ) : (
                    step.opcions.map((opcio, idx) => (
                        <button key={idx} onClick={() => seleccionar(idx)} className={styles.optionButton}>
                            {opcio}
                        </button>
                    ))
                )}
            </div>
        </div>
    )
}