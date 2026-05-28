import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { showToast } from '../utils/toast'
import { validarDniNouUsuari, validarEmailNouUsuari } from '../utils/validacioRegistre'
import { esEnllaçRecuperacioContrasenya } from '../utils/recuperacioContrasenya'

export function useAuth(navegarA) {
    const [usuariSessio, setUsuariSessio] = useState(null)
    const [perfilUsuari, setPerfilUsuari] = useState(null)
    const [errorAuth, setErrorAuth] = useState('')
    const [carregantAuth, setCarregantAuth] = useState(false)
    const [registreForm, setRegistreForm] = useState({ nom: '', dni: '', email: '', password: '' })
    const [loginForm, setLoginForm] = useState({ email: '', password: '' })

    const navegarSegunsTipus = async (user, perfilData) => {
        const esFisio = perfilData?.es_fisioterapeuta === true

        if (esFisio) {
            navegarA('inici-fisio')
            return
        }

        const { data: diagnostic } = await supabase
            .from('diagnostic')
            .select('dni_pacient')
            .eq('dni_pacient', user.user_metadata?.dni)
            .eq('finalitzat', false)
            .limit(1)
            .maybeSingle()

        navegarA(diagnostic ? 'inici' : 'test')
    }

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

        const { data: diagnosticsActius } = await supabase
            .from('diagnostic')
            .select('punts_recuperacio, puntsFinals')
            .eq('dni_pacient', dni)
            .eq('finalitzat', false)

        const puntsRecuperacioTotal = (diagnosticsActius ?? []).reduce(
            (acc, row) => acc + Number(row.punts_recuperacio ?? 0),
            0
        )
        const puntsFinalsTotal = (diagnosticsActius ?? []).reduce(
            (acc, row) => acc + Number(row.puntsFinals ?? 0),
            0
        )

        const perfil = data ? {
            ...data,
            punts_recuperacio: puntsRecuperacioTotal,
            puntsFinals: puntsFinalsTotal,
        } : null

        setPerfilUsuari(perfil)
        return perfil
    }

    const comprovarSessio = async () => {
        if (esEnllaçRecuperacioContrasenya()) {
            navegarA('canviar-contrasenya', undefined, { preservarHash: true })
            return
        }

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

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                navegarA('canviar-contrasenya', undefined, { preservarHash: true })
            }
        })

        return () => {
            window.removeEventListener('popstate', manejarPopState)
            subscription.unsubscribe()
        }
    }, [])

    // Canal de perfil apart per no petar el subscribe de Supabase
    useEffect(() => {
        const dni = usuariSessio?.user_metadata?.dni
        if (!dni) return

        const canalDiag = supabase
            .channel(`perfil-diagnostic-${dni}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'diagnostic', filter: `dni_pacient=eq.${dni}` },
                () => obtenirPerfil(usuariSessio)
            )
            .subscribe()

        return () => {
            supabase.removeChannel(canalDiag)
        }
    }, [usuariSessio?.user_metadata?.dni])

    const registrarUsuari = async () => {
        const nom = registreForm.nom.trim()
        const dni = registreForm.dni.trim()
        const email = registreForm.email.trim()
        const password = registreForm.password

        if (!nom || !dni || !email || !password) {
            setErrorAuth('Omple nom, DNI, email i contrasenya per registrar-te.')
            return
        }

        const validacioDni = validarDniNouUsuari(dni)
        if (!validacioDni.valid) {
            setErrorAuth(validacioDni.error)
            return
        }

        const validacioEmail = validarEmailNouUsuari(email)
        if (!validacioEmail.valid) {
            setErrorAuth(validacioEmail.error)
            return
        }

        const dniNormalitzat = validacioDni.dniNormalitzat
        const emailNormalitzat = validacioEmail.email

        setErrorAuth('')
        setCarregantAuth(true)
        try {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: emailNormalitzat,
                password,
                options: { data: { dni: dniNormalitzat, nom, es_fisioterapeuta: false } },
            })

            if (signUpError) { setErrorAuth(signUpError.message); return }

            const { error: upsertError } = await supabase
                .from('usuaris')
                .upsert({ dni: dniNormalitzat, nom, es_fisioterapeuta: false }, { onConflict: 'dni' })

            if (upsertError) {
                setErrorAuth(`Usuari creat a Auth però no guardat a usuaris: ${upsertError.message}`)
                return
            }

            if (signUpData.session?.user) {
                const user = signUpData.session.user
                const { data: perfilData } = await supabase
                    .from('usuaris')
                    .select('*')
                    .eq('dni', user.user_metadata.dni)
                    .maybeSingle()

                const perfil = perfilData ? { ...perfilData, punts_recuperacio: 0, puntsFinals: 0 } : null

                navegarA('test', () => {
                    setUsuariSessio(user)
                    setPerfilUsuari(perfil)
                })
            } else {
                navegarA('login')
                showToast("Compte creat! Verifica el teu email abans d'iniciar sessió. Revisa la carpeta de Spam si cal.", 'success')
            }
        } catch (err) {
            setErrorAuth(err.message || 'Error inesperat al registrar usuari.')
        } finally {
            setCarregantAuth(false)
        }
    }

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

            const perfil = await obtenirPerfil(user)

            const esFisio = perfil?.es_fisioterapeuta === true

            if (esFisio) {
                navegarA('inici-fisio', () => {
                    setUsuariSessio(user)
                    showToast(`Benvingut/da, Dr./Dra. ${perfil?.nom || ''}`, 'success')
                })
            } else {
                const { data: diagnostic } = await supabase
                    .from('diagnostic')
                    .select('id_diagnostic')
                    .eq('dni_pacient', user.user_metadata.dni)
                    .eq('finalitzat', false)
                    .limit(1)
                    .maybeSingle()

                navegarA(diagnostic ? 'inici' : 'test', () => {
                    setUsuariSessio(user)
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
        usuariSessio,
        perfilUsuari,
        errorAuth,
        setErrorAuth,
        carregantAuth,
        registreForm,
        setRegistreForm,
        loginForm,
        setLoginForm,
        registrarUsuari,
        iniciarSessio,
        tancarSessio,
        editarPerfil,
        obtenirPerfil,
    }
}