'use client'

import styles from './Sidebar.module.css'

const seccions = [
    { id: 'inici', label: 'Inici' },
    { id: 'exercicis-en-curs', label: 'Exercicis en curs' },
    { id: 'perfil', label: 'El meu perfil' },
    { id: 'historial', label: 'Historial de sessions' },
]

export default function Sidebar({ vistaActual, onNavegar, onTancarSessio }) {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <span className={styles.logoText}>
                    Recover<span className={styles.logoAccent}>IT</span>
                </span>
            </div>

            <nav className={styles.nav}>
                {seccions.map(({ id, label }) => (
                    <button
                        key={id}
                        onClick={() => onNavegar(id)}
                        className={`${styles.navItem} ${vistaActual === id ? styles.navItemActive : ''}`}
                    >
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