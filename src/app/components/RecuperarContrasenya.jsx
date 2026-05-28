'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { showToast } from '../utils/toast'
import {
  esEnllaçRecuperacioContrasenya,
  hashTeTokensAuth,
  parseTokensDelHash,
} from '../utils/recuperacioContrasenya'
import styles from './loginForm.module.css'

async function establirSessioRecuperacio() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) return true

  const tokens = parseTokensDelHash()
  if (!tokens) return false

  const { data, error } = await supabase.auth.setSession(tokens)
  return !error && !!data.session
}

function netejarHashDespresRecuperacio() {
  window.history.replaceState({ vista: 'canviar-contrasenya' }, '', '#canviar-contrasenya')
}

export default function RecuperarContrasenya({ onNavegarLogin }) {
  const [novaContrasenya, setNovaContrasenya] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [missatge, setMissatge] = useState(null)
  const [carregant, setCarregant] = useState(false)
  const [potCanviar, setPotCanviar] = useState(false)
  const [comprovant, setComprovant] = useState(true)

  useEffect(() => {
    let actiu = true

    const activarFormulari = () => {
      if (!actiu) return
      setPotCanviar(true)
      setComprovant(false)
      if (hashTeTokensAuth()) {
        netejarHashDespresRecuperacio()
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sessio) => {
      if (!actiu) return
      if (event === 'PASSWORD_RECOVERY' && sessio) {
        activarFormulari()
      }
    })

    const iniciar = async () => {
      if (await establirSessioRecuperacio()) {
        activarFormulari()
        return
      }

      if (!esEnllaçRecuperacioContrasenya()) {
        if (!actiu) return
        setComprovant(false)
        setMissatge({
          tipus: 'error',
          text: 'Has d\'obrir l\'enllaç del correu de recuperació. Si encara no l\'has rebut, sol·licita\'l des del login.',
        })
        return
      }

      await new Promise((r) => setTimeout(r, 800))
      if (!actiu) return

      if (await establirSessioRecuperacio()) {
        activarFormulari()
        return
      }

      setComprovant(false)
      setMissatge({
        tipus: 'error',
        text: "L'enllaç ha caducat o no és vàlid. Torna al login i sol·licita un correu nou.",
      })
    }

    iniciar()

    return () => {
      actiu = false
      subscription.unsubscribe()
    }
  }, [])

  const guardar = async (e) => {
    e.preventDefault()
    setMissatge(null)

    if (!novaContrasenya || !confirmar) {
      setMissatge({ tipus: 'error', text: 'Omple la nova contrasenya i la confirmació.' })
      return
    }
    if (novaContrasenya.length < 6) {
      setMissatge({ tipus: 'error', text: 'La contrasenya ha de tenir mínim 6 caràcters.' })
      return
    }
    if (novaContrasenya !== confirmar) {
      setMissatge({ tipus: 'error', text: 'Les dues contrasenyes han de ser iguals.' })
      return
    }

    setCarregant(true)
    const { error } = await supabase.auth.updateUser({ password: novaContrasenya })
    setCarregant(false)

    if (error) {
      setMissatge({ tipus: 'error', text: error.message })
      return
    }

    await supabase.auth.signOut()
    setPotCanviar(false)
    setMissatge({
      tipus: 'ok',
      text: 'Contrasenya guardada. Ara pots iniciar sessió amb la nova contrasenya.',
    })
    showToast('Contrasenya actualitzada. Inicia sessió amb la nova contrasenya.', 'success')

    window.history.replaceState({ vista: 'login' }, '', '#login')
    setTimeout(() => onNavegarLogin(), 2500)
  }

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />
      <div className={`${styles.orb} ${styles.orb3}`} />

      <div className={styles.card}>
        <div className={`${styles.header} ${styles.anim} ${styles.anim1}`}>
          <div className={styles.logo}>
            Recover<span>IT</span>
          </div>
          <p className={styles.tagline}>Restablir contrasenya</p>
        </div>

        <div className={styles.content}>
          <h2 className={`${styles.title} ${styles.anim} ${styles.anim2}`}>
            Nova contrasenya
          </h2>
          <p className={`${styles.subtitle} ${styles.anim} ${styles.anim2}`}>
            {comprovant
              ? 'Verificant l\'enllaç del correu...'
              : potCanviar
                ? 'Escriu la nova contrasenya dues vegades i prem Guardar.'
                : 'Segueix les instruccions per recuperar l\'accés.'}
          </p>

          {missatge && (
            <div className={missatge.tipus === 'ok' ? styles.success : styles.error}>
              {missatge.text}
            </div>
          )}

          {potCanviar && missatge?.tipus !== 'ok' && (
            <form onSubmit={guardar}>
              <div className={`${styles.field} ${styles.anim} ${styles.anim3}`}>
                <label htmlFor="nova-contrasenya">Nova contrasenya</label>
                <input
                  id="nova-contrasenya"
                  type="password"
                  value={novaContrasenya}
                  onChange={(e) => setNovaContrasenya(e.target.value)}
                  className={styles.input}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <div className={`${styles.field} ${styles.anim} ${styles.anim4}`}>
                <label htmlFor="confirmar-contrasenya">Confirmar contrasenya</label>
                <input
                  id="confirmar-contrasenya"
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  className={styles.input}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <div className={`${styles.anim} ${styles.anim5}`}>
                <button type="submit" className={styles.button} disabled={carregant}>
                  {carregant ? (
                    <span className={styles.loadingDots}>
                      <span /><span /><span />
                    </span>
                  ) : (
                    'Guardar contrasenya'
                  )}
                </button>
              </div>
            </form>
          )}

          <button
            type="button"
            className={styles.forgotLink}
            onClick={onNavegarLogin}
            style={{ marginTop: '1rem' }}
          >
            Tornar al login
          </button>
        </div>
      </div>
    </div>
  )
}
