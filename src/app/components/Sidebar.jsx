'use client'

import styles from './Sidebar.module.css'
import { useHistorial } from '../hooks/useHistorial'

const seccionsPackient = [
    { id: 'inici', label: 'Inici' },
    { id: 'progres', label: 'Progrés i Historial' },
    { id: 'exercicis-en-curs', label: 'Exercicis en curs' },
    { id: 'perfil', label: 'El meu perfil' },
    { id: 'historial', label: 'Historial de sessions' },
]

const secciosFisio = [
    { id: 'inici-fisio', label: 'Inici' },
    { id: 'pacients', label: 'Pacients' },
    { id: 'perfil', label: 'Perfil' },
]

export default function Sidebar({ vistaActual, onNavegar, onTancarSessio, esFisio, perfilUsuari }) {
    const seccions = esFisio ? secciosFisio : seccionsPackient
    
    // Obtenir racha només si és pacient
    const dni = !esFisio ? perfilUsuari?.dni : null;
    const { racha } = useHistorial(dni);

    return (
        <aside className={styles.sidebar}>
            <div className={styles.headerContainer}>
                <div className={styles.logo}>
                    <span className={styles.logoText}>
                        Recover<span className={styles.logoAccent}>IT</span>
                    </span>
                </div>
                {!esFisio && racha > 1 && (
                    <div className={styles.rachaBadge} title={`${racha} dies seguits completant sessions`}>
                        <span className={styles.rachaIcon}>🔥</span>
                        <span className={styles.rachaNum}>{racha}</span>
                    </div>
                )}
            </div>

            <nav className={styles.nav}>
                {seccions.map(({ id, label, icon }) => (
                    <button
                        key={id}
                        onClick={() => onNavegar(id)}
                        className={`${styles.navItem} ${vistaActual === id ? styles.navItemActive : ''}`}
                    >
                        <span className={styles.navIcon}>{icon}</span>
                        <span className={styles.navLabel}>{label}</span>
                        {vistaActual === id && <span className={styles.activeIndicator} />}
                    </button>
                ))}
            </nav>

            <div className={styles.footer}>
                <button onClick={onTancarSessio} className={styles.logoutButton}>
                    <span className={styles.navLabel}>Tancar sessió</span>
                </button>
            </div>
        </aside>
    )
}
