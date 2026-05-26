'use client'

import XatConversa from './XatConversa'
import styles from './xat.module.css'

export default function XatPacient({ perfilUsuari, relacio, carregantRelacio }) {
    if (carregantRelacio) {
        return (
            <section className={styles.container}>
                <p className={styles.muted}>Carregant xat...</p>
            </section>
        )
    }

    if (!relacio) {
        return (
            <section className={styles.container}>
                <h2 className={styles.title}>Xat</h2>
                <p className={styles.muted}>
                    Per utilitzar el xat has d&apos;estar vinculat amb un fisioterapeuta.
                    Confirma el codi al teu perfil quan el tinguis.
                </p>
            </section>
        )
    }

    return (
        <section className={styles.container}>
            <h2 className={styles.title}>Xat</h2>
            <p className={styles.subtitle}>
                Conversa en directe amb {relacio.nomFisio}
            </p>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <XatConversa
                    dniFisio={relacio.dni_fisio}
                    dniPacient={relacio.dni_pacient}
                    dniUsuari={perfilUsuari.dni}
                    titolConversa={relacio.nomFisio}
                />
            </div>
        </section>
    )
}
