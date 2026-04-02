'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'

// ============================================================
// Component: BibliotecaExercicis
// ============================================================
const FILTRES = ['Tots', 'Quadríceps', 'Isquiotibials', 'Genoll', 'Turmell', 'Panxell', 'Maluc']

export default function BibliotecaExercicis({ onTornar }) {
  const [exercicis, setExercicis] = useState([])
  const [filtreActiu, setFiltreActiu] = useState('Tots')
  const [carregant, setCarregant] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      const { data, error } = await supabase.from('exercicis').select('*')
      if (!error) setExercicis(data)
      setCarregant(false)
    }
    carregar()
  }, [])

  const exercicisFiltrats = filtreActiu === 'Tots'
    ? exercicis
    : exercicis.filter(ex => ex.zona === filtreActiu)

  return (
    <div>
      <button
        onClick={onTornar}
        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 500, fontSize: '1rem', marginBottom: '1.5rem', padding: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
      >
        ← Tornar a l'inici
      </button>

      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1.5rem' }}>Biblioteca d'exercicis</h2>

      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Filtrar per zona corporal</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {FILTRES.map(f => (
            <button
              key={f}
              onClick={() => setFiltreActiu(f)}
              style={{ padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid #d1d5db', background: filtreActiu === f ? '#3b82f6' : '#ffffff', color: filtreActiu === f ? '#ffffff' : '#374151', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {carregant ? (
        <p style={{ color: '#6b7280' }}>Carregant exercicis...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {exercicisFiltrats.map(ex => (
            <div key={ex.id_exercici} style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>{ex.nom}</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{ex.descripcio}</p>
              <p style={{ color: '#3b82f6', fontSize: '0.875rem', fontWeight: 500 }}>⏱ {ex.duracio_segons}s</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
