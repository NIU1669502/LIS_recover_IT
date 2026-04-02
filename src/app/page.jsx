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

// ============================================================
// Pàgina principal — Router de vistes
// Vistes: 'inici' | 'login' | 'registre' | 'perfil' | 'test' | 'exercici' | 'biblioteca'
// ============================================================
export default function Page() {
  const [vistaActual, setVistaActual] = useState('inici')

  const navegarA = (novaVista) => {
    setVistaActual(novaVista)
    window.history.pushState({ vista: novaVista }, '', `#${novaVista}`)
  }

  const {
    usuariSessio, perfilUsuari,
    errorAuth, setErrorAuth,
    carregantAuth,
    registreForm, setRegistreForm,
    loginForm, setLoginForm,
    registrarUsuari, iniciarSessio, tancarSessio, editarPerfil,
  } = useAuth(navegarA)

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', color: '#111827', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      <Navbar
        vistaActual={vistaActual}
        usuariSessio={usuariSessio}
        onNavegar={navegarA}
        onTornar={() => window.history.back()}
        onTancarSessio={tancarSessio}
      />

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>

        {/* ── LOGIN ────────────────────────────────────────── */}
        {vistaActual === 'login' && (
          <LoginForm
            loginForm={loginForm}
            setLoginForm={setLoginForm}
            onSubmit={iniciarSessio}
            errorAuth={errorAuth}
            carregantAuth={carregantAuth}
          />
        )}

        {/* ── REGISTRE ─────────────────────────────────────── */}
        {vistaActual === 'registre' && (
          <RegistreForm
            registreForm={registreForm}
            setRegistreForm={setRegistreForm}
            onSubmit={registrarUsuari}
            errorAuth={errorAuth}
            carregantAuth={carregantAuth}
          />
        )}

        {/* ── PERFIL ───────────────────────────────────────── */}
        {vistaActual === 'perfil' && (
          <PerfilUsuari
            perfilUsuari={perfilUsuari}
            onEditarPerfil={editarPerfil}
          />
        )}

        {/* ── TEST DIAGNÒSTIC ──────────────────────────────── */}
        {vistaActual === 'test' && (
          <section style={{ marginTop: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: '3.5rem', height: '3.5rem', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', boxShadow: '0 2px 4px rgba(59,130,246,0.1)' }}>
                <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>🩺</span>
              </div>
              <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Test diagnòstic</h2>
            </div>
            <TestDiagnostic
              onGuardar={(resultat) => processarTestDiagnostic(resultat, navegarA)}
              onCancel={() => navegarA('inici')}
            />
          </section>
        )}

        {/* ── EXERCICI ─────────────────────────────────────── */}
        {vistaActual === 'exercici' && (
          <section>
            <h2>Exercici</h2>
            <p style={{ color: '#4b5063' }}>[Vídeo demostratiu aquí]</p>
            <p style={{ color: '#4b5063' }}>[Cronòmetre aquí]</p>
            <p style={{ color: '#4b5063' }}>[Repeticions aquí]</p>
            <p style={{ color: '#4b5063' }}>[Botó completar aquí]</p>
          </section>
        )}

        {/* ── BIBLIOTECA ───────────────────────────────────── */}
        {vistaActual === 'biblioteca' && (
          <BibliotecaExercicis onTornar={() => navegarA('inici')} />
        )}

        {/* ── INICI ────────────────────────────────────────── */}
        {vistaActual === 'inici' && (
          <section style={{ textAlign: 'center', paddingTop: '4rem' }}>
            <h1 style={{ color: '#111827', fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.025em' }}>
              Recover<span style={{ color: '#3b82f6' }}>IT</span>
            </h1>
            <p style={{ color: '#4b5563', fontSize: '1.125rem', marginBottom: '3rem' }}>
              La teva plataforma de recuperació guiada i intel·ligent.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {!usuariSessio ? (
                <>
                  <button onClick={() => navegarA('login')} style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(59,130,246,0.3)', transition: 'all 0.2s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
                    Iniciar sessió
                  </button>
                  <button onClick={() => navegarA('registre')} style={{ padding: '0.75rem 1.5rem', background: '#ffffff', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
                    Registrar-me
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => navegarA('test')} style={{ padding: '0.75rem 1.5rem', background: '#ffffff', color: '#111827', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }} onMouseOver={e => e.target.style.background = '#f3f4f6'} onMouseOut={e => e.target.style.background = '#ffffff'}>
                    Tornar a fer el test
                  </button>
                  <button onClick={() => navegarA('perfil')} style={{ padding: '0.75rem 1.5rem', background: '#111827', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)', transition: 'all 0.2s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
                    Anar al meu perfil &rarr;
                  </button>
                </>
              )}
            </div>

            <div style={{ marginTop: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ width: '240px', height: '300px', background: '#e5e7eb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
                [Imatge anatòmica]
              </div>
              <button
                onClick={() => navegarA('biblioteca')}
                style={{ padding: '0.75rem 2rem', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(59,130,246,0.3)' }}
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
