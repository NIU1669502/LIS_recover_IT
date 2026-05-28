'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from './hooks/useAuth'
import { processarTestDiagnostic } from './utils/lesions'
import SessioExercici from './components/SessioExercici'
import ToastContainer from './components/ToastContainer'

import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import LoginForm from './components/LoginForm'
import RegistreForm from './components/RegistreForm'
import RecuperarContrasenya from './components/RecuperarContrasenya'
import { esEnllaçRecuperacioContrasenya } from './utils/recuperacioContrasenya'
import PerfilUsuari from './components/PerfilUsuari'
import TestDiagnostic from './components/TestDiagnostic'
import BibliotecaExercicis from './components/BibliotecaExercicis'
import ExercicisEnCurs from './components/ExercicisEnCurs'
import HistorialDiagnostics from './components/HistorialDiagnostics'
import HistorialSessions from './components/HistorialSessions'
import XatPacient from './components/XatPacient'
import ObjectiusPacient from './components/ObjectiusPacient'
import imatgeAnatomica from './data/Imatge_anatomica.png'

import PanellFisio from './components/PanellFisio'
import LlistaPacients from './components/LlistaPacients'
import XatFisio from './components/XatFisio'

import OverlayAnatomic from './components/OverlayAnatomic'
import { useRelacioFisioConfirmada } from './hooks/useRelacioFisio'

import styles from './page.module.css'

