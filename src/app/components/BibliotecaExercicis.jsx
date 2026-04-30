'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import styles from './bibliotecaExercicis.module.css'

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
      <button className={styles.backButton} onClick={onTornar}>
        ← Tornar a l'inici
      </button>

      <h2 className={styles.title}>Biblioteca d'exercicis</h2>

      <div className={styles.filterContainer}>
        <p className={styles.filterLabel}>Filtrar per zona corporal</p>

        <div className={styles.filterButtons}>
          {FILTRES.map(f => (
            <button
              key={f}
              onClick={() => setFiltreActiu(f)}
              className={`${styles.filterButton} ${filtreActiu === f ? styles.activeFilter : ''}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {carregant ? (
        <p className={styles.loadingText}>Carregant exercicis...</p>
      ) : (
        <div className={styles.grid}>
          {exercicisFiltrats.map(ex => (
            <div key={ex.id_exercici} className={styles.card}>
              <h3 className={styles.cardTitle}>{ex.nom}</h3>
              <p className={styles.cardDescription}>{ex.descripcio}</p>
              <p className={styles.cardDuration}>⏱ {ex.duracio_segons}s</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}