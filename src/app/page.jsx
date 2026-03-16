'use client' // Necessari pq estem fent servir useState i dependem de coses del navegador com onClick

import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase' // Importem el client que em preparat abans al .env

export default function ExempleSupabase() {
  // Aquí guardarem la llista d'usuaris un cop la baixem
  const [usuaris, setUsuaris] = useState([])

  // Aquests dos states són per controlar el que s'escriu al formulari d'alta
  const [nouDni, setNouDni] = useState('')
  const [nouNom, setNouNom] = useState('')

  // --------------------------------------------------------------------------
  // LLEGIR (SELECT): Com portar dades de Supabase cap a la web
  // --------------------------------------------------------------------------
  const obtenirUsuaris = async () => {
    // És súper senzill: des de la taula 'usuaris', portam-ho tot ('*')
    const { data, error } = await supabase
      .from('usuaris')
      .select('*')

    if (error) {
      console.error("Ups, la petició ha petat:", error.message)
    } else {
      // Si va bé, fiquem les dades a l'state pq React les pinti
      setUsuaris(data)
    }
  }

  // Fem servir useEffect perquè volem que les dades es carreguin automàticament
  // només obrir la pàgina (per això els claudàtors [] buits al final)
  useEffect(() => {
    obtenirUsuaris()
  }, [])

  // --------------------------------------------------------------------------
  // ESCRIURE (INSERT): Com enviar dades noves des del formulari cap a Supabase
  // --------------------------------------------------------------------------
  const afegirUsuari = async (e) => {
    // Evitem que el submit refresqui tota la pàgina (el comportament de l'HTML clàssic)
    e.preventDefault()

    // Passem un array amb els objectes que volem insertar. Els camps han de dir-se
    // exactament igual que les columnes de la BD. 
    const { data, error } = await supabase
      .from('usuaris')
      .insert([
        {
          dni: nouDni,
          nom: nouNom,
          es_fisioterapeuta: false, // Forcem false per defecte per anar ràpid
          punts: 0
        }
      ])
      .select() // .select() just després de posar dades fa que Supabase ens torni la fila completa acabada de crear

    if (error) {
      console.error("Error insertant:", error.message)
      alert("Oops! Alguna cosa ha fallat: " + error.message)
    } else {
      // Si som aquí, tot perfecte!
      alert("Llest! Usuari guardat a la BD.")

      // Buidem el formulari per si en volen posar un altre
      setNouDni('')
      setNouNom('')

      // Tornem a baixar la llista pq el nou surti pintat al react
      obtenirUsuaris()
    }
  }

  // --------------------------------------------------------------------------
  // FRONTEND (La part viusual)
  // --------------------------------------------------------------------------
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Exemple Supabase i Next.js</h1>

      {/* Caixa amb el formulari per posar dades */}
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
        <h2>Registra algú nou</h2>
        <form onSubmit={afegirUsuari} style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Escriu DNI aquí"
            value={nouDni}
            onChange={(e) => setNouDni(e.target.value)}
            required
            style={{ padding: '0.5rem' }}
          />
          <input
            type="text"
            placeholder="Nom complet"
            value={nouNom}
            onChange={(e) => setNouNom(e.target.value)}
            required
            style={{ padding: '0.5rem' }}
          />
          <button type="submit" style={{ padding: '0.5rem 1rem', background: 'blue', color: 'white' }}>
            Guardar a Supabase
          </button>
        </form>
      </div>

      {/* Caixa d'abaix on es pinta la llista */}
      <div style={{ marginTop: '2rem' }}>
        <h2>Usuaris actuals a la base de dades:</h2>

        {/* Si l'array està buit ho diem (o si està carregant) */}
        {usuaris.length === 0 && <p>Carregant usuaris...</p>}

        <ul style={{ lineHeight: '1.6' }}>
          {usuaris.map((u) => (
            <li key={u.dni} style={{ padding: '0.5rem 0' }}>
              <strong>{u.nom}</strong> <span>({u.dni})</span>
              {/* Afegim una mica de gràcia amb icones depenent si tenen el booleà de fisio on o off */}
              {u.es_fisioterapeuta ? ' 🩺 (És fisio)' : ' 🤕 (És pacient)'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
