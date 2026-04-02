'use client'

// ============================================================
// Component: PerfilUsuari — RF-AUTH-09 / RF-AUTH-10
// ============================================================
export default function PerfilUsuari({ perfilUsuari, onEditarPerfil }) {
    return (
        <section>
            <h2>El meu perfil</h2>
            {!perfilUsuari && <p style={{ color: '#4b5063' }}>No s'han trobat dades del perfil.</p>}
            {perfilUsuari && (
                <>
                    <p style={{ color: '#111827' }}><strong>Nom:</strong> {perfilUsuari.nom}</p>
                    <p style={{ color: '#111827' }}><strong>DNI:</strong> {perfilUsuari.dni}</p>
                    <p style={{ color: '#111827' }}><strong>Punts:</strong> {perfilUsuari.punts}</p>
                    <p style={{ color: '#111827' }}><strong>Rol:</strong> {perfilUsuari.es_fisioterapeuta ? 'Fisioterapeuta' : 'Pacient'}</p>
                    <button
                        onClick={onEditarPerfil}
                        style={{ padding: '0.55rem 1rem', background: '#ffffff', border: '1px solid #d1d5db', color: '#374151', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Editar nom
                    </button>
                </>
            )}
        </section>
    )
}
