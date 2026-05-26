'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { getPacientsDeFisio, getProgresTotal } from '../utils/fisio'
import { desassignarFisio } from '../utils/diagFisio'
import AfegirPacientModal from './AfegirPacientModal'
import DetallsPacientModal from './DetallsPacientModal'
import styles from './LlistaPacients.module.css'

// ============================================================
// Component: LlistaPacients — RF-FISIO-02, RF-FISIO-03, RF-FISIO-04
// Llistat complet de pacients del fisioterapeuta:
//   - Filtres per fase (1, 2, 3), estat (completat, pendent, sense pla)
//   - Buscador per nom o DNI
//   - Targeta per pacient amb progrés, lesió i accions
//   - Veure detalls, afegir diagnòstic, desvincular
//   - Actualització en temps real via Supabase Realtime
// ============================================================

const FILTRES = [
    { key: 'tots', label: 'Tots' },
    { key: 'fase1', label: 'Fase 1' },
    { key: 'fase2', label: 'Fase 2' },
    { key: 'fase3', label: 'Fase 3' },
    { key: 'completat', label: 'Completat' },
    { key: 'sensepla', label: 'Sense pla' },
    { key: 'pendent', label: 'Pendent' },
]

function coincideixFiltro(pacient, filtre) {
    if (filtre === 'tots') return true
    if (filtre === 'pendent') return pacient.confirmat === false
    if (filtre === 'completat') return pacient.diagnostic?.finalitzat === true
    if (filtre === 'sensepla') return !pacient.diagnostic
    if (filtre === 'fase1') return pacient.diagnostic?.fase_actual === 1 && !pacient.diagnostic?.finalitzat
    if (filtre === 'fase2') return pacient.diagnostic?.fase_actual === 2 && !pacient.diagnostic?.finalitzat
    if (filtre === 'fase3') return pacient.diagnostic?.fase_actual === 3 && !pacient.diagnostic?.finalitzat
    return true
}

