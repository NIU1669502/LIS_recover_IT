'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { getEstadistiquesFisio, getProgresTotal } from '../utils/fisio'
import AfegirPacientModal from './AfegirPacientModal'
import styles from './PanellFisio.module.css'


// Panell principal del fisioterapeuta:
//   - Targetes d'estadístiques (actius, en recuperació, finalitzats, pendents)
//   - Llistat dels 5 pacients més recents amb progrés
//   - Accés ràpid a afegir un nou pacient
//   - Actualització en temps real via Supabase Realtime


function TarjetaEstat({ icon, valor, label, color }) {
    return (
        <div className={styles.statCard}>
            <div className={styles.statIconBox} style={{ background: color + '18' }}>
                <span className={styles.statIcon} style={{ color }}>{icon}</span>
            </div>
            <span className={styles.statValor}>{valor}</span>
            <span className={styles.statLabel}>{label}</span>
        </div>
    )
}

function FilaPacient({ pacient, onVeurePacient }) {
    const [progres, setProgres] = useState(null)

    useEffect(() => {
        if (pacient.diagnostic) {
            getProgresTotal(pacient.diagnostic).then(setProgres)
        }
    }, [pacient])

    const nomLesio = pacient.diagnostic?.nom_lesio || null

    return (
        <div className={styles.pacientFila}>
            <div className={styles.pacientInfo}>
                <div className={styles.pacientAvatar}>
                    {pacient.nom.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className={styles.pacientNom}>{pacient.nom}</p>
                    <p className={styles.pacientLesio}>
                        {!pacient.confirmat
                            ? 'En espera de confirmació'
                            : nomLesio
                                ? `${nomLesio} · ${pacient.diagnostic?.nom_muscul || ''}`
                                : 'Sense diagnòstic'}
                    </p>
                </div>
            </div>

            {progres !== null && pacient.confirmat && (
                <div className={styles.progresBox}>
                    <span className={styles.progresNum}>{progres}%</span>
                    <div className={styles.progresBarBg}>
                        <div
                            className={styles.progresBarFill}
                            style={{ width: `${progres}%` }}
                        />
                    </div>
                </div>
            )}

            <button
                className={styles.configurarBtn}
                onClick={() => onVeurePacient(pacient)}
            >
                Veure detalls
            </button>
        </div>
    )
}

export default function PanellFisio({ perfilUsuari, onNavegar }) {
    const [estadistiques, setEstadistiques] = useState(null)
    const [carregant, setCarregant] = useState(true)
    const [modalObert, setModalObert] = useState(false)

    const canalRef = useRef(null)

    const carregarDades = async () => {
        if (!perfilUsuari?.dni) return
        setCarregant(true)
        const stats = await getEstadistiquesFisio(perfilUsuari.dni)
        setEstadistiques(stats)
        setCarregant(false)
    }

    useEffect(() => {
        carregarDades()

        if (perfilUsuari?.dni) {
            canalRef.current = supabase
                .channel(`panell-fisio-${perfilUsuari.dni}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'relacio_fisio_pacient', filter: `dni_fisio=eq.${perfilUsuari.dni}` }, carregarDades)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'diagnostic' }, carregarDades)
                .subscribe()
        }

        return () => {
            if (canalRef.current) supabase.removeChannel(canalRef.current)
        }
    }, [perfilUsuari])

    const pacientsMostrats = estadistiques?.pacients?.slice(0, 5) || []

    return (
        <div className={styles.panell}>
            <div className={styles.topBar}>
                <h1 className={styles.titol}>Panell del fisioterapeuta</h1>
                <button className={styles.afegirBtn} onClick={() => setModalObert(true)}>
                    <span className={styles.afegirPlus}>+</span> Afegir pacient
                </button>
            </div>

            {carregant ? (
                <div className={styles.carregant}>
                    <div className={styles.spinner} />
                </div>
            ) : (
                <>

                    <div className={`${styles.statsGrid} ${styles.statsGrid4}`}>
                        <TarjetaEstat
                            icon="👥"
                            valor={estadistiques?.actius ?? 0}
                            label="Pacients actius"
                            color="#2563eb"
                        />
                        <TarjetaEstat
                            icon="📈"
                            valor={estadistiques?.enRecuperacio ?? 0}
                            label="Pacients en recuperació"
                            color="#f97316"
                        />
                        <TarjetaEstat
                            icon="✅"
                            valor={estadistiques?.finalitzats ?? 0}
                            label="Pacients finalitzats"
                            color="#16a34a"
                        />

                        <TarjetaEstat
                            icon="⏳"
                            valor={estadistiques?.pendents ?? 0}
                            label="En espera de confirmació"
                            color="#f59e0b"
                        />
                    </div>

                    <div className={styles.seccio}>
                        <div className={styles.seccioHeader}>
                            <h2 className={styles.seccioTitol}>Pacients recents</h2>
                            {estadistiques?.pacients?.length > 5 && (
                                <button
                                    className={styles.veureTots}
                                    onClick={() => onNavegar('pacients')}
                                >
                                    Veure tots
                                </button>
                            )}
                        </div>

                        {pacientsMostrats.length === 0 ? (
                            <div className={styles.buit}>
                                <p>Encara no tens cap pacient vinculat.</p>
                                <button
                                    className={styles.afegirBtnSecundari}
                                    onClick={() => setModalObert(true)}
                                >
                                    Afegir el primer pacient
                                </button>
                            </div>
                        ) : (
                            <div className={styles.pacientsList}>
                                {pacientsMostrats.map(p => (
                                    <FilaPacient
                                        key={p.dni}
                                        pacient={p}
                                        onVeurePacient={() => onNavegar('pacients')}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {modalObert && (
                <AfegirPacientModal
                    dniFisio={perfilUsuari.dni}
                    onTancar={() => setModalObert(false)}
                    onPacientAfegit={carregarDades}
                />
            )}
        </div>
    )
}
