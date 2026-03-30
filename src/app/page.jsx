'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

// ─── Dades del test ───────────────────────────────────────────────────────────
const MUSCLES = ['Quadriceps', 'Isquiotibials', 'Bessons']

const TEST_STEPS = [
  {
    pregunta: 'Quin múscul et fa mal?',
    opcions: ['Quadriceps', 'Isquiotibials', 'Bessons'],
  },
  {
    pregunta: 'Quan va apareixer el dolor?',
    opcions: [
      'De cop, durant esport o esforç',
      'Gradualment, en dies o setmanes',
      'Em vaig despertar amb dolor',
    ],
  },
  {
    pregunta: 'Com descriuries el dolor?',
    opcions: [
      'Dolor agut, com una ganivetada',
      'Rigidesa i tensió general al múscul',
      'Tibantor, com si el múscul estigués estret',
    ],
  },
  {
    pregunta: 'Pots moure el múscul amb normalitat?',
    opcions: [
      'Difícilment, em provoca molt de dolor',
      'Puc moure\'l però amb molèstia',
      'Sí, però noto tensió i limitació',
    ],
  },
]

function determinarLesio(respostes) {
  const onset    = respostes[1] // 0=cop, 1=gradual, 2=dormint
  const dolor    = respostes[2] // 0=agut, 1=rigidesa, 2=tibantor
  const mobilitat = respostes[3] // 0=poc, 1=molèstia, 2=sí

  if (onset === 0 && mobilitat === 0) return 'Esquinç muscular'
  if (onset === 0 && mobilitat === 1) return 'Distensió muscular'
  if (dolor === 1 || dolor === 2)     return 'Contractura / Sobrecàrrega'
  return 'Distensió muscular'
}

// ─── Component del test ───────────────────────────────────────────────────────
function TestDiagnostic({ onGuardar }) {
  const [pas, setPas]           = useState(0)
  const [respostes, setRespostes] = useState({})
  const [resultat, setResultat]  = useState(null)

  const seleccionar = (idx) => {
    const novesRespostes = { ...respostes, [pas]: idx }
    setRespostes(novesRespostes)

    if (pas < TEST_STEPS.length - 1) {
      setPas(pas + 1)
    } else {
      // Últim pas: calcular resultat
      const tipus  = determinarLesio(novesRespostes)
      const muscle = TEST_STEPS[0].opcions[novesRespostes[0]]
      setResultat({ muscle, tipus })
    }
  }

  const reiniciar = () => {
    setPas(0)
    setRespostes({})
    setResultat(null)
  }

  // Resultat final
  if (resultat) {
    return (
      <div style={{ marginTop: '1rem' }}>
        <h3>Resultat del diagnosi:</h3>
        <div style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem' }}>
          <p><strong>Múscul afectat:</strong> {resultat.muscle}</p>
          <p><strong>Tipus de lesió:</strong> {resultat.tipus}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            onClick={() => onGuardar(resultat)}
            style={{ padding: '0.5rem 1rem', background: 'green', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Guardar a Supabase
          </button>
          <button
            onClick={reiniciar}
            style={{ padding: '0.5rem 1rem', background: '#888', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Repetir test
          </button>
        </div>
      </div>
    )
  }

  const step = TEST_STEPS[pas]

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Barra de progrés */}
      <p style={{ color: '#888', fontSize: '0.85rem' }}>Pas {pas + 1} de {TEST_STEPS.length}</p>
      <div style={{ background: '#ddd', borderRadius: '4px', height: '6px', marginBottom: '1rem' }}>
        <div style={{ background: 'blue', width: `${((pas) / TEST_STEPS.length) * 100}%`, height: '100%', borderRadius: '4px', transition: 'width 0.3s' }} />
      </div>

      <h3>{step.pregunta}</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
        {step.opcions.map((opcio, idx) => (
          <button
            key={idx}
            onClick={() => seleccionar(idx)}
            style={{ padding: '0.75rem 1rem', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem' }}
            onMouseOver={e => e.target.style.background = '#e0e0ff'}
            onMouseOut={e => e.target.style.background = '#f0f0f0'}
          >
            {opcio}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Pàgina principal ─────────────────────────────────────────────────────────
export default function ExempleSupabase() {
  const [usuaris, setUsuaris] = useState([])
  const [nouDni, setNouDni]   = useState('')
  const [nouNom, setNouNom]   = useState('')
  const [mostrarTest, setMostrarTest] = useState(false)

  const obtenirUsuaris = async () => {
    const { data, error } = await supabase.from('usuaris').select('*')
    if (error) {
      console.error('Ups, la petició ha petat:', error.message)
    } else {
      setUsuaris(data)
    }
  }

  useEffect(() => {
    obtenirUsuaris()
  }, [])

  const afegirUsuari = async (e) => {
    e.preventDefault()
    const { data, error } = await supabase
      .from('usuaris')
      .insert([{ dni: nouDni, nom: nouNom, es_fisioterapeuta: false, punts: 0 }])
      .select()
    if (error) {
      console.error('Error insertant:', error.message)
      alert('Oops! Alguna cosa ha fallat: ' + error.message)
    } else {
      alert('Llest! Usuari guardat a la BD.')
      setNouDni('')
      setNouNom('')
      obtenirUsuaris()
    }
  }

  // Quan el test acaba, guardem la lesió a Supabase
  // TODO: canviar 'lesions' pel nom real de la teva taula a Supabase
  const guardarLesio = async ({ muscle, tipus }) => {
    const { error } = await supabase
      .from('lesions')
      .insert([{ muscle, tipus, data_lesio: new Date().toISOString() }])

    if (error) {
      console.error('Error guardant lesió:', error.message)
      alert('Error guardant: ' + error.message)
    } else {
      alert(`Lesió guardada! ${muscle} - ${tipus}`)
      setMostrarTest(false)
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Exemple Supabase i Next.js</h1>

      {/* ── Formulari d'alta ───────────────────────────────────────────── */}
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
        <h2>Registra algú nou</h2>
        <form onSubmit={afegirUsuari} style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text" placeholder="Escriu DNI aquí" value={nouDni}
            onChange={(e) => setNouDni(e.target.value)} required
            style={{ padding: '0.5rem' }}
          />
          <input
            type="text" placeholder="Nom complet" value={nouNom}
            onChange={(e) => setNouNom(e.target.value)} required
            style={{ padding: '0.5rem' }}
          />
          <button type="submit" style={{ padding: '0.5rem 1rem', background: 'blue', color: 'white', border: 'none', cursor: 'pointer' }}>
            Guardar a Supabase
          </button>
        </form>
      </div>

      {/* ── Test de diagnosi ───────────────────────────────────────────── */}
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Test de diagnosi de lesió</h2>
          <button
            onClick={() => setMostrarTest(!mostrarTest)}
            style={{ padding: '0.5rem 1rem', background: mostrarTest ? '#888' : 'blue', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {mostrarTest ? 'Tancar test' : 'Fer el test'}
          </button>
        </div>

        {mostrarTest && (
          <TestDiagnostic onGuardar={guardarLesio} />
        )}
      </div>

      {/* ── Llista d'usuaris ───────────────────────────────────────────── */}
      <div style={{ marginTop: '2rem' }}>
        <h2>Usuaris actuals a la base de dades:</h2>
        {usuaris.length === 0 && <p>Carregant usuaris...</p>}
        <ul style={{ lineHeight: '1.6' }}>
          {usuaris.map((u) => (
            <li key={u.dni} style={{ padding: '0.5rem 0' }}>
              <strong>{u.nom}</strong> <span>({u.dni})</span>
              {u.es_fisioterapeuta ? ' 🩺 (És fisio)' : ' 🤕 (És pacient)'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
