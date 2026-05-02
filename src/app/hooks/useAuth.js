import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { showToast } from '../utils/toast'

// ============================================================
// Hook personalitzat que centralitza tota la lògica d'autenticació
// ============================================================
export function useAuth(navegarA) {
    const [usuariSessio, setUsuariSessio] = useState(null)
    const [perfilUsuari, setPerfilUsuari] = useState(null)
    const [errorAuth, setErrorAuth] = useState('')
    const [carregantAuth, setCarregantAuth] = useState(false)
    const [registreForm, setRegistreForm] = useState({ nom: '', dni: '', email: '', password: '' })
    const [loginForm, setLoginForm] = useState({ email: '', password: '' })

    // ── Determina on navegar segons el tipus d'usuari ────────
    const navegarSegunsTipus = async (user, perfilData) => {
        const esFisio = perfilData?.es_fisioterapeuta === true

        if (esFisio) {
            navegarA('inici-fisio')
            return
        }

        // Pacient: comprovar si té diagnòstic
        const { data: diagnostic } = await supabase
            .from('diagnostic')
            .select('dni_pacient')
            .eq('dni_pacient', user.user_metadata?.dni)
            .maybeSingle()

        navegarA(diagnostic ? 'inici' : 'test')
    }

    // ── RF-AUTH-09 — Obtenir perfil ──────────────────────────
    const obtenirPerfil = async (userParam) => {
        const user = userParam || usuariSessio
        const dni = user?.user_metadata?.dni
        if (!dni) {
            setPerfilUsuari(null)
            return null
        }

        const { data, error } = await supabase
            .from('usuaris')
            .select('*')
            .eq('dni', dni)
            .maybeSingle()

        if (error) {
            setErrorAuth(error.message)
            return null
        }

        setPerfilUsuari(data || null)
        return data || null
    }

    // ── RF-AUTH-05 — Mantenir sessió ─────────────────────────
    const comprovarSessio = async () => {
        const { data, error } = await supabase.auth.getSession()
        if (error) return

        const user = data.session?.user ?? null
        setUsuariSessio(user)
        if (user) {
            const perfil = await obtenirPerfil(user)
            await navegarSegunsTipus(user, perfil)
        }
    }

    useEffect(() => {
        const manejarPopState = (event) => {
            if (event.state && event.state.vista) {
                navegarA(event.state.vista)
            } else {
                navegarA('inici')
            }
        }

        window.addEventListener('popstate', manejarPopState)
        if (!window.history.state) {
            window.history.replaceState({ vista: 'inici' }, '')
        }
        comprovarSessio()

        return () => window.removeEventListener('popstate', manejarPopState)
    }, [])

    // ── RF-AUTH-01 — Registre ────────────────────────────────
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
                options: { data: { dni, nom, es_fisioterapeuta: false } },
            })

            if (signUpError) { setErrorAuth(signUpError.message); return }

            const { error: upsertError } = await supabase
                .from('usuaris')
                .upsert({ dni, nom, es_fisioterapeuta: false }, { onConflict: 'dni' })

            if (upsertError) {
                setErrorAuth(`Usuari creat a Auth però no guardat a usuaris: ${upsertError.message}`)
                return
            }

            if (signUpData.session?.user) {
                const user = signUpData.session.user
                const { data: perfilData } = await supabase.from('usuaris').select('*').eq('dni', user.user_metadata.dni).maybeSingle()
                navegarA('test', () => {
                    setUsuariSessio(user)
                    setPerfilUsuari(perfilData || null)
                })
            } else {
                navegarA('login')
                showToast('Compte creat! Verifica el teu email abans d\'iniciar sessió. Revisa la carpeta de Spam si cal.', 'success')
            }
        } catch (err) {
            setErrorAuth(err.message || 'Error inesperat al registrar usuari.')
        } finally {
            setCarregantAuth(false)
        }
    }

    // ── RF-AUTH-02 — Inici de sessió ─────────────────────────
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
            const { data, error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error
            const user = data.user
            const { data: perfilData } = await supabase
                .from('usuaris')
                .select('*')
                .eq('dni', user.user_metadata.dni)
                .maybeSingle()

            const esFisio = perfilData?.es_fisioterapeuta === true

            if (esFisio) {
                navegarA('inici-fisio', () => {
                    setUsuariSessio(user)
                    setPerfilUsuari(perfilData || null)
                    showToast(`Benvingut/da, Dr./Dra. ${perfilData?.nom || ''}`, 'success')
                })
            } else {
                const { data: diagnostic } = await supabase
                    .from('diagnostic')
                    .select('dni_pacient')
                    .eq('dni_pacient', user.user_metadata.dni)
                    .maybeSingle()

                navegarA(diagnostic ? 'inici' : 'test', () => {
                    setUsuariSessio(user)
                    setPerfilUsuari(perfilData || null)
                    showToast(`Benvingut/da ${user.user_metadata?.nom || ''}`, 'success')
                })
            }
        } catch (err) {
            setErrorAuth(err.message || 'Error inesperat en iniciar sessió.')
        } finally {
            setCarregantAuth(false)
        }
    }

    const tancarSessio = async () => {
        await supabase.auth.signOut()
        const nomUsuari = perfilUsuari?.nom || ''
        navegarA('inici', () => {
            setUsuariSessio(null)
            setPerfilUsuari(null)
            setErrorAuth('')
            showToast(`Has tancat la sessió, ${nomUsuari}. Esperem tornar a veure't aviat!`, 'info')
        })
    }

    // ── RF-AUTH-10 — Editar perfil ───────────────────────────
    const editarPerfil = async (nomEditat) => {
        if (!perfilUsuari?.dni || !nomEditat?.trim()) return

        const { error } = await supabase
            .from('usuaris')
            .update({ nom: nomEditat.trim() })
            .eq('dni', perfilUsuari.dni)

        if (error) {
            showToast(`No s'ha pogut actualitzar el perfil: ${error.message}`, 'error')
            return
        }

        await obtenirPerfil()
        showToast('Perfil actualitzat correctament.', 'success')
    }

    return {
        // Estat
        usuariSessio,
        perfilUsuari,
        errorAuth,
        setErrorAuth,
        carregantAuth,
        registreForm,
        setRegistreForm,
        loginForm,
        setLoginForm,
        // Accions
        registrarUsuari,
        iniciarSessio,
        tancarSessio,
        editarPerfil,
    }
}