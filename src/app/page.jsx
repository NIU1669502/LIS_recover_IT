'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

export default function Page() {

  // ============================================================
  // SPRINT 1 — ESTATS (afegir els que calguin per cada TODO)
  // ============================================================

  const [vistaActual, setVistaActual] = useState('inici')
  const [usuariSessio, setUsuariSessio] = useState(null)
  const [perfilUsuari, setPerfilUsuari] = useState(null)
  const [errorAuth, setErrorAuth] = useState('')
  const [carregantAuth, setCarregantAuth] = useState(false)
  const [registreForm, setRegistreForm] = useState({ nom: '', dni: '', email: '', password: '' })
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  // Vistes possibles: 'inici' | 'login' | 'registre' | 'perfil' | 'test' | 'exercici'

  // === NOU: GESTIÓ D'HISTORIAL PER PODER TORNAR ENRERE ===
  useEffect(() => {
    const manejarPopState = (event) => {
      if (event.state && event.state.vista) {
        setVistaActual(event.state.vista);
      } else {
        setVistaActual('inici');
      }
    };

    window.addEventListener('popstate', manejarPopState);

    if (!window.history.state) {
      window.history.replaceState({ vista: 'inici' }, '');
    }

    comprovarSessio();

    return () => window.removeEventListener('popstate', manejarPopState);
  }, []);

  // Funció per canviar de vista i guardar en l'historial del navegador
  const navegarA = (novaVista) => {
    setErrorAuth('');
    setVistaActual(novaVista);
    window.history.pushState({ vista: novaVista }, '', `#${novaVista}`);
  };

  const tornarEnrere = () => {
    window.history.back();
  };

  // ============================================================
  // RF-AUTH-01 — Registre d'usuari
  // L'usuari pot crear un compte amb correu i contrasenya
  // ============================================================
  const registrarUsuari = async () => {
    const nom = registreForm.nom.trim()
    const dni = registreForm.dni.trim()
    const email = registreForm.email.trim()
    const password = registreForm.password

    if (!nom || !dni || !email || !password) {
      setErrorAuth('Omple nom, DNI, email i contrasenya per registrar-te.')
      return
    }

    setErrorAuth('')
    setCarregantAuth(true)
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { dni, nom, es_fisioterapeuta: false }
        }
      })

      if (signUpError) {
        setErrorAuth(signUpError.message)
        return
      }

      const { error: upsertError } = await supabase
        .from('usuaris')
        .upsert(
          { dni, nom, es_fisioterapeuta: false },
          { onConflict: 'dni' }
        )

      if (upsertError) {
        setErrorAuth(`Usuari creat a Auth però no guardat a usuaris: ${upsertError.message}`)
        return
      }

      if (signUpData.session?.user) {
        setUsuariSessio(signUpData.session.user)
        await obtenirPerfil(signUpData.session.user)
        navegarA('test')
      } else {
        navegarA('login')
        alert('Compte creat correctament! Has de verificar el teu email abans de començar. Revisa el correu (i la carpeta de Spam) i després inicia sessió aquí.')
      }
    } catch (err) {
      setErrorAuth(err.message || 'Error inesperat al registrar usuari.')
    } finally {
      setCarregantAuth(false)
    }
  }

  // ============================================================
  // RF-AUTH-02 — Inici de sessió
  // L'usuari pot iniciar sessió amb el seu compte
  // ============================================================
  const iniciarSessio = async () => {
    const email = loginForm.email.trim()
    const password = loginForm.password

    if (!email || !password) {
      setErrorAuth('Introdueix email i contrasenya.')
      return
    }

    setErrorAuth('')
    setCarregantAuth(true)
    try {
      // ... dins del try d'iniciarSessio
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      setUsuariSessio(data.user)
      await obtenirPerfil(data.user)

      // Comprovem si ja té una lesió per saber on enviar-lo
      const { data: lesio } = await supabase
        .from('lesions')
        .select('id_lesio')
        .eq('dni_pacient', data.user.user_metadata.dni)
        .maybeSingle()

      if (lesio) {
        navegarA('perfil') // Si ja està lesionat, al seu perfil
      } else {
        navegarA('test')   // Si és nou o no té lesió activa, al test
      }
    } catch (err) {
      setErrorAuth(err.message || 'Error inesperat en iniciar sessió.')
    } finally {
      setCarregantAuth(false)
    }
  }

  // ============================================================
  // RF-AUTH-04 — Tancament de sessió
  // L'usuari pot tancar la sessió manualment
  // ============================================================
  const tancarSessio = async () => {
    await supabase.auth.signOut()
    setUsuariSessio(null)
    setPerfilUsuari(null)
    setErrorAuth('')
    navegarA('inici')
  }

  // ============================================================
  // RF-AUTH-05 — Mantenir sessió
  // L'app recorda la sessió de l'usuari per no haver de fer login cada cop
  // ============================================================
  const comprovarSessio = async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) return

    const user = data.session?.user ?? null
    setUsuariSessio(user)
    if (user) {
      await obtenirPerfil(user)
    }
  }

  // ============================================================
  // RF-AUTH-09 — Veure perfil
  // L'usuari pot consultar les seves dades del compte
  // ============================================================
  const obtenirPerfil = async (userParam) => {
    const user = userParam || usuariSessio
    const dni = user?.user_metadata?.dni
    if (!dni) {
      setPerfilUsuari(null)
      return
    }

    const { data, error } = await supabase
      .from('usuaris')
      .select('*')
      .eq('dni', dni)
      .maybeSingle()

    if (error) {
      setErrorAuth(error.message)
      return
    }

    setPerfilUsuari(data || null)
  }

  // ============================================================
  // RF-AUTH-10 — Editar perfil
  // L'usuari pot modificar les seves dades personals
  // ============================================================
  const editarPerfil = async () => {
    if (!perfilUsuari?.dni) return

    const nomEditat = prompt('Nou nom:', perfilUsuari.nom || '')
    if (!nomEditat || !nomEditat.trim()) return

    const { error } = await supabase
      .from('usuaris')
      .update({ nom: nomEditat.trim() })
      .eq('dni', perfilUsuari.dni)

    if (error) {
      alert(`No s'ha pogut actualitzar el perfil: ${error.message}`)
      return
    }

    await obtenirPerfil()
    alert('Perfil actualitzat correctament.')
  }

  // ============================================================
  // RF-PAC-01 — Test diagnòstic
  // El pacient respon un qüestionari de 4-5 preguntes per determinar
  // la lesió i el programa assignat
  // ============================================================
  const TEST_STEPS = [
    {
      pregunta: 'Quin múscul et fa mal?',
      opcions: ['Quàdriceps', 'Isquiotibials', 'Bessons', 'Tríceps', 'Glutis', 'Deltoides', 'Bíceps'],
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
    {
      pregunta: 'Explica una breu descripció de com va succeir el dolor:',
      tipus: 'text',
    },
  ]

  function determinarLesio(respostes) {
    const onset = respostes[1] // 0=cop, 1=gradual, 2=dormint
    const dolor = respostes[2] // 0=agut, 1=rigidesa, 2=tibantor
    const mobilitat = respostes[3] // 0=poc, 1=molèstia, 2=sí

    if (onset === 0 && mobilitat === 0) return { tipus: 'Esquinç muscular', emoji: '🤕', temps: '3-6 setmanes', sessions: '12-15', fase: 'Fase 1 - Inicial' }
    if (onset === 0 && mobilitat === 1) return { tipus: 'Distensió muscular', emoji: '😖', temps: '2-4 setmanes', sessions: '8-10', fase: 'Fase 1 - Inicial' }
    if (dolor === 1 || dolor === 2) return { tipus: 'Contractura / Sobrecàrrega', emoji: '😫', temps: '5-10 dies', sessions: '5-7', fase: 'Fase 1 - Inicial' }

    return { tipus: 'Distensió muscular', emoji: '😖', temps: '2-4 setmanes', sessions: '8-10', fase: 'Fase 1 - Inicial' }
  }

  // ─── Component del test ───────────────────────────────────────────────────────
  function TestDiagnostic({ onGuardar, onCancel }) {
    const [pas, setPas] = useState(0)
    const [respostes, setRespostes] = useState({})
    const [resultat, setResultat] = useState(null)
    const [textInput, setTextInput] = useState('')

    const seleccionar = (valor) => {
      const novesRespostes = { ...respostes, [pas]: valor }
      setRespostes(novesRespostes)
      setTextInput('')

      if (pas < TEST_STEPS.length - 1) {
        setPas(pas + 1)
      } else {
        // Últim pas: calcular resultat
        const detall = determinarLesio(novesRespostes)
        const muscle = TEST_STEPS[0].opcions[novesRespostes[0]]
        setResultat({ muscle, ...detall, descripcio: novesRespostes[4] })
      }
    }

    const reiniciar = () => {
      setPas(0)
      setRespostes({})
      setResultat(null)
      setTextInput('')
    }

    // Resultat final
    if (resultat) {
      return (
        <div style={{ marginTop: '1.5rem', background: '#ffffff', padding: '2rem 1.5rem', borderRadius: '16px', color: '#111827', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontFamily: 'system-ui, sans-serif', position: 'relative' }}>
          <button onClick={onCancel} style={{ position: 'absolute', top: '1rem', right: '1.25rem', background: 'none', border: 'none', fontSize: '1.5rem', color: '#9ca3af', cursor: 'pointer', lineHeight: 1 }} onMouseOver={e => e.target.style.color = '#ef4444'} onMouseOut={e => e.target.style.color = '#9ca3af'} title="Tancar resultats">
            &times;
          </button>

          <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem', lineHeight: 1 }}>{resultat.emoji}</div>

          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.75rem', lineHeight: 1.1, letterSpacing: '-0.02em', textWrap: 'balance' }}>
            {resultat.tipus}
          </h2>

          <p style={{ color: '#4b5563', fontSize: '1rem', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
            Hem detectat una <strong style={{ color: '#111827' }}>{resultat.tipus}</strong> als <strong style={{ color: '#111827' }}>{resultat.muscle}</strong>. Et preparem un programa de rehabilitació aproximat.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', textAlign: 'left', marginBottom: '2rem' }}>
            <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '12px' }}>
              <p style={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Múscul afectat</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{resultat.muscle}</p>
            </div>
            <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '12px' }}>
              <p style={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Temps recuperació</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{resultat.temps}</p>
            </div>
            <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '12px' }}>
              <p style={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Sessions neces.</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{resultat.sessions}</p>
            </div>
            <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '12px' }}>
              <p style={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Fase inicial</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{resultat.fase}</p>
            </div>
          </div>

          <button
            onClick={() => onGuardar(resultat)}
            style={{ width: '100%', padding: '0.8rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', transition: 'background 0.2s', boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)', marginBottom: '0.75rem' }}
            onMouseOver={e => e.target.style.background = '#2563eb'}
            onMouseOut={e => e.target.style.background = '#3b82f6'}
          >
            Començar programa &rarr;
          </button>
          <button
            onClick={reiniciar}
            style={{ width: '100%', padding: '0.8rem', background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s' }}
            onMouseOver={e => { e.target.style.background = '#e5e7eb'; e.target.style.color = '#111827'; }}
            onMouseOut={e => { e.target.style.background = '#f3f4f6'; e.target.style.color = '#4b5563'; }}
          >
            &#x21ba; Tornar a fer el test
          </button>
        </div>
      )
    }

    const step = TEST_STEPS[pas]

    return (
      <div style={{ marginTop: '1.5rem', background: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', position: 'relative' }}>
        <button onClick={onCancel} style={{ position: 'absolute', top: '1rem', right: '1.25rem', background: 'none', border: 'none', fontSize: '1.5rem', color: '#9ca3af', cursor: 'pointer', lineHeight: 1, padding: 0 }} onMouseOver={e => e.target.style.color = '#ef4444'} onMouseOut={e => e.target.style.color = '#9ca3af'} title="Sortir del test">
          &times;
        </button>
        {/* Barra de progrés */}
        <p style={{ color: '#6b7280', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.5rem' }}>Pas {pas + 1} de {TEST_STEPS.length}</p>
        <div style={{ background: '#e5e7eb', borderRadius: '999px', height: '6px', marginBottom: '1.5rem', overflow: 'hidden' }}>
          <div style={{ background: '#3b82f6', width: `${((pas) / TEST_STEPS.length) * 100}%`, height: '100%', borderRadius: '999px', transition: 'width 0.4s ease-in-out' }} />
        </div>

        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.85rem', lineHeight: 1.4 }}>
          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>❗</span>
          <p style={{ margin: 0 }}><strong>Atenció:</strong> Aquest pla és una aproximació, es recomana consultar a un fisioterapeuta per un diagnòstic precís.</p>
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>{step.pregunta}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {step.tipus === 'text' ? (
            <>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Escriu aquí com et vas fer la lesió..."
                style={{ padding: '0.8rem 1rem', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem', color: '#374151', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
              />
              <button
                onClick={() => seleccionar(textInput)}
                disabled={!textInput.trim()}
                style={{ marginTop: '0.5rem', padding: '0.8rem 1rem', background: textInput.trim() ? '#3b82f6' : '#9ca3af', color: 'white', border: 'none', borderRadius: '8px', cursor: textInput.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.95rem', transition: 'background 0.2s' }}
              >
                Següent &rarr;
              </button>
            </>
          ) : (
            step.opcions.map((opcio, idx) => (
              <button
                key={idx}
                onClick={() => seleccionar(idx)}
                style={{ padding: '0.8rem 1rem', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', color: '#374151', transition: 'all 0.2s', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                onMouseOver={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.1)'; }}
                onMouseOut={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
              >
                {opcio}
              </button>
            ))
          )}
        </div>
      </div>
    )
  }
  const processarTestDiagnostic = async (resultat) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        alert("Has d'iniciar sessió per poder guardar el teu diagnòstic.");
        return;
      }

      const userDni = session.user.user_metadata?.dni;

      // Determinar id_cos (de l'1 al 7 segons l'índex de l'array de músculs)
      const idxCos = TEST_STEPS[0].opcions.indexOf(resultat.muscle);
      const idCos = idxCos >= 0 ? idxCos + 1 : 1;

      // Primer comprovem si ja té una lesió guardada a la base de dades
      const { data: lesioAnterior } = await supabase
        .from('lesions')
        .select('id_lesio')
        .eq('dni_pacient', userDni)
        .limit(1);

      if (lesioAnterior && lesioAnterior.length > 0) {
        // ACTUALITZAR LA LESIÓ EXISTENT (sobreescriure)
        const id_lesio_existent = lesioAnterior[0].id_lesio;

        const { error } = await supabase
          .from('lesions')
          .update({
            id_cos: idCos,
            nom_lesio: resultat.tipus,
            descripcio: resultat.descripcio || 'Sense descripció',
            punts_recuperacio_objectiu: 100,
            recuperat: false,
            dia_rehabilitacio: 1
          })
          .eq('id_lesio', id_lesio_existent);

        if (error) {
          console.error("Error al actualitzar a Supabase:", error);
          alert(`Hi ha hagut un problema a l'actualitzar el resultat: ${error.message}`);
          return;
        }
      } else {
        // CREAR UNA NOVA LESIÓ SI NO EN TENIA CAP
        // Obtenir l'últim id_lesio per autoincrementar
        const { data: ultimaLesio } = await supabase
          .from('lesions')
          .select('id_lesio')
          .order('id_lesio', { ascending: false })
          .limit(1);

        const novaIdLesio = ultimaLesio && ultimaLesio.length > 0 ? ultimaLesio[0].id_lesio + 1 : 1;

        // Guardar el resultat a la taula lesions de Supabase
        const { error } = await supabase
          .from('lesions')
          .insert([
            {
              id_lesio: novaIdLesio,
              dni_pacient: userDni || '00000000A',
              id_cos: idCos,
              nom_lesio: resultat.tipus,
              descripcio: resultat.descripcio || 'Sense descripció',
              punts_recuperacio_objectiu: 100,
              recuperat: false,
              dia_rehabilitacio: 1
            }
          ]);

        if (error) {
          console.error("Error al guardar a Supabase:", error);
          alert(`Hi ha hagut un problema al guardar el resultat: ${error.message}`);
          return;
        }
      }

      alert("Diagnòstic completat i guardat amb èxit!");
      navegarA('exercici');
    } catch (err) {
      console.error("Error inesperat:", err);
    }
  }


  // ============================================================
  // RF-PAC-02 — Iniciar i completar exercici
  // ============================================================
  const iniciarExercici = async (exerciciId) => {
    // TODO RF-PAC-02: Carregar les dades de l'exercici des de Supabase
  }

  const completarExercici = async (exerciciId) => {
    // TODO RF-PAC-02: Marcar l'exercici com a completat a Supabase
  }

  // ============================================================
  // RF-PAC-03 — Bloqueig seqüencial d'exercicis
  // ============================================================
  const potFerExercici = (exerciciIndex, exercicisCompletats) => {
    return false // placeholder
  }

  // ============================================================
  // RF-PAC-04 — Bloqueig entre fases
  // ============================================================
  const potAccedirFase = (faseIndex, sessionsCompletadesFaseAnterior) => {
    return false // placeholder
  }
  // ============================================================
  // BIBLIOTECA D'EXERCICIS
  // ============================================================
  function BibliotecaExercicis({ onTornar }) {
    const [exercicis, setExercicis] = useState([])
    const [filtreActiu, setFiltreActiu] = useState('Tots')
    const [carregant, setCarregant] = useState(true)

    const filtres = ['Tots', 'Quadríceps', 'Isquiotibials', 'Genoll', 'Turmell', 'Panxell', 'Maluc']

    useEffect(() => {
      const carregar = async () => {
        const { data, error } = await supabase.from('exercicis').select('*')
        if (!error) setExercicis(data)
        setCarregant(false)
      }
      carregar()
    }, [])

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
            {filtres.map(f => (
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
            {exercicis.map(ex => (
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


  // ============================================================
  // RENDER — Estructura de pantalles (router manual simple)
  // ============================================================
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', color: '#111827', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── NAV ACTUALITZAT ── */}
      <nav style={{ padding: '0.8rem 2rem', borderBottom: '1px solid #e5e7eb', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <span onClick={() => navegarA('inici')} style={{ color: '#111827', fontWeight: 800, fontSize: '1.25rem', cursor: 'pointer' }}>Recover<span style={{ color: '#3b82f6' }}>IT</span></span>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* BOTÓ TORNAR ENRERE: Surt sempre que no siguem a la Home */}
          {vistaActual !== 'inici' && (
            <button
              onClick={tornarEnrere}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}
              onMouseOver={e => e.target.style.color = '#3b82f6'}
              onMouseOut={e => e.target.style.color = '#6b7280'}
            >
              <span style={{ fontSize: '1.1rem' }}>←</span> Tornar
            </button>
          )}

          {/* BOTÓ TANCAR SESSIÓ: Només si hi ha sessió activa */}
          {usuariSessio && (
            <button
              onClick={tancarSessio}
              style={{ background: '#ffffff', border: '1px solid #fee2e2', color: '#ef4444', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' }}
              onMouseOver={e => { e.target.style.background = '#fef2f2'; e.target.style.borderColor = '#fecaca'; }}
              onMouseOut={e => { e.target.style.background = '#ffffff'; e.target.style.borderColor = '#fee2e2'; }}
            >
              Tancar sessió
            </button>
          )}
        </div>
      </nav>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>

        {/* ── PANTALLA: LOGIN ───────────────────────────────── */}
        {vistaActual === 'login' && (
          <section>
            <h2>Inici de sessió</h2>
            <form onSubmit={(e) => { e.preventDefault(); iniciarSessio() }} style={{ display: 'grid', gap: '0.75rem', maxWidth: '420px' }}>
              <input
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                style={{ padding: '0.65rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
              <input
                type="password"
                placeholder="Contrasenya"
                value={loginForm.password}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                style={{ padding: '0.65rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
              {errorAuth && <p style={{ color: '#dc2626', margin: 0 }}>{errorAuth}</p>}
              <button
                type="submit"
                disabled={carregantAuth}
                style={{ padding: '0.65rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                {carregantAuth ? 'Iniciant sessió...' : 'Iniciar sessió'}
              </button>
            </form>
          </section>
        )}

        {/* ── PANTALLA: REGISTRE ───────────────────────────── */}
        {vistaActual === 'registre' && (
          <section>
            <h2>Registre</h2>
            <form onSubmit={(e) => { e.preventDefault(); registrarUsuari() }} style={{ display: 'grid', gap: '0.75rem', maxWidth: '420px' }}>
              <input
                type="text"
                placeholder="Nom complet"
                value={registreForm.nom}
                onChange={(e) => setRegistreForm((prev) => ({ ...prev, nom: e.target.value }))}
                style={{ padding: '0.65rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
              <input
                type="text"
                placeholder="DNI"
                value={registreForm.dni}
                onChange={(e) => setRegistreForm((prev) => ({ ...prev, dni: e.target.value }))}
                style={{ padding: '0.65rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
              <input
                type="email"
                placeholder="Email"
                value={registreForm.email}
                onChange={(e) => setRegistreForm((prev) => ({ ...prev, email: e.target.value }))}
                style={{ padding: '0.65rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
              <input
                type="password"
                placeholder="Contrasenya"
                value={registreForm.password}
                onChange={(e) => setRegistreForm((prev) => ({ ...prev, password: e.target.value }))}
                style={{ padding: '0.65rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
              {errorAuth && <p style={{ color: '#dc2626', margin: 0 }}>{errorAuth}</p>}
              <button
                type="submit"
                disabled={carregantAuth}
                style={{ padding: '0.65rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                {carregantAuth ? 'Registrant...' : 'Registrar-me'}
              </button>
            </form>
          </section>
        )}

        {/* ── PANTALLA: PERFIL ─────────────────────────────── */}
        {vistaActual === 'perfil' && (
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
                  onClick={editarPerfil}
                  style={{ padding: '0.55rem 1rem', background: '#ffffff', border: '1px solid #d1d5db', color: '#374151', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Editar nom
                </button>
              </>
            )}
          </section>
        )}

        {/* ── PANTALLA: TEST DIAGNÒSTIC ────────────────────── */}
        {vistaActual === 'test' && (
          <section style={{ marginTop: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: '3.5rem', height: '3.5rem', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)' }}>
                <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>🩺</span>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Test diagnòstic</h2>
              </div>
            </div>
            <TestDiagnostic onGuardar={processarTestDiagnostic} onCancel={() => navegarA('inici')} />
          </section>
        )}


        {/* ── PANTALLA: EXERCICI ───────────────────────────── */}
        {vistaActual === 'exercici' && (
          <section>
            <h2>Exercici</h2>
            <p style={{ color: '#4b5063' }}>[Vídeo demostratiu aquí]</p>
            <p style={{ color: '#4b5063' }}>[Cronòmetre aquí]</p>
            <p style={{ color: '#4b5063' }}>[Repeticions aquí]</p>
            <p style={{ color: '#4b5063' }}>[Botó completar aquí]</p>
          </section>
        )}
        {/* ── PANTALLA: BIBLIOTECA D'EXERCICIS ───────────────── */}
        {vistaActual === 'biblioteca' && (
          <BibliotecaExercicis onTornar={() => navegarA('inici')} />
        )}

        {/* ── PANTALLA: INICI (default) ────────────────────── */}
        {vistaActual === 'inici' && (
          <section style={{ textAlign: 'center', paddingTop: '4rem' }}>
            <h1 style={{ color: '#111827', fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.025em' }}>Recover<span style={{ color: '#3b82f6' }}>IT</span></h1>
            <p style={{ color: '#4b5563', fontSize: '1.125rem', marginBottom: '3rem' }}>La teva plataforma de recuperació guiada i intel·ligent.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {!usuariSessio ? (
                <>
                  <button onClick={() => navegarA('login')} style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)', transition: 'all 0.2s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
                    Iniciar sessió
                  </button>
                  <button onClick={() => navegarA('registre')} style={{ padding: '0.75rem 1.5rem', background: '#ffffff', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
                    Registrar-me
                  </button>

                </>

              ) : (
                <>
                  <button onClick={() => navegarA('test')} style={{ padding: '0.75rem 1.5rem', background: '#ffffff', color: '#111827', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }} onMouseOver={e => e.target.style.background = '#f3f4f6'} onMouseOut={e => e.target.style.background = '#ffffff'}>
                    Tornar a fer el test
                  </button>
                  <button onClick={() => navegarA('perfil')} style={{ padding: '0.75rem 1.5rem', background: '#111827', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)', transition: 'all 0.2s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
                    Anar al meu perfil &rarr;
                  </button>
                </>
              )}
            </div>
            {/* Secció Veure exercicis */}
            <div style={{ marginTop: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ width: '240px', height: '300px', background: '#e5e7eb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
                [Imatge anatòmica]
              </div>
              <button
                onClick={() => navegarA('biblioteca')}
                style={{ padding: '0.75rem 2rem', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}
              >
                Veure exercicis
              </button>
            </div>
          </section>
        )}

      </main>
    </div>
  )
}