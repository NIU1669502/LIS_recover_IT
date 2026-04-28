'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../utils/supabase'
import { marcarLesioRecuperada } from '../utils/lesions'

// ============================================================
// Component: ProgresPacient — RF-PAC-05 i RF-PAC-06
// Mostra TOTES les lesions (actives i historial recuperat),
// el progrés per cada lesió activa i l'historial de sessions.
// La recuperació és AUTOMÀTICA quan s'arriba al 100% de l'objectiu.
// ============================================================
export default function ProgresPacient({ perfilUsuari, onNavagarTest }) {
    const [pestanya, setPestanya] = useState('progres')
    const [lesions, setLesions] = useState([])      // totes les lesions
    const [historial, setHistorial] = useState([])
    const [carregant, setCarregant] = useState(true)
    const [error, setError] = useState('')

    const carregarDades = useCallback(async (dni) => {
        setCarregant(true)
        setError('')
        try {
            // Obtenir punts actuals del pacient (fonts de veritat)
            const { data: usuariData, error: usuariErr } = await supabase
                .from('usuaris')
                .select('punts')
                .eq('dni', dni)
                .maybeSingle()
            if (usuariErr) throw usuariErr
            const puntsActuals = usuariData?.punts ?? 0

            // Totes les lesions del pacient, ordenades de més recent a més antiga
            const { data: lesionsData, error: lesionsErr } = await supabase
                .from('lesions')
                .select('*, parts_cos(nom, seccio)')
                .eq('dni_pacient', dni)
                .order('data_inici', { ascending: false })

            if (lesionsErr) throw lesionsErr

            // ── Auto-recuperació: si punts >= objectiu, marcar automàticament ──
            const lesionsActualitzades = await Promise.all(
                (lesionsData || []).map(async (lesio) => {
                    if (!lesio.recuperat && puntsActuals >= lesio.punts_recuperacio_objectiu) {
                        await marcarLesioRecuperada(lesio.id_lesio)
                        return { ...lesio, recuperat: true, data_fi: new Date().toISOString() }
                    }
                    return lesio
                })
            )
            setLesions(lesionsActualitzades)

            // Historial d'exercicis
            const { data: historialData, error: historialErr } = await supabase
                .from('historial_exercicis_diaris')
                .select('*, exercicis(nom, duracio_segons)')
                .eq('dni_pacient', dni)
                .order('data_realitzacio', { ascending: false })

            if (historialErr) throw historialErr
            setHistorial(historialData || [])
        } catch (e) {
            setError(e.message)
        } finally {
            setCarregant(false)
        }
    }, [])

    useEffect(() => {
        if (perfilUsuari?.dni) carregarDades(perfilUsuari.dni)
    }, [perfilUsuari, carregarDades])

    // ── Derivats ────────────────────────────────────────────
    const lesionsActives = lesions.filter(l => !l.recuperat)
    const lesionsRecuperades = lesions.filter(l => l.recuperat)
    const puntsActuals = perfilUsuari?.punts ?? 0

    // Sessions per dia
    const sessionsPorDia = historial.reduce((acc, item) => {
        const dia = item.data_realitzacio
        if (!acc[dia]) acc[dia] = []
        acc[dia].push(item)
        return acc
    }, {})
    const diesOrdenats = Object.keys(sessionsPorDia).sort((a, b) => new Date(b) - new Date(a))
    const totalCompletats = historial.filter(h => h.completat).length

    // ── Helpers ─────────────────────────────────────────────
    const formatData = (dateStr) => {
        if (!dateStr) return '—'
        return new Date(dateStr).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    }
    const formatSegons = (s) => {
        if (!s) return '0 min'
        if (s < 60) return `${s}s`
        return `${Math.floor(s / 60)} min${s % 60 > 0 ? ` ${s % 60}s` : ''}`.trim()
    }
    const pct = (punts, objectiu) => Math.min(100, Math.round((punts / (objectiu || 100)) * 100))

    // ── Estils reutilitzables ───────────────────────────────
    const card = {
        background: '#ffffff', border: '1px solid #e5e7eb',
        borderRadius: '16px', padding: '1.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '1rem',
    }
    const badge = (color) => ({
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        padding: '0.25rem 0.65rem', borderRadius: '99px',
        fontSize: '0.75rem', fontWeight: 700,
        background: color === 'green' ? '#dcfce7' : color === 'blue' ? '#dbeafe' : color === 'yellow' ? '#fef9c3' : '#f3f4f6',
        color: color === 'green' ? '#15803d' : color === 'blue' ? '#1d4ed8' : color === 'yellow' ? '#854d0e' : '#374151',
    })

    if (carregant) return (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
            <p>Carregant el teu progrés…</p>
        </div>
    )

    if (error) return (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
            <p>⚠️ Error en carregar les dades: {error}</p>
        </div>
    )

    return (
        <section style={{ maxWidth: '620px', margin: '0 auto', padding: '0 1rem 2rem' }}>

            {/* Capçalera */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: '3.5rem', height: '3.5rem', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                    <span style={{ fontSize: '1.75rem' }}>📈</span>
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>
                        El meu progrés
                    </h2>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
                        {lesionsActives.length} lesió{lesionsActives.length !== 1 ? 'ns actives' : ' activa'} · {lesionsRecuperades.length} recuperades
                    </p>
                </div>
            </div>

            {/* Pestanyes */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#f3f4f6', borderRadius: '10px', padding: '4px' }}>
                {[
                    { id: 'progres', label: '📊 Progrés (RF-PAC-05)' },
                    { id: 'historial', label: '📋 Sessions (RF-PAC-06)' },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setPestanya(tab.id)} style={{
                        flex: 1, padding: '0.6rem 1rem',
                        background: pestanya === tab.id ? '#ffffff' : 'transparent',
                        color: pestanya === tab.id ? '#111827' : '#6b7280',
                        border: 'none', borderRadius: '8px', cursor: 'pointer',
                        fontWeight: 700, fontSize: '0.85rem',
                        boxShadow: pestanya === tab.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.2s',
                    }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ══ PESTANYA PROGRÉS (RF-PAC-05) ══════════════════ */}
            {pestanya === 'progres' && (
                <div>
                    {/* Stats globals */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                        {[
                            { icon: '🏥', label: 'Lesions actives', valor: lesionsActives.length },
                            { icon: '✅', label: 'Recuperades', valor: lesionsRecuperades.length },
                            { icon: '⭐', label: 'Punts totals', valor: puntsActuals },
                        ].map(stat => (
                            <div key={stat.label} style={{ ...card, marginBottom: 0, textAlign: 'center', padding: '1rem' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{stat.icon}</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111827' }}>{stat.valor}</div>
                                <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── Lesions ACTIVES ── */}
                    {lesionsActives.length > 0 && (
                        <>
                            <h3 style={{ margin: '1.25rem 0 0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                🔴 Lesions actives
                            </h3>
                            {lesionsActives.map(lesio => {
                                const p = pct(puntsActuals, lesio.punts_recuperacio_objectiu)
                                return (
                                    <div key={lesio.id_lesio} style={card}>
                                        {/* Capçalera lesió */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 800, color: '#111827', fontSize: '1rem' }}>
                                                    {lesio.nom_lesio}
                                                </p>
                                                <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                                                    {lesio.parts_cos?.nom ?? '—'} · Dia {lesio.dia_rehabilitacio} · Inici: {formatData(lesio.data_inici)}
                                                </p>
                                            </div>
                                            <span style={badge(p >= 100 ? 'green' : p >= 50 ? 'blue' : 'yellow')}>
                                                {p}%
                                            </span>
                                        </div>

                                        {/* Barra de progrés */}
                                        <div style={{ background: '#f3f4f6', borderRadius: '99px', height: '10px', overflow: 'hidden', marginBottom: '0.6rem' }}>
                                            <div style={{
                                                height: '100%', width: `${p}%`,
                                                background: p >= 100
                                                    ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                                                    : p >= 50
                                                        ? 'linear-gradient(90deg,#3b82f6,#1d4ed8)'
                                                        : 'linear-gradient(90deg,#f59e0b,#d97706)',
                                                borderRadius: '99px', transition: 'width 0.6s ease',
                                            }} />
                                        </div>
                                        <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#6b7280' }}>
                                            <strong style={{ color: '#111827' }}>{puntsActuals}</strong> / {lesio.punts_recuperacio_objectiu} punts
                                        </p>

                                        {/* Descripció */}
                                        {lesio.descripcio && (
                                            <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#4b5563', background: '#f9fafb', padding: '0.6rem 0.8rem', borderRadius: '8px', borderLeft: '3px solid #e5e7eb' }}>
                                                {lesio.descripcio}
                                            </p>
                                        )}

                                        {/* Missatge motivacional segons % */}
                                        {p < 100 ? (
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', textAlign: 'center', paddingTop: '0.25rem' }}>
                                                🎯 Segueix completant exercicis per arribar al 100% i marcar-te com a recuperat/da!
                                            </p>
                                        ) : (
                                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                                                <p style={{ margin: 0, fontWeight: 700, color: '#15803d', fontSize: '0.9rem' }}>🎉 Has assolit l'objectiu! La recuperació es marcarà automàticament.</p>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </>
                    )}

                    {/* ── Lesions RECUPERADES (historial) ── */}
                    {lesionsRecuperades.length > 0 && (
                        <>
                            <h3 style={{ margin: '1.25rem 0 0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                ✅ Historial de lesions recuperades
                            </h3>
                            {lesionsRecuperades.map(lesio => (
                                <div key={lesio.id_lesio} style={{ ...card, opacity: 0.85 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 700, color: '#374151', fontSize: '0.95rem' }}>
                                                {lesio.nom_lesio}
                                            </p>
                                            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                                                {lesio.parts_cos?.nom ?? '—'} · {formatData(lesio.data_inici)} → {formatData(lesio.data_fi)}
                                            </p>
                                        </div>
                                        <span style={badge('green')}>✅ Recuperat</span>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Sense lesions */}
                    {lesions.length === 0 && (
                        <div style={{ ...card, textAlign: 'center', color: '#6b7280' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏃</div>
                            <p style={{ margin: 0, fontWeight: 600 }}>No tens cap lesió registrada.</p>
                            {onNavagarTest && (
                                <button onClick={onNavagarTest} style={{ marginTop: '1rem', padding: '0.6rem 1.25rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                                    Fer el test diagnòstic
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ══ PESTANYA HISTORIAL SESSIONS (RF-PAC-06) ═══════ */}
            {pestanya === 'historial' && (
                <div>
                    {/* Stats ràpides */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                        {[
                            { icon: '📅', label: 'Dies amb sessió', valor: diesOrdenats.length },
                            { icon: '✅', label: 'Ex. completats', valor: totalCompletats },
                        ].map(stat => (
                            <div key={stat.label} style={{ ...card, marginBottom: 0, textAlign: 'center', padding: '1rem' }}>
                                <div style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111827' }}>{stat.valor}</div>
                                <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {diesOrdenats.length === 0 && (
                        <div style={{ ...card, textAlign: 'center', color: '#6b7280' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                            <p style={{ margin: 0, fontWeight: 600 }}>Encara no has completat cap sessió.</p>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>Comença avui el teu primer exercici!</p>
                        </div>
                    )}

                    {diesOrdenats.map(dia => {
                        const sessions = sessionsPorDia[dia]
                        const puntsDia = sessions.reduce((s, h) => s + (h.punts_obtinguts ?? 0), 0)
                        const completadesDia = sessions.filter(h => h.completat).length

                        return (
                            <div key={dia} style={card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 800, color: '#111827', fontSize: '1rem' }}>
                                            📅 {formatData(dia)}
                                        </p>
                                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                                            {completadesDia}/{sessions.length} exercicis completats
                                        </p>
                                    </div>
                                    <span style={badge('blue')}>+{puntsDia} pts</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {sessions.map(h => (
                                        <div key={h.id_historial} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '0.6rem 0.75rem',
                                            background: h.completat ? '#f0fdf4' : '#fafafa',
                                            borderRadius: '10px',
                                            border: `1px solid ${h.completat ? '#bbf7d0' : '#f3f4f6'}`,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span>{h.completat ? '✅' : '⏸️'}</span>
                                                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>
                                                    {h.exercicis?.nom ?? `Exercici #${h.id_exercici}`}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                {h.temps_realitzat_segons > 0 && (
                                                    <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                                                        ⏱ {formatSegons(h.temps_realitzat_segons)}
                                                    </span>
                                                )}
                                                {h.punts_obtinguts > 0 && (
                                                    <span style={badge('green')}>+{h.punts_obtinguts} pts</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}
