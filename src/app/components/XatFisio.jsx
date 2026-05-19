'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { getConversesFisio } from '../utils/xat'
import XatConversa from './XatConversa'
import styles from './xat.module.css'

function previewText(missatge, dniFisio) {
    if (!missatge) return 'Sense missatges encara'
    const prefix = missatge.remitent_dni === dniFisio ? 'Tu: ' : ''
    const txt = missatge.contingut || ''
    return prefix + (txt.length > 48 ? `${txt.slice(0, 48)}…` : txt)
}

// ============================================================
// Xat del fisioterapeuta: totes les converses amb pacients
// ============================================================
export default function XatFisio({ perfilUsuari }) {
    const [converses, setConverses] = useState([])
    const [carregant, setCarregant] = useState(true)
    const [pacientSeleccionat, setPacientSeleccionat] = useState(null)
    const canalRef = useRef(null)

    const dniFisio = perfilUsuari?.dni

    const carregarConverses = async () => {
        if (!dniFisio) return
        setCarregant(true)
        const llista = await getConversesFisio(dniFisio)
        setConverses(llista)
        setCarregant(false)

    }

    useEffect(() => {
        carregarConverses()

        if (!dniFisio) return

        canalRef.current = supabase
            .channel(`xat-fisio-llista-${dniFisio}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'missatges_xat', filter: `dni_fisio=eq.${dniFisio}` },
                () => carregarConverses()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'relacio_fisio_pacient', filter: `dni_fisio=eq.${dniFisio}` },
                () => carregarConverses()
            )
            .subscribe()

        return () => {
            if (canalRef.current) supabase.removeChannel(canalRef.current)
        }
    }, [dniFisio])

    useEffect(() => {
        if (converses.length === 0) {
            setPacientSeleccionat(null)
            return
        }
        if (!pacientSeleccionat || !converses.some(c => c.dni_pacient === pacientSeleccionat)) {
            setPacientSeleccionat(converses[0].dni_pacient)
        }
    }, [converses, pacientSeleccionat])

    const conversaActiva = converses.find(c => c.dni_pacient === pacientSeleccionat)

    return (
        <section className={styles.container}>
            <h2 className={styles.title}>Xat amb pacients</h2>
            <p className={styles.subtitle}>
                Converses en directe amb els teus pacients vinculats
            </p>

            {carregant ? (
                <p className={styles.muted}>Carregant converses...</p>
            ) : converses.length === 0 ? (
                <p className={styles.muted}>
                    Encara no tens cap pacient vinculat amb el xat actiu.
                    Afegeix un pacient i espera que confirmi el codi.
                </p>
            ) : (
                <div className={styles.fisioLayout}>
                    <div className={styles.llistaPanel}>
                        <div className={styles.llistaHeader}>Pacients</div>
                        <div className={styles.llistaScroll}>
                            {converses.map(c => (
                                <button
                                    key={c.dni_pacient}
                                    type="button"
                                    className={`${styles.conversaItem} ${pacientSeleccionat === c.dni_pacient ? styles.conversaItemActiva : ''}`}
                                    onClick={() => setPacientSeleccionat(c.dni_pacient)}
                                >
                                    <span className={styles.conversaNom}>{c.nom}</span>
                                    <span className={styles.conversaPreview}>
                                        {previewText(c.ultimMissatge, dniFisio)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.chatPanel}>
                        {conversaActiva ? (
                            <XatConversa
                                dniFisio={dniFisio}
                                dniPacient={conversaActiva.dni_pacient}
                                dniUsuari={dniFisio}
                                titolConversa={conversaActiva.nom}
                                actiu={!!pacientSeleccionat}
                            />
                        ) : (
                            <div className={styles.chatPlaceholder}>
                                Selecciona un pacient per obrir la conversa
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    )
}
