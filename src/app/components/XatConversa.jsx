'use client'

import { useState, useEffect, useRef } from 'react'
import { useXat } from '../hooks/useXat'
import { MAX_MISSATGE_XAT } from '../utils/xat'
import styles from './xat.module.css'

function formatHora(iso) {
    try {
        return new Date(iso).toLocaleTimeString('ca-ES', {
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch {
        return ''
    }
}

export default function XatConversa({
    dniFisio,
    dniPacient,
    dniUsuari,
    titolConversa,
    actiu = true,
}) {
    const [text, setText] = useState('')
    const [errorEnviament, setErrorEnviament] = useState(null)
    const fiRef = useRef(null)

    const { missatges, carregant, error, enviant, enviar } = useXat({
        dniFisio,
        dniPacient,
        dniUsuari,
        actiu,
    })

    useEffect(() => {
        fiRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [missatges])

    const handleEnviar = async (e) => {
        e.preventDefault()
        setErrorEnviament(null)
        const res = await enviar(text)
        if (!res.ok) {
            setErrorEnviament(res.missatge)
            return
        }
        setText('')
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (!enviant && text.trim()) {
                handleEnviar(e)
            }
        }
    }

    return (
        <div className={styles.chatBox}>
            {titolConversa && (
                <div className={styles.chatHeader}>{titolConversa}</div>
            )}

            {error && <p className={styles.error}>{error}</p>}
            {errorEnviament && <p className={styles.error}>{errorEnviament}</p>}

            <div className={styles.missatgesArea}>
                {carregant && <p className={styles.muted}>Carregant missatges...</p>}
                {!carregant && missatges.length === 0 && (
                    <p className={styles.muted}>Encara no hi ha missatges. Escriu el primer.</p>
                )}
                {missatges.map(m => {
                    const esPropi = m.remitent_dni === dniUsuari
                    return (
                        <div
                            key={m.id_missatge}
                            className={`${styles.bombolla} ${esPropi ? styles.bombollaPropi : styles.bombollaAltre}`}
                        >
                            {m.contingut}
                            <span className={styles.hora}>{formatHora(m.enviat_en)}</span>
                        </div>
                    )
                })}
                <div ref={fiRef} />
            </div>

            <form className={styles.inputRow} onSubmit={handleEnviar}>
                <textarea
                    className={styles.input}
                    rows={1}
                    placeholder="Escriu un missatge..."
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, MAX_MISSATGE_XAT))}
                    onKeyDown={handleKeyDown}
                    disabled={enviant}
                    maxLength={MAX_MISSATGE_XAT}
                />
                <button
                    type="submit"
                    className={styles.enviarBtn}
                    disabled={enviant || !text.trim()}
                >
                    Enviar
                </button>
            </form>
        </div>
    )
}
