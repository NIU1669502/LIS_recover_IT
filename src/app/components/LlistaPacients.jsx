'use client'

import { useState, useEffect } from 'react'
import { getPacientsDeFisio, getProgresTotal } from '../utils/fisio'
import AfegirPacientModal from './AfegirPacientModal'
import styles from './LlistaPacients.module.css'

function TarjetaPacient({ pacient }) {
    const [progres, setProgres] = useState(null)

    useEffect(() => {
        if (pacient.diagnostic) {
            getProgresTotal(pacient.diagnostic).then(setProgres)
        }
    }, [pacient])

    const fase = pacient.diagnostic?.fase_actual
    const finalitzat = pacient.diagnostic?.finalitzat

    const badgeLabel = finalitzat
        ? 'Completat'
        : fase
            ? `Fase ${fase}`
            : 'Sense pla'

    const badgeClass = finalitzat
        ? styles.badgeComplet
        : fase
            ? styles.badgeFase
            : styles.badgeSensePla

    return (
        <div className={styles.tarjeta}>
            <div className={styles.tarjetaTop}>
                <div className={styles.avatar}>
                    {pacient.nom.charAt(0).toUpperCase()}
                </div>
                <span className={`${styles.badge} ${badgeClass}`}>{badgeLabel}</span>
            </div>

            <h3 className={styles.nom}>{pacient.nom}</h3>
            <p className={styles.dni}>DNI: {pacient.dni}</p>

            {pacient.diagnostic ? (
                <>
                    <p className={styles.lesio}>
                        {pacient.diagnostic.nom_lesio} · {pacient.diagnostic.nom_muscul}
                    </p>
                    {progres !== null && (
                        <div className={styles.progresBox}>
                            <div className={styles.progresCapçalera}>
                                <span className={styles.progresText}>Progrés</span>
                                <span className={styles.progresNum}>{progres}%</span>
                            </div>
                            <div className={styles.progresBarBg}>
                                <div
                                    className={styles.progresBarFill}
                                    style={{ width: `${progres}%` }}
                                />
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <p className={styles.senseDiag}>Sense diagnòstic assignat</p>
            )}
        </div>
    )
}

export default function LlistaPacients({ perfilUsuari }) {
    const [pacients, setPacients] = useState([])
    const [carregant, setCarregant] = useState(true)
    const [modalObert, setModalObert] = useState(false)
    const [cerca, setCerca] = useState('')

    const carregarPacients = async () => {
        if (!perfilUsuari?.dni) return
        setCarregant(true)
        const llista = await getPacientsDeFisio(perfilUsuari.dni)
        setPacients(llista)
        setCarregant(false)
    }

    useEffect(() => {
        carregarPacients()
    }, [perfilUsuari])

    const pacientsFiltrats = pacients.filter(p =>
        p.nom.toLowerCase().includes(cerca.toLowerCase()) ||
        p.dni.toLowerCase().includes(cerca.toLowerCase())
    )

    return (
        <div className={styles.contenidor}>
            <div className={styles.topBar}>
                <div>
                    <h1 className={styles.titol}>Pacients</h1>
                    <p className={styles.subtitol}>{pacients.length} pacients vinculats</p>
                </div>
                <button className={styles.afegirBtn} onClick={() => setModalObert(true)}>
                    <span>+</span> Afegir pacient
                </button>
            </div>

            <div className={styles.cercaBox}>
                <span className={styles.cercaIcon}>🔍</span>
                <input
                    className={styles.cercaInput}
                    type="text"
                    placeholder="Cercar per nom o DNI..."
                    value={cerca}
                    onChange={e => setCerca(e.target.value)}
                />
            </div>

            {carregant ? (
                <div className={styles.carregant}>
                    <div className={styles.spinner} />
                </div>
            ) : pacientsFiltrats.length === 0 ? (
                <div className={styles.buit}>
                    {cerca
                        ? <p>No s'ha trobat cap pacient amb "{cerca}".</p>
                        : <>
                            <p>Encara no tens cap pacient vinculat.</p>
                            <button
                                className={styles.afegirBtnSecundari}
                                onClick={() => setModalObert(true)}
                            >
                                Afegir el primer pacient
                            </button>
                        </>
                    }
                </div>
            ) : (
                <div className={styles.grid}>
                    {pacientsFiltrats.map(p => (
                        <TarjetaPacient key={p.dni} pacient={p} />
                    ))}
                </div>
            )}

            {modalObert && (
                <AfegirPacientModal
                    dniFisio={perfilUsuari.dni}
                    onTancar={() => setModalObert(false)}
                    onPacientAfegit={carregarPacients}
                />
            )}
        </div>
    )
}