function TarjetaPacient({ pacient, onCanvi, onAfegirDiagnostic, dniFisio }) {
    const [progres, setProgres] = useState(null)
    const [confirmantDesassignar, setConfirmantDesassignar] = useState(false)
    const [desassignant, setDesassignant] = useState(false)
    const [mostrarDetalls, setMostrarDetalls] = useState(false)

    const handleDesassignar = async () => {
        if (!confirmantDesassignar) { setConfirmantDesassignar(true); return }
        setDesassignant(true)
        const res = await desassignarFisio(pacient.dni)
        setDesassignant(false)
        setConfirmantDesassignar(false)
        if (res.ok) { if (onCanvi) onCanvi() }
        else alert(res.missatge || 'Error en desassignar el pacient')
    }

    useEffect(() => {
        if (pacient.diagnostic) getProgresTotal(pacient.diagnostic).then(setProgres)
    }, [pacient])

    const esPendent = pacient.confirmat === false
    const fase = pacient.diagnostic?.fase_actual
    const finalitzat = pacient.diagnostic?.finalitzat

    const badgeLabel = esPendent ? 'Pla en confirmació' : finalitzat ? 'Completat' : fase ? `Fase ${fase}` : 'Sense pla'
    const badgeClass = esPendent ? styles.badgePendent : finalitzat ? styles.badgeComplet : fase ? styles.badgeFase : styles.badgeSensePla

    return (
        <div className={styles.tarjeta}>
            <div className={styles.tarjetaTop}>
                <div className={styles.avatar}>{pacient.nom.charAt(0).toUpperCase()}</div>
                <span className={`${styles.badge} ${badgeClass}`}>{badgeLabel}</span>
            </div>

            <h3 className={styles.nom}>{pacient.nom}</h3>
            <p className={styles.dni}>DNI: {pacient.dni}</p>

            {esPendent ? (
                <div>
                    {pacient.diagnosticPendent && (
                        <p className={styles.lesio}>{pacient.diagnosticPendent.nom_lesio} · {pacient.diagnosticPendent.nom_muscul}</p>
                    )}
                    <p className={styles.pendentText}>El pacient encara no ha confirmat l&apos;assignació</p>
                    {pacient.codi_validacio && (
                        <p className={styles.codiValidacio}>Codi: <strong>{pacient.codi_validacio}</strong></p>
                    )}
                    <button onClick={() => setMostrarDetalls(true)} className={styles.veureDetallsBtn}>Veure detalls pacient</button>
                    <button onClick={() => desassignarFisio(pacient.dni)} className={styles.cancelarPendentBtn}>Cancel·lar assignació</button>
                </div>
            ) : (
                <>
                    {pacient.diagnostic ? (
                        <>
                            <p className={styles.lesio}>{pacient.diagnostic.nom_lesio} · {pacient.diagnostic.nom_muscul}</p>
                            {progres !== null && (
                                <div className={styles.progresBox}>
                                    <div className={styles.progresCapçalera}>
                                        <span className={styles.progresText}>Progrés</span>
                                        <span className={styles.progresNum}>{progres}%</span>
                                    </div>
                                    <div className={styles.progresBarBg}>
                                        <div className={styles.progresBarFill} style={{ width: `${progres}%` }} />
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className={styles.senseDiag}>Sense diagnòstic assignat</p>
                    )}

                    <button onClick={() => setMostrarDetalls(true)} className={styles.veureDetallsBtn}>Veure detalls pacient</button>
                    <button onClick={() => onAfegirDiagnostic(pacient.dni, pacient.nom)} className={styles.afegirPlaBtn}>Afegir un nou diagnòstic</button>

                    {!confirmantDesassignar ? (
                        <button onClick={handleDesassignar} className={styles.desvincularBtn}>Desvincular</button>
                    ) : (
                        <div className={styles.confirmInlineRow}>
                            <span className={styles.confirmText}>Segur? Deixarà de fer-lo seguiment.</span>
                            <button onClick={handleDesassignar} disabled={desassignant} className={styles.desvincularBtnActiu}>
                                {desassignant ? '...' : 'Sí'}
                            </button>
                            <button onClick={() => setConfirmantDesassignar(false)} className={styles.cancelInlineButton}>✕</button>
                        </div>
                    )}
                </>
            )}

            {mostrarDetalls && (
                <DetallsPacientModal
                    dniPacient={pacient.dni}
                    nomPacient={pacient.nom}
                    dniFisio={dniFisio}
                    onTancar={() => setMostrarDetalls(false)}
                />
            )}
        </div>
    )
}

export default function LlistaPacients({ perfilUsuari }) {
    const [infoPacientModal, setInfoPacientModal] = useState({ dniPacient: '', nomPacient: '' })
    const [pacients, setPacients] = useState([])
    const [carregant, setCarregant] = useState(true)
    const [modalObert, setModalObert] = useState(false)
    const [cerca, setCerca] = useState('')
    const [filtreActiu, setFiltreActiu] = useState('tots')
    const canalRef = useRef(null)

    const carregarPacients = async () => {
        if (!perfilUsuari?.dni) return
        setCarregant(true)
        const llista = await getPacientsDeFisio(perfilUsuari.dni)
        setPacients(llista)
        setCarregant(false)
    }

    useEffect(() => {
        carregarPacients()
        if (perfilUsuari?.dni) {
            canalRef.current = supabase
                .channel(`llista-pacients-${perfilUsuari.dni}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'relacio_fisio_pacient', filter: `dni_fisio=eq.${perfilUsuari.dni}` }, carregarPacients)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'diagnostic' }, carregarPacients)
                .subscribe()
        }
        return () => { if (canalRef.current) supabase.removeChannel(canalRef.current) }
    }, [perfilUsuari?.dni])

    const pacientsFiltrats = pacients.filter(p => {
        const coincideixCerca = p.nom.toLowerCase().includes(cerca.toLowerCase()) || p.dni.toLowerCase().includes(cerca.toLowerCase())
        return coincideixCerca && coincideixFiltro(p, filtreActiu)
    })

    const comptadors = {}
    FILTRES.forEach(f => {
        comptadors[f.key] = f.key === 'tots' ? pacients.length : pacients.filter(p => coincideixFiltro(p, f.key)).length
    })

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

            {/* Filtres per fase */}
            <div className={styles.filtresContainer}>
                {FILTRES.map(f => (
                    comptadors[f.key] > 0 || f.key === 'tots' ? (
                        <button
                            key={f.key}
                            className={`${styles.filtreBtn} ${filtreActiu === f.key ? styles.filtreBtnActiu : ''}`}
                            onClick={() => setFiltreActiu(f.key)}
                        >
                            {f.label}
                            <span className={`${styles.filtreBadge} ${filtreActiu === f.key ? styles.filtreBadgeActiu : ''}`}>
                                {comptadors[f.key]}
                            </span>
                        </button>
                    ) : null
                ))}
            </div>

            {carregant ? (
                <div className={styles.carregant}><div className={styles.spinner} /></div>
            ) : pacientsFiltrats.length === 0 ? (
                <div className={styles.buit}>
                    {cerca || filtreActiu !== 'tots'
                        ? <p>No s&apos;ha trobat cap pacient amb els filtres actuals.</p>
                        : <>
                            <p>Encara no tens cap pacient vinculat.</p>
                            <button className={styles.afegirBtnSecundari} onClick={() => setModalObert(true)}>
                                Afegir el primer pacient
                            </button>
                        </>
                    }
                </div>
            ) : (
                <div className={styles.grid}>
                    {pacientsFiltrats.map(p => (
                        <TarjetaPacient
                            key={p.dni}
                            pacient={p}
                            onCanvi={carregarPacients}
                            onAfegirDiagnostic={(dni, nom) => setInfoPacientModal({ dniPacient: dni, nomPacient: nom })}
                            dniFisio={perfilUsuari.dni}
                        />
                    ))}
                </div>
            )}

            {(modalObert || infoPacientModal.dniPacient) && (
                <AfegirPacientModal
                    dniFisio={perfilUsuari.dni}
                    infoPacientInicial={infoPacientModal}
                    onTancar={() => { setModalObert(false); setInfoPacientModal({ dniPacient: '', nomPacient: '' }) }}
                    onPacientAfegit={carregarPacients}
                />
            )}
        </div>
    )
}