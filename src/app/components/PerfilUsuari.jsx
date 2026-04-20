'use client'

import styles from './perfilUsuari.module.css'

export default function PerfilUsuari({ perfilUsuari, onEditarPerfil }) {
    return (
        <section>
            <h2 className={styles.title}>El meu perfil</h2>

            {!perfilUsuari && (
                <p className={styles.textMuted}>
                    No s'han trobat dades del perfil.
                </p>
            )}

            {perfilUsuari && (
                <>
                    <p className={styles.text}>
                        <strong>Nom:</strong> {perfilUsuari.nom}
                    </p>

                    <p className={styles.text}>
                        <strong>DNI:</strong> {perfilUsuari.dni}
                    </p>

                    <p className={styles.text}>
                        <strong>Punts:</strong> {perfilUsuari.punts}
                    </p>

                    <p className={styles.text}>
                        <strong>Rol:</strong>{' '}
                        {perfilUsuari.es_fisioterapeuta ? 'Fisioterapeuta' : 'Pacient'}
                    </p>

                    <button
                        onClick={onEditarPerfil}
                        className={styles.editButton}
                    >
                        Editar nom
                    </button>
                </>
            )}
        </section>
    )
}