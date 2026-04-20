'use client'

import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { processarTestDiagnostic } from './utils/lesions'

import Navbar from './components/Navbar'
import LoginForm from './components/LoginForm'
import RegistreForm from './components/RegistreForm'
import PerfilUsuari from './components/PerfilUsuari'
import TestDiagnostic from './components/TestDiagnostic'
import BibliotecaExercicis from './components/BibliotecaExercicis'

import styles from './page.module.css'

export default function Page() {
  const [vistaActual, setVistaActual] = useState('inici')

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
    <div className={styles.container}>

      <Navbar
        vistaActual={vistaActual}
        usuariSessio={usuariSessio}
        onNavegar={navegarA}
        onTornar={() => window.history.back()}
        onTancarSessio={tancarSessio}
      />

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
          <section>
            <h2>Exercici</h2>
            <p className={styles.textMuted}>[Vídeo demostratiu aquí]</p>
            <p className={styles.textMuted}>[Cronòmetre aquí]</p>
            <p className={styles.textMuted}>[Repeticions aquí]</p>
            <p className={styles.textMuted}>[Botó completar aquí]</p>
          </section>
        )}

        {vistaActual === 'biblioteca' && (
          <BibliotecaExercicis onTornar={() => navegarA('inici')} />
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