export default function Page() {
  const [vistaActual, setVistaActual] = useState('inici')
  const [exercicisRutina, setExercicisRutina] = useState([])
  const [indexExercici, setIndexExercici] = useState(0)
  const [faseActual, setFaseActual] = useState(1)
  const [pageVisible, setPageVisible] = useState(true)
  const transitionRef = useRef(null)
  const lastDiagIndexRef = useRef(-1)
  const [musculActual, setMusculActual] = useState({ id_cos: 0, nom: '' })
  const [idDiagnosticSessio, setIdDiagnosticSessio] = useState(null)
  const [idDiagnosticFiltreHistorial, setIdDiagnosticFiltreHistorial] = useState(null)
  const [idDiagnosticPreseleccionat, setIdDiagnosticPreseleccionat] = useState(null)
  const [rutinaAvui, setRutinaAvui] = useState(null)
  const [carregantRutina, setCarregantRutina] = useState(false)
  const [refreshProgres, setRefreshProgres] = useState(0)

  const navegarA = (novaVista, onTransition, opcions = {}) => {
    if (transitionRef.current) clearTimeout(transitionRef.current)
    setPageVisible(false)
    transitionRef.current = setTimeout(() => {
      if (onTransition) onTransition()
      setErrorAuth('')
      setVistaActual(novaVista)
      const hashUrl = opcions.preservarHash && typeof window !== 'undefined'
        ? (window.location.hash || `#${novaVista}`)
        : `#${novaVista}`
      window.history.pushState({ vista: novaVista }, '', hashUrl)
      setPageVisible(true)
    }, 220)
  }

  const {
    usuariSessio, perfilUsuari,
    errorAuth, setErrorAuth,
    carregantAuth,
    registreForm, setRegistreForm,
    loginForm, setLoginForm,
    registrarUsuari, iniciarSessio, tancarSessio, editarPerfil, obtenirPerfil
  } = useAuth(navegarA)

  useEffect(() => {
    if (!esEnllaçRecuperacioContrasenya()) return
    setVistaActual('canviar-contrasenya')
    const hashActual = window.location.hash
    const hashSegur = hashActual && hashActual.includes('access_token')
      ? hashActual
      : '#canviar-contrasenya'
    window.history.replaceState({ vista: 'canviar-contrasenya' }, '', hashSegur)
  }, [])

  useEffect(() => {
    if (vistaActual === 'perfil' && usuariSessio) {
      obtenirPerfil(usuariSessio)
    }
  }, [vistaActual])

  useEffect(() => {
    let isSubscribed = true
    if (vistaActual === 'inici' && perfilUsuari?.dni && perfilUsuari?.es_fisioterapeuta !== true) {
      setCarregantRutina(true)
      import('./utils/lesions').then(({ getDiagnosticsActius, getExercicisDelaFase }) => {
        import('../utils/supabase').then(({ supabase }) => {
          getDiagnosticsActius(perfilUsuari.dni).then(async (listRaw) => {
            if (!isSubscribed) return
            if (!listRaw || listRaw.length === 0) {
              setRutinaAvui(null)
              setCarregantRutina(false)
              return
            }

            let nextIndex = 0
            if (listRaw.length > 1) {
              nextIndex = (lastDiagIndexRef.current + 1) % listRaw.length
            }
            lastDiagIndexRef.current = nextIndex
            const diag = listRaw[nextIndex]

            const [{ data: lesio }, { data: muscul }, exs] = await Promise.all([
              supabase.from('lesions').select('nom').eq('id_lesio', diag.id_lesio).single(),
              supabase.from('musculs').select('nom').eq('id_cos', diag.part_cos).single(),
              getExercicisDelaFase(diag)
            ])

            if (isSubscribed) {
              const nomComplet = muscul && muscul.nom
                ? `${lesio?.nom || 'Lesió'} de ${muscul.nom.toLowerCase()}`
                : (lesio?.nom || 'Lesió')

              const tempsTotalSegons = exs.reduce((acc, curr) => acc + ((curr.duracio_segons || 0) * (curr.Repeticions || 1)), 0)
              const mins = Math.ceil(tempsTotalSegons / 60)

              setRutinaAvui({
                nomLesio: nomComplet,
                numExercicis: exs.length,
                minuts: mins > 0 ? mins : 1,
                diagnostic: diag
              })
              setCarregantRutina(false)
            }
          })
        })
      })
    }
    return () => { isSubscribed = false }
  }, [vistaActual, perfilUsuari])

  const esFisio = perfilUsuari?.es_fisioterapeuta === true
  const dniPacient = !esFisio ? perfilUsuari?.dni : null
  const { teFisio, relacio, carregant: carregantRelacioFisio } = useRelacioFisioConfirmada(dniPacient)
  const esPantallaAuth =
    vistaActual === 'login' ||
    vistaActual === 'registre' ||
    vistaActual === 'canviar-contrasenya'

  return (
    <div className={`${styles.container} ${usuariSessio ? styles.withSidebar : ''}`}>
      <div
        style={{
          opacity: pageVisible ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
          minHeight: '100vh'
        }}
      >
        {usuariSessio && (
          <Sidebar
            vistaActual={vistaActual}
            onNavegar={(vista) => {
              if (vista === 'historial') setIdDiagnosticFiltreHistorial(null)
              if (vista === 'exercicis-en-curs') setIdDiagnosticPreseleccionat(null)
              navegarA(vista)
            }}
            onTancarSessio={tancarSessio}
            esFisio={esFisio}
            perfilUsuari={perfilUsuari}
            teFisio={teFisio}
          />
        )}

        {!usuariSessio && (
          <Navbar
            vistaActual={vistaActual}
            usuariSessio={usuariSessio}
            onNavegar={navegarA}
            onTornar={() => window.history.back()}
            onTancarSessio={tancarSessio}
          />
        )}

        <main key={vistaActual} className={`${esPantallaAuth ? styles.mainFull : styles.main} ${styles.pageEnter}`}>

          

          {vistaActual === 'login' && (
            <LoginForm
              loginForm={loginForm}
              setLoginForm={setLoginForm}
              onSubmit={iniciarSessio}
              errorAuth={errorAuth}
              carregantAuth={carregantAuth}
            />
          )}

          {vistaActual === 'registre' && (
            <RegistreForm
              registreForm={registreForm}
              setRegistreForm={setRegistreForm}
              onSubmit={registrarUsuari}
              errorAuth={errorAuth}
              carregantAuth={carregantAuth}
            />
          )}

          {vistaActual === 'canviar-contrasenya' && (
            <RecuperarContrasenya
              onNavegarLogin={() => navegarA('login')}
            />
          )}

          {vistaActual === 'perfil' && (
            <PerfilUsuari
              perfilUsuari={perfilUsuari}
              onEditarPerfil={editarPerfil}
            />
          )}

          

          {vistaActual === 'inici-fisio' && (
            <PanellFisio
              perfilUsuari={perfilUsuari}
              onNavegar={navegarA}
            />
          )}

          {vistaActual === 'pacients' && (
            <LlistaPacients
              perfilUsuari={perfilUsuari}
            />
          )}

          {vistaActual === 'xat-fisio' && (
            <XatFisio perfilUsuari={perfilUsuari} />
          )}

          

          {vistaActual === 'test' && (
            <section className={styles.testSection}>
              <div className={styles.testHeader}>
                <div className={styles.testIconBox}>
                  <span className={styles.testIcon}>🩺</span>
                </div>
                <h2 className={styles.testTitle}>Test diagnòstic</h2>
              </div>
              <TestDiagnostic
                onGuardar={(resultat) => processarTestDiagnostic(resultat, navegarA)}
                onCancel={() => navegarA('inici')}
              />
            </section>
          )}

          {vistaActual === 'exercici' && (
            <div className={styles.exerciciMain}>
              <SessioExercici
                exercicis={exercicisRutina}
                indexInicial={indexExercici}
                fase={faseActual}
                musculActual={musculActual}
                idDiagnostic={idDiagnosticSessio}
                onCompletarSessio={() => navegarA('exercicis-en-curs')}
              />
            </div>
          )}

          {vistaActual === 'biblioteca' && (
            <BibliotecaExercicis onTornar={() => navegarA('inici')} />
          )}

          {vistaActual === 'progres' && (
            <HistorialDiagnostics
              perfilUsuari={perfilUsuari}
              onNavegar={navegarA}
              onPreseleccionarDiagnostic={(id) => setIdDiagnosticPreseleccionat(id)}
              onVeureHistorialSessions={(idDiagnostic) => {
                setIdDiagnosticFiltreHistorial(idDiagnostic)
                navegarA('historial')
              }}
              onEsborrarDiagnostic={async (idDiagnostic) => {
                const { eliminarDiagnostic } = await import('./utils/lesions')
                await eliminarDiagnostic(idDiagnostic)
                setRefreshProgres((r) => r + 1)
              }}
              refreshNonce={refreshProgres}
            />
          )}

          {vistaActual === 'historial' && (
            <HistorialSessions
              perfilUsuari={perfilUsuari}
              idDiagnosticFiltre={idDiagnosticFiltreHistorial}
              onClearFiltreHistorial={() => setIdDiagnosticFiltreHistorial(null)}
            />
          )}

          {vistaActual === 'xat' && (
            <XatPacient
              perfilUsuari={perfilUsuari}
              relacio={relacio}
              carregantRelacio={carregantRelacioFisio}
            />
          )}

          {vistaActual === 'exercicis-en-curs' && (
            <ExercicisEnCurs
              onNavegar={navegarA}
              onIniciarSessio={(exercicis, fase, muscul, idDiagnostic) => {
                setExercicisRutina(exercicis)
                setFaseActual(fase)
                setIndexExercici(0)
                setMusculActual(muscul)
                setIdDiagnosticSessio(idDiagnostic ?? null)
                navegarA('exercici')
              }}
              perfilUsuari={perfilUsuari}
              idDiagnosticInicial={idDiagnosticPreseleccionat}
            />
          )}

          {vistaActual === 'inici' && (
            <>
              {!usuariSessio ? (
                <section className={styles.homeSection}>
                  <div className={styles.homeContent}>
                    <h1 className={styles.title}>
                      Recover<span className={styles.titleAccent}>IT</span>
                    </h1>
                    <p className={styles.subtitle}>
                      La teva plataforma de recuperació guiada i intel·ligent. Torna a moure&apos;t amb confiança gràcies a rutines dissenyades exclusivament per a tu.
                    </p>
                    <div className={styles.heroActions}>
                      <div className={styles.primaryActions}>
                        <button onClick={() => navegarA('registre')} className={styles.loginButton}>
                          Registrar-me
                        </button>
                        <button onClick={() => navegarA('login')} className={styles.registerButton}>
                          Iniciar Sessió
                        </button>
                      </div>

                      <div className={styles.secondaryActionBox}>
                        <p className={styles.actionHint}>Vols veure com funciona abans?</p>
                        <button
                          onClick={() => navegarA('biblioteca')}
                          className={styles.textLinkButton}
                          style={{ marginTop: 0, fontSize: '1.1rem' }}
                        >
                          Explorar la biblioteca d&apos;exercicis &rarr;
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.homeVisual}>
                    <div className={styles.imageBox}>
                      <img
                        src={imatgeAnatomica.src}
                        alt="Imatge anatòmica d'una persona"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                </section>
              ) : (
                <section className={styles.dashboardContainer}>
                  <div className={styles.dashboardHeader}>
                    <div className={styles.welcomeMessage}>
                      <h1 className={styles.dashboardTitle}>
                        Benvingut de nou, <span className={styles.highlightName}>{perfilUsuari?.nom || 'Usuari'}</span>!
                      </h1>
                      <p className={styles.dashboardSubtitle}>
                        És un plaer tenir-te aquí. Continuem treballant junts per la teva recuperació. Escolta el teu cos, pren el teu temps i anem a donar-ho tot avui.
                        {rutinaAvui && ` Avui tens ${rutinaAvui.numExercicis} exercicis programats. Dedica-li ${rutinaAvui.minuts} minuts a la teva salut.`}
                      </p>
                    </div>
                  </div>

                  <div className={styles.dashboardGrid}>
                    
                    <div className={styles.anatomyCard}>
                      <img
                        src={imatgeAnatomica.src}
                        alt="Imatge anatomica"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', zIndex: 1 }}
                      />
                      {!esFisio && (
                        <OverlayAnatomic perfilUsuari={perfilUsuari} />
                      )}
                    </div>

                    <div className={styles.widgetsColumn}>
                      <div className={styles.actionCardPrimary}>
                        {carregantRutina ? (
                          <div className={styles.actionCardContent}>
                            <h3>Carregant rutina...</h3>
                          </div>
                        ) : rutinaAvui ? (
                          <>
                            <div className={styles.actionCardContent}>
                              <h3>Iniciar Sessió d&apos;avui</h3>
                              <p>Rutina: {rutinaAvui.nomLesio}</p>
                              <span className={styles.actionCardMeta}>{rutinaAvui.minuts} min | {rutinaAvui.numExercicis} exercicis</span>
                            </div>
                            <button className={styles.actionButtonPrimary} onClick={() => {
                              setIdDiagnosticPreseleccionat(rutinaAvui.diagnostic.id_diagnostic)
                              navegarA('exercicis-en-curs')
                            }}>
                              Començar Ara
                            </button>
                          </>
                        ) : (
                          <>
                            <div className={styles.actionCardContent}>
                              <h3>Cap rutina activa</h3>
                              <p>Fes un test diagnòstic per obtenir una rutina.</p>
                            </div>
                            <button className={styles.actionButtonPrimary} onClick={() => navegarA('test')}>
                              Realitzar Test
                            </button>
                          </>
                        )}
                      </div>

                      <div className={styles.actionCardSecondary}>
                        <div className={styles.actionCardIcon}>📋</div>
                        <div className={styles.actionCardContent}>
                          <h3>¿Vols realitzar un nou diagnòstic?</h3>
                          <p>Realitza el test de diagnostic per obtenir una nova rutina.</p>
                          <button className={styles.textLinkButton} onClick={() => navegarA('test')}>
                            Realitzar Test
                          </button>
                        </div>
                      </div>

                      {/* Objectius del pacient */}
                      {!esFisio && perfilUsuari?.dni && (
                        <ObjectiusPacient dniPacient={perfilUsuari.dni} />
                      )}
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

        </main>
      </div>
    </div>
  )
}