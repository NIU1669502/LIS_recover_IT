'use client'

import { useState } from 'react'
import { TEST_STEPS } from '../data/testSteps.js'
import { determinarLesio } from '../utils/lesions'

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
            <div style={{ marginTop: '1.5rem', background: '#ffffff', padding: '2rem 1.5rem', borderRadius: '16px', color: '#111827', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', fontFamily: 'system-ui, sans-serif', position: 'relative' }}>
                <button
                    onClick={onCancel}
                    style={{ position: 'absolute', top: '1rem', right: '1.25rem', background: 'none', border: 'none', fontSize: '1.5rem', color: '#9ca3af', cursor: 'pointer', lineHeight: 1 }}
                    onMouseOver={e => e.target.style.color = '#ef4444'}
                    onMouseOut={e => e.target.style.color = '#9ca3af'}
                    title="Tancar resultats"
                >
                    &times;
                </button>

                <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem', lineHeight: 1 }}>{resultat.emoji}</div>

                <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.75rem', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                    {resultat.tipus}
                </h2>

                <p style={{ color: '#4b5563', fontSize: '1rem', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
                    Hem detectat una <strong style={{ color: '#111827' }}>{resultat.tipus}</strong> als <strong style={{ color: '#111827' }}>{resultat.muscle}</strong>. Et preparem un programa de rehabilitació aproximat.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', textAlign: 'left', marginBottom: '2rem' }}>
                    {[
                        { label: 'Múscul afectat', valor: resultat.muscle },
                        { label: 'Temps recuperació', valor: resultat.temps },
                        { label: 'Sessions neces.', valor: resultat.sessions },
                        { label: 'Fase inicial', valor: resultat.fase },
                    ].map(({ label, valor }) => (
                        <div key={label} style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '12px' }}>
                            <p style={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.25rem', textTransform: 'uppercase' }}>{label}</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{valor}</p>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => onGuardar(resultat)}
                    style={{ width: '100%', padding: '0.8rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 14px 0 rgba(59,130,246,0.39)', marginBottom: '0.75rem' }}
                    onMouseOver={e => e.target.style.background = '#2563eb'}
                    onMouseOut={e => e.target.style.background = '#3b82f6'}
                >
                    Començar programa &rarr;
                </button>
                <button
                    onClick={reiniciar}
                    style={{ width: '100%', padding: '0.8rem', background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
                    onMouseOver={e => { e.target.style.background = '#e5e7eb'; e.target.style.color = '#111827' }}
                    onMouseOut={e => { e.target.style.background = '#f3f4f6'; e.target.style.color = '#4b5563' }}
                >
                    &#x21ba; Tornar a fer el test
                </button>
            </div>
        )
    }

    // ── Pantalla de preguntes ───────────────────────────────
    const step = TEST_STEPS[pas]

    return (
        <div style={{ marginTop: '1.5rem', background: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', position: 'relative' }}>
            <button
                onClick={onCancel}
                style={{ position: 'absolute', top: '1rem', right: '1.25rem', background: 'none', border: 'none', fontSize: '1.5rem', color: '#9ca3af', cursor: 'pointer', lineHeight: 1, padding: 0 }}
                onMouseOver={e => e.target.style.color = '#ef4444'}
                onMouseOut={e => e.target.style.color = '#9ca3af'}
                title="Sortir del test"
            >
                &times;
            </button>

            {/* Barra de progrés */}
            <p style={{ color: '#6b7280', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                Pas {pas + 1} de {TEST_STEPS.length}
            </p>
            <div style={{ background: '#e5e7eb', borderRadius: '999px', height: '6px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                <div style={{ background: '#3b82f6', width: `${(pas / TEST_STEPS.length) * 100}%`, height: '100%', borderRadius: '999px', transition: 'width 0.4s ease-in-out' }} />
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.85rem', lineHeight: 1.4 }}>
                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>❗</span>
                <p style={{ margin: 0 }}><strong>Atenció:</strong> Aquest pla és una aproximació, es recomana consultar a un fisioterapeuta per un diagnòstic precís.</p>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>{step.pregunta}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {step.tipus === 'text' ? (
                    <>
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Escriu aquí com et vas fer la lesió..."
                            style={{ padding: '0.8rem 1rem', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem', color: '#374151', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
                        />
                        <button
                            onClick={() => seleccionar(textInput)}
                            disabled={!textInput.trim()}
                            style={{ marginTop: '0.5rem', padding: '0.8rem 1rem', background: textInput.trim() ? '#3b82f6' : '#9ca3af', color: 'white', border: 'none', borderRadius: '8px', cursor: textInput.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.95rem' }}
                        >
                            Següent &rarr;
                        </button>
                    </>
                ) : (
                    step.opcions.map((opcio, idx) => (
                        <button
                            key={idx}
                            onClick={() => seleccionar(idx)}
                            style={{ padding: '0.8rem 1rem', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', color: '#374151', transition: 'all 0.2s', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
                            onMouseOver={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 4px 6px -1px rgba(59,130,246,0.1)' }}
                            onMouseOut={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = '0 1px 2px 0 rgba(0,0,0,0.05)' }}
                        >
                            {opcio}
                        </button>
                    ))
                )}
            </div>
        </div>
    )
}
