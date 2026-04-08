'use client'

import { useState } from 'react'

// ============================================================
// Component: PerfilUsuari — RF-AUTH-09 / RF-AUTH-10
// ============================================================
export default function PerfilUsuari({ perfilUsuari, onEditarPerfil }) {
    const [editant, setEditant] = useState(false)
    const [nouNom, setNouNom] = useState('')

    const iniciarEdicio = () => {
        setNouNom(perfilUsuari?.nom || '')
        setEditant(true)
    }

    const cancellarEdicio = () => {
        setEditant(false)
        setNouNom('')
    }

    const guardarNom = async () => {
        if (!nouNom.trim()) return
        await onEditarPerfil(nouNom)
        setEditant(false)
        setNouNom('')
    }

    return (
        <section style={{ maxWidth: '480px', margin: '2rem auto', padding: '0 1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '1.5rem' }}>
                El meu perfil
            </h2>

            {!perfilUsuari && (
                <p style={{ color: '#6b7280' }}>No s'han trobat dades del perfil.</p>
            )}

            {perfilUsuari && (
                <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>

                    {/* Nom */}
                    <div style={{ marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nom</span>
                        {editant ? (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    value={nouNom}
                                    onChange={(e) => setNouNom(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') guardarNom(); if (e.key === 'Escape') cancellarEdicio() }}
                                    autoFocus
                                    style={{
                                        flex: 1, padding: '0.55rem 0.85rem', borderRadius: '8px',
                                        border: '2px solid #3b82f6', background: '#f0f7ff',
                                        fontSize: '0.95rem', color: '#111827', outline: 'none',
                                        boxShadow: '0 0 0 3px rgba(59,130,246,0.12)',
                                    }}
                                />
                                <button
                                    onClick={guardarNom}
                                    style={{ padding: '0.55rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}
                                >
                                    Guardar
                                </button>
                                <button
                                    onClick={cancellarEdicio}
                                    style={{ padding: '0.55rem 0.8rem', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                                <p style={{ margin: 0, fontSize: '1rem', color: '#111827', fontWeight: 600 }}>{perfilUsuari.nom}</p>
                                <button
                                    onClick={iniciarEdicio}
                                    style={{ padding: '0.3rem 0.7rem', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                >
                                    ✏️ Editar
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ height: '1px', background: '#f3f4f6', margin: '1rem 0' }} />

                    {/* DNI */}
                    <div style={{ marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DNI</span>
                        <p style={{ margin: '0.4rem 0 0', fontSize: '1rem', color: '#111827', fontWeight: 600 }}>{perfilUsuari.dni}</p>
                    </div>

                    <div style={{ height: '1px', background: '#f3f4f6', margin: '1rem 0' }} />

                    {/* Punts */}
                    <div style={{ marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Punts</span>
                        <p style={{ margin: '0.4rem 0 0', fontSize: '1rem', color: '#111827', fontWeight: 600 }}>{perfilUsuari.punts ?? 0}</p>
                    </div>

                    <div style={{ height: '1px', background: '#f3f4f6', margin: '1rem 0' }} />

                    {/* Rol */}
                    <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rol</span>
                        <p style={{ margin: '0.4rem 0 0', fontSize: '1rem', color: '#111827', fontWeight: 600 }}>
                            {perfilUsuari.es_fisioterapeuta ? '🩺 Fisioterapeuta' : '🏃 Pacient'}
                        </p>
                    </div>

                </div>
            )}
        </section>
    )
}
