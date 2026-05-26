'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './toastContainer.module.css'


// Component: ToastContainer
// Sistema de notificacions emergents (toasts) global:
//   - Escolta l'event 'app-toast' del window
//   - Mostra notificacions de tipus success, error, warning i info
//   - Es tanquen automàticament als 5 segons o manualment
//   - Animació d'entrada i sortida


const ICONS = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: '💡',
}

let toastCounter = 0

export default function ToastContainer() {
    const [toasts, setToasts] = useState([])

    const removeToast = useCallback((id) => {
        setToasts(prev =>
            prev.map(t => t.id === id ? { ...t, leaving: true } : t)
        )

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 300)
    }, [])

    useEffect(() => {
        const handler = (e) => {
            const { message, type = 'info' } = e.detail
            const id = ++toastCounter

            setToasts(prev => [...prev, { id, message, type, leaving: false }])

            setTimeout(() => removeToast(id), 5000)
        }

        window.addEventListener('app-toast', handler)
        return () => window.removeEventListener('app-toast', handler)
    }, [removeToast])

    if (!toasts.length) return null

    return (
        <div className={styles.container}>
            {toasts.map(t => (
                <div
                    key={t.id}
                    className={`${styles.toast} ${styles[t.type]} ${t.leaving ? styles.leaving : ''}`}
                >
                    <span className={styles.icon}>{ICONS[t.type]}</span>

                    <span className={styles.message}>
                        {t.message}
                    </span>

                    <button
                        className={styles.close}
                        onClick={() => removeToast(t.id)}
                    >
                        ✕
                    </button>

                    <div className={styles.progress} />
                </div>
            ))}
        </div>
    )
}
