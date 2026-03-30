'use client'

import { useState } from 'react'
import { supabase } from '../utils/supabase'

export default function Page() {

  // ============================================================
  // SPRINT 1 — ESTATS (afegir els que calguin per cada TODO)
  // ============================================================

  const [vistaActual, setVistaActual] = useState('inici')
  // Vistes possibles: 'inici' | 'login' | 'registre' | 'perfil' | 'test' | 'exercici'

  // ============================================================
  // RF-AUTH-01 — Registre d'usuari
  // L'usuari pot crear un compte amb correu i contrasenya
  // ============================================================
  const registrarUsuari = async () => {
    // TODO RF-AUTH-01: Implementar registre amb supabase.auth.signUp()
    // Camps necessaris: email, password (i possiblement nom, dni...)
    // En cas d'èxit → redirigir a login o directament a la pantalla principal
  }

  // ============================================================
  // RF-AUTH-02 — Inici de sessió
  // L'usuari pot iniciar sessió amb el seu compte
  // ============================================================
  const iniciarSessio = async () => {
    // TODO RF-AUTH-02: Implementar login amb supabase.auth.signInWithPassword()
    // En cas d'èxit → guardar sessió i redirigir al dashboard del pacient
    // En cas d'error → mostrar missatge d'error a l'usuari
  }

  // ============================================================
  // RF-AUTH-04 — Tancament de sessió
  // L'usuari pot tancar la sessió manualment
  // ============================================================
  const tancarSessio = async () => {
    // TODO RF-AUTH-04: Implementar logout amb supabase.auth.signOut()
    // En cas d'èxit → redirigir a la pantalla d'inici/login
  }

  // ============================================================
  // RF-AUTH-05 — Mantenir sessió
  // L'app recorda la sessió de l'usuari per no haver de fer login cada cop
  // ============================================================
  const comprovarSessio = async () => {
    // TODO RF-AUTH-05: Al carregar l'app, comprovar si hi ha sessió activa
    // Fer servir supabase.auth.getSession() o onAuthStateChange()
    // Si hi ha sessió → saltar directament al dashboard
    // Recomanat: posar aquesta lògica dins un useEffect([]) al component
  }

  // ============================================================
  // RF-AUTH-09 — Veure perfil
  // L'usuari pot consultar les seves dades del compte
  // ============================================================
  const obtenirPerfil = async () => {
    // TODO RF-AUTH-09: Llegir les dades del perfil de l'usuari des de Supabase
    // Probablement de la taula 'usuaris' filtrant per l'id de l'usuari autenticat
    // Mostrar: nom, dni, i altres camps del perfil
  }

  // ============================================================
  // RF-AUTH-10 — Editar perfil
  // L'usuari pot modificar les seves dades personals
  // ============================================================
  const editarPerfil = async () => {
    // TODO RF-AUTH-10: Actualitzar les dades del perfil a Supabase
    // Fer servir supabase.from('usuaris').update({...}).eq('id', userId)
    // Mostrar feedback visual un cop guardat
  }

  // ============================================================
  // RF-PAC-01 — Test diagnòstic
  // El pacient respon un qüestionari de 4-5 preguntes per determinar
  // la lesió i el programa assignat
  // ============================================================
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
function TestDiagnostic({ onGuardar, onCancel }) {
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
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem', color: '#166534' }}>
          <p><strong>Múscul afectat:</strong> {resultat.muscle}</p>
          <p><strong>Tipus de lesió:</strong> {resultat.tipus}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            onClick={() => onGuardar(resultat)}
            style={{ padding: '0.6rem 1.2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}
            onMouseOver={e=>e.target.style.background='#2563eb'}
            onMouseOut={e=>e.target.style.background='#3b82f6'}
          >
            Guardar a Supabase
          </button>
          <button
            onClick={reiniciar}
            style={{ padding: '0.6rem 1.2rem', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}
            onMouseOver={e=>e.target.style.background='#d1d5db'}
            onMouseOut={e=>e.target.style.background='#e5e7eb'}
          >
            Repetir test
          </button>
        </div>
      </div>
    )
  }

  const step = TEST_STEPS[pas]

  return (
    <div style={{ marginTop: '1.5rem', background: '#ffffff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', position: 'relative' }}>
      <button onClick={onCancel} style={{ position: 'absolute', top: '1rem', right: '1.25rem', background: 'none', border: 'none', fontSize: '1.75rem', color: '#9ca3af', cursor: 'pointer', lineHeight: 1, padding: 0 }} onMouseOver={e=>e.target.style.color='#ef4444'} onMouseOut={e=>e.target.style.color='#9ca3af'} title="Sortir del test">
        &times;
      </button>
      {/* Barra de progrés */}
      <p style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Pas {pas + 1} de {TEST_STEPS.length}</p>
      <div style={{ background: '#e5e7eb', borderRadius: '999px', height: '8px', marginBottom: '2rem', overflow: 'hidden' }}>
        <div style={{ background: '#3b82f6', width: `${((pas) / TEST_STEPS.length) * 100}%`, height: '100%', borderRadius: '999px', transition: 'width 0.4s ease-in-out' }} />
      </div>

      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '1.5rem' }}>{step.pregunta}</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {step.opcions.map((opcio, idx) => (
          <button
            key={idx}
            onClick={() => seleccionar(idx)}
            style={{ padding: '1rem', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '1rem', color: '#374151', transition: 'all 0.2s', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
            onMouseOver={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.1)'; }}
            onMouseOut={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
          >
            {opcio}
          </button>
        ))}
      </div>
    </div>
  )
}
   const processarTestDiagnostic = async (resultat) => {
    // resultat conté { muscle, tipus } i és enviat pel component TestDiagnostic

    try {
      // 1. Obtenir l'usuari actual de la sessió de Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        alert("Has d'iniciar sessió per poder guardar el teu diagnòstic.");
        return;
      }
      const userId = session.user.id;

      // 2. (Opcional) Determinar algun programa d'exercicis segons la lesió. 
      // Això podries tenir-ho en una taula de 'programes' o decidir-ho aquí mateix.
      let programaAssignat = 'Programa General';
      if (resultat.tipus === 'Esquinç muscular') programaAssignat = 'Recuperació Esquinç Fase 1';
      else if (resultat.tipus === 'Distensió muscular') programaAssignat = 'Recuperació Distensió Fase 1';
      else if (resultat.tipus === 'Contractura / Sobrecàrrega') programaAssignat = 'Alliberament miofascial';

      // 3. Guardar el resultat a Supabase
      // Canvia 'diagnostics_pacients' pel nom real de la teva taula a Supabase
      const { data, error } = await supabase
        .from('diagnostics_pacients') 
        .insert([
          { 
            user_id: userId, 
            muscle_afectat: resultat.muscle, 
            tipus_lesio: resultat.tipus,
            programa_assignat: programaAssignat,
            creat_el: new Date()
          }
        ]);

      if (error) {
        console.error("Error al guardar a Supabase:", error);
        alert("Hi ha hagut un problema al guardar el resultat.");
        return;
      }

      // 4. Feedback a l'usuari i redirigir
      alert("Diagnòstic completat i guardat amb èxit!");
      // Canviem de vista per començar a fer els exercicis o anar al perfil
      setVistaActual('exercici'); 

    } catch (err) {
      console.error("Error inesperat:", err);
    }
  }


  // ============================================================
  // RF-PAC-02 — Iniciar i completar exercici
  // El pacient pot iniciar un exercici, seguir el cronòmetre
  // i marcar-lo com a completat
  // ============================================================
  const iniciarExercici = async (exerciciId) => {
    // TODO RF-PAC-02: Carregar les dades de l'exercici des de Supabase
    // Mostrar: nom, vídeo, repeticions, cronòmetre
    // Quan acabi → marcar com a completat i sumar punts
  }

  const completarExercici = async (exerciciId) => {
    // TODO RF-PAC-02: Marcar l'exercici com a completat a Supabase
    // Actualitzar punts del pacient
    // Desbloquejar el següent exercici si escau (veure RF-PAC-03)
  }

  // ============================================================
  // RF-PAC-03 — Bloqueig seqüencial d'exercicis
  // El pacient no pot fer l'exercici N+1 sense haver completat l'exercici N
  // ============================================================
  const potFerExercici = (exerciciIndex, exercicisCompletats) => {
    // TODO RF-PAC-03: Retornar true/false segons si l'exercici anterior està completat
    // Exemple: si exerciciIndex === 0 → sempre disponible
    //          si exerciciIndex > 0  → comprovar que exercicisCompletats[index-1] === true
    return false // placeholder
  }

  // ============================================================
  // RF-PAC-04 — Bloqueig entre fases
  // El pacient no pot accedir als exercicis de la fase N+1
  // fins completar les sessions requerides de la fase N
  // ============================================================
  const potAccedirFase = (faseIndex, sessionsCompletadesFaseAnterior) => {
    // TODO RF-PAC-04: Comprovar si el pacient ha completat les sessions mínimes
    // de la fase anterior per desbloquejar la fase actual
    // Llegir de Supabase el progrés del pacient i comparar amb el llindar
    return false // placeholder
  }


  // ============================================================
  // RENDER — Estructura de pantalles (router manual simple)
  // ============================================================
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', color: '#111827', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid #e5e7eb', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span onClick={() => setVistaActual('inici')} style={{ color: '#111827', fontWeight: 800, fontSize: '1.25rem', cursor: 'pointer' }}>Recover<span style={{ color: '#3b82f6' }}>IT</span></span>
        <button onClick={tancarSessio} style={{ background: '#ffffff', border: '1px solid #d1d5db', color: '#374151', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }} onMouseOver={e=>e.target.style.background='#f3f4f6'} onMouseOut={e=>e.target.style.background='#ffffff'}>
          {/* TODO RF-AUTH-04: només mostrar si hi ha sessió activa */}
          Tancar sessió
        </button>
      </nav>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>

        {/* ── PANTALLA: LOGIN ───────────────────────────────── */}
        {vistaActual === 'login' && (
          <section>
            <h2>Inici de sessió</h2>
            {/* TODO RF-AUTH-02: Formulari amb email + password → cridar iniciarSessio() */}
            {/* TODO RF-AUTH-05: Al muntar aquest component, comprovar si ja hi ha sessió activa */}
            <p style={{ color: '#4b5063' }}>[Formulari de login aquí]</p>
          </section>
        )}

        {/* ── PANTALLA: REGISTRE ───────────────────────────── */}
        {vistaActual === 'registre' && (
          <section>
            <h2>Registre</h2>
            {/* TODO RF-AUTH-01: Formulari amb email, password (i dades addicionals) → cridar registrarUsuari() */}
            <p style={{ color: '#4b5063' }}>[Formulari de registre aquí]</p>
          </section>
        )}

        {/* ── PANTALLA: PERFIL ─────────────────────────────── */}
        {vistaActual === 'perfil' && (
          <section>
            <h2>El meu perfil</h2>
            {/* TODO RF-AUTH-09: Mostrar dades del perfil → cridar obtenirPerfil() */}
            {/* TODO RF-AUTH-10: Botó/formulari per editar les dades → cridar editarPerfil() */}
            <p style={{ color: '#4b5063' }}>[Dades del perfil aquí]</p>
            <p style={{ color: '#4b5063' }}>[Formulari d'edició aquí]</p>
          </section>
        )}

                {/* ── PANTALLA: TEST DIAGNÒSTIC ────────────────────── */}
        {vistaActual === 'test' && (
          <section>
            <h2>Test diagnòstic</h2>
            {/* Fem servir el component passant les nostres funcions */}
            <TestDiagnostic onGuardar={processarTestDiagnostic} onCancel={() => setVistaActual('inici')} />
          </section>
        )}


        {/* ── PANTALLA: EXERCICI ───────────────────────────── */}
        {vistaActual === 'exercici' && (
          <section>
            <h2>Exercici</h2>
            {/* TODO RF-PAC-02: Mostrar info de l'exercici (nom, vídeo, reps, cronòmetre) */}
            {/* TODO RF-PAC-02: Botó "Marcar com a completat" → cridar completarExercici() */}
            {/* TODO RF-PAC-03: Comprovar potFerExercici() abans de mostrar el botó d'inici */}
            {/* TODO RF-PAC-04: Comprovar potAccedirFase() abans de mostrar exercicis d'una fase */}
            <p style={{ color: '#4b5063' }}>[Vídeo demostratiu aquí]</p>
            <p style={{ color: '#4b5063' }}>[Cronòmetre aquí]</p>
            <p style={{ color: '#4b5063' }}>[Repeticions aquí]</p>
            <p style={{ color: '#4b5063' }}>[Botó completar aquí]</p>
          </section>
        )}

        {/* ── PANTALLA: INICI (default) ────────────────────── */}
        {vistaActual === 'inici' && (
          <section style={{ textAlign: 'center', paddingTop: '4rem' }}>
            <h1 style={{ color: '#111827', fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.025em' }}>Recover<span style={{ color: '#3b82f6' }}>IT</span></h1>
            <p style={{ color: '#4b5563', fontSize: '1.125rem', marginBottom: '3rem' }}>La teva plataforma de recuperació guiada i intel·ligent.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setVistaActual('login')} style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)', transition: 'all 0.2s' }} onMouseOver={e=>e.target.style.transform='translateY(-2px)'} onMouseOut={e=>e.target.style.transform='translateY(0)'}>
                Iniciar sessió
              </button>
              <button onClick={() => setVistaActual('registre')} style={{ padding: '0.75rem 1.5rem', background: '#ffffff', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }} onMouseOver={e=>e.target.style.transform='translateY(-2px)'} onMouseOut={e=>e.target.style.transform='translateY(0)'}>
                Registrar-me
              </button>
              <button onClick={() => setVistaActual('test')} style={{ padding: '0.75rem 1.5rem', background: '#111827', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)', transition: 'all 0.2s' }} onMouseOver={e=>e.target.style.transform='translateY(-2px)'} onMouseOut={e=>e.target.style.transform='translateY(0)'}>
                Començar test
              </button>
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
