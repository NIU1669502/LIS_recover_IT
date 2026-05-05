'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import styles from './bibliotecaExercicis.module.css'

export default function BibliotecaExercicis({ onTornar }) {
  const [exercicis, setExercicis] = useState([])
  const [musculs, setMusculs] = useState([])
  const [filtreActiu, setFiltreActiu] = useState('Tots')
  const [carregant, setCarregant] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      // Exercicis amb els seus musculs via JOIN
      const { data: exData } = await supabase
        .from('exercicis')
        .select(`
          *,
          exercici_muscul (
            musculs ( id_cos, nom )
          )
        `)

      // Musculs per als filtres
      const { data: musData } = await supabase
        .from('musculs')
        .select('id_cos, nom')
        .order('nom')

      if (exData) setExercicis(exData)
      if (musData) setMusculs(musData)
      setCarregant(false)
    }
    carregar()
  }, [])

  const exercicisFiltrats = filtreActiu === 'Tots'
    ? exercicis
    : exercicis.filter(ex =>
      ex.exercici_muscul.some(em => em.musculs?.nom === filtreActiu)
    )

  return (
    <div>


      <h2 className={styles.title}>Biblioteca d'exercicis</h2>

      <div className={styles.filterContainer}>
        <p className={styles.filterLabel}>Filtrar per múscul</p>

        <div className={styles.filterButtons}>
          {/* Botó "Tots" */}
          <button
            onClick={() => setFiltreActiu('Tots')}
            className={`${styles.filterButton} ${filtreActiu === 'Tots' ? styles.activeFilter : ''}`}
          >
            Tots
          </button>

          {/* Botons dinàmics de la DB */}
          {musculs.map(m => (
            <button
              key={m.id_cos}
              onClick={() => setFiltreActiu(m.nom)}
              className={`${styles.filterButton} ${filtreActiu === m.nom ? styles.activeFilter : ''}`}
            >
              {m.nom}
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