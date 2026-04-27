'use client'

import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { processarTestDiagnostic } from './utils/lesions'
import SessioExercici from './components/SessioExercici'


import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import LoginForm from './components/LoginForm'
import RegistreForm from './components/RegistreForm'
import PerfilUsuari from './components/PerfilUsuari'
import TestDiagnostic from './components/TestDiagnostic'
import BibliotecaExercicis from './components/BibliotecaExercicis'
import ExercicisEnCurs from './components/ExercicisEnCurs'

import styles from './page.module.css'

export default function Page() {
  const [vistaActual, setVistaActual] = useState('inici')
  const [exercicisRutina, setExercicisRutina] = useState([])
  const [indexExercici, setIndexExercici] = useState(0)

  const navegarA = (novaVista) => {
    setVistaActual(novaVista)
    window.history.pushState({ vista: novaVista }, '', `#${novaVista}`)
  }

  const {
    usuariSessio, perfilUsuari,
    errorAuth,
    carregantAuth,
    registreForm, setRegistreForm,
    loginForm, setLoginForm,
    registrarUsuari, iniciarSessio, tancarSessio, editarPerfil,
  } = useAuth(navegarA)

  return (
    <div className={`${styles.container} ${usuariSessio ? styles.withSidebar : ''}`}>

      {/* Sidebar: només quan l'usuari ha iniciat sessió */}
      {usuariSessio && (
        <Sidebar
          vistaActual={vistaActual}
          onNavegar={navegarA}
          onTancarSessio={tancarSessio}
        />
      )}

      {/* Navbar: només quan NO ha iniciat sessió */}
      {!usuariSessio && (
        <Navbar
          vistaActual={vistaActual}
          usuariSessio={usuariSessio}
          onNavegar={navegarA}
          onTornar={() => window.history.back()}
          onTancarSessio={tancarSessio}
        />
      )}

      <main className={styles.main}>

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

        {vistaActual === 'perfil' && (
          <PerfilUsuari
            perfilUsuari={perfilUsuari}
            onEditarPerfil={editarPerfil}
          />
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
          <SessioExercici
            exercicis={exercicisRutina}
            indexInicial={indexExercici}
            onCompletarSessio={() => navegarA('exercicis-en-curs')}
          />
        )}

        {vistaActual === 'biblioteca' && (
          <BibliotecaExercicis onTornar={() => navegarA('inici')} />
        )}

        {vistaActual === 'historial' && (
          <section>
            <h2>Historial de lesions</h2>
            <p className={styles.textMuted}>[Historial aquí]</p>
          </section>
        )}

        {vistaActual === 'exercicis-en-curs' && (
          <ExercicisEnCurs
            onNavegar={navegarA}
            onIniciarSessio={(exercicis) => {
              setExercicisRutina(exercicis)
              setIndexExercici(0)
              navegarA('exercici')
            }}
          />
        )}

        {vistaActual === 'inici' && (
          <section className={styles.homeSection}>

            <h1 className={styles.title}>
              Recover<span className={styles.titleAccent}>IT</span>
            </h1>

            <p className={styles.subtitle}>
              La teva plataforma de recuperació guiada i intel·ligent.
            </p>

            <div className={styles.buttonGroup}>
              {!usuariSessio ? (
                <>
                  <button onClick={() => navegarA('login')} className={styles.loginButton}>
                    Iniciar sessió
                  </button>

                  <button onClick={() => navegarA('registre')} className={styles.registerButton}>
                    Registrar-me
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => navegarA('test')} className={styles.testButton}>
                    Tornar a fer el test
                  </button>

                  <button onClick={() => navegarA('perfil')} className={styles.profileButton}>
                    Anar al meu perfil →
                  </button>
                </>
              )}
            </div>

            <div className={styles.imageSection}>
              <div className={styles.imageBox}>
                [Imatge anatòmica]
              </div>

              <button
                onClick={() => navegarA('biblioteca')}
                className={styles.bigButton}
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