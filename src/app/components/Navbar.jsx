'use client'

import styles from './navbar.module.css'

// ============================================================
// Component: Navbar
// ============================================================

export default function Navbar({ vistaActual, usuariSessio, onTornar, onTancarSessio, onNavegar }) {
    return (
        <nav className={styles.navbar}>

            <span
                onClick={() => onNavegar('inici')}
                className={styles.logo}
            >
                Recover<span className={styles.logoAccent}>IT</span>
            </span>

            <div className={styles.rightSection}>

                {vistaActual !== 'inici' && (
                    <button
                        onClick={onTornar}
                        className={styles.backButton}
                    >
                        <span className={styles.backIcon}></span>
                        Tornar
                    </button>
                )}

                {usuariSessio && (
                    <button
                        onClick={onTancarSessio}
                        className={styles.logoutButton}
                    >
                        Tancar sessió
                    </button>
                )}

            </div>

        </nav>
    )
}
