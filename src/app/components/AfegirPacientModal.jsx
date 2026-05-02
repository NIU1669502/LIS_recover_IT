'use client'

import { useState } from 'react'
import { vincularPacient } from '../utils/fisio'
import { showToast } from '../utils/toast'
import styles from './AfegirPacientModal.module.css'

export default function AfegirPacientModal({ dniFisio, onTancar, onPacientAfegit }) {
    const [dni, setDni] = useState('')
    const [carregant, setCarregant] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async () => {
        if (!dni.trim()) {
            setError('Introdueix el DNI del pacient.')
            return
        }
        setError('')
        setCarregant(true)
        try {
            const resultat = await vincularPacient(dniFisio, dni)
            if (!resultat.ok) {
                setError(resultat.missatge)
            } else {
                showToast(`Pacient ${resultat.nomPacient} afegit correctament!`, 'success')
                onPacientAfegit()
                onTancar()
            }
        } finally {
            setCarregant(false)
        }
    }

    return (
        <div className={styles.overlay} onClick={onTancar}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Afegir pacient</h2>
                    <button className={styles.closeBtn} onClick={onTancar}>✕</button>
                </div>

                <p className={styles.desc}>
                    Introdueix el DNI del pacient per vincular-lo al teu compte.
                </p>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>DNI del pacient</label>
                    <input
                        className={styles.input}
                        type="text"
                        placeholder="Ex: 12345678A"
                        value={dni}
                        onChange={e => setDni(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        autoFocus
                    />
                    {error && <p className={styles.error}>{error}</p>}
                </div>

                <div className={styles.actions}>
                    <button className={styles.cancelBtn} onClick={onTancar} disabled={carregant}>
                        Cancel·lar
                    </button>
                    <button className={styles.confirmBtn} onClick={handleSubmit} disabled={carregant}>
                        {carregant ? 'Verificant...' : 'Afegir pacient'}
                    </button>
                </div>
            </div>
        </div>
    )
}
