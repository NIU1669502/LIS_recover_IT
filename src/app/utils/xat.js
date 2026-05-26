import { supabase } from '../../utils/supabase'

const MAX_LEN = 2000

export async function getRelacioXatPacient(dniPacient) {
    if (!dniPacient) return null

    const { data: relacio, error } = await supabase
        .from('relacio_fisio_pacient')
        .select('dni_fisio, dni_pacient, confirmat')
        .eq('dni_pacient', dniPacient)
        .eq('confirmat', true)
        .maybeSingle()

    if (error || !relacio) return null

    const { data: fisio } = await supabase
        .from('usuaris')
        .select('nom')
        .eq('dni', relacio.dni_fisio)
        .maybeSingle()

    return {
        dni_fisio: relacio.dni_fisio,
        dni_pacient: relacio.dni_pacient,
        nomFisio: fisio?.nom || 'Fisioterapeuta',
    }
}

export async function getConversesFisio(dniFisio) {
    if (!dniFisio) return []

    const { data: relacions, error } = await supabase
        .from('relacio_fisio_pacient')
        .select('dni_pacient')
        .eq('dni_fisio', dniFisio)
        .eq('confirmat', true)

    if (error || !relacions?.length) return []

    const dnisPacients = relacions.map(r => r.dni_pacient)

    const [{ data: usuaris }, { data: missatges }] = await Promise.all([
        supabase.from('usuaris').select('dni, nom').in('dni', dnisPacients),
        supabase
            .from('missatges_xat')
            .select('dni_pacient, contingut, enviat_en, remitent_dni')
            .eq('dni_fisio', dniFisio)
            .in('dni_pacient', dnisPacients)
            .order('enviat_en', { ascending: false }),
    ])

    const nomPerDni = Object.fromEntries((usuaris || []).map(u => [u.dni, u.nom]))
    const ultimPerPacient = {}

    ;(missatges || []).forEach(m => {
        if (!ultimPerPacient[m.dni_pacient]) {
            ultimPerPacient[m.dni_pacient] = m
        }
    })

    return dnisPacients
        .map(dni => ({
            dni_pacient: dni,
            nom: nomPerDni[dni] || 'Pacient',
            dni_fisio: dniFisio,
            ultimMissatge: ultimPerPacient[dni] || null,
        }))
        .sort((a, b) => {
            const ta = a.ultimMissatge?.enviat_en || ''
            const tb = b.ultimMissatge?.enviat_en || ''
            return tb.localeCompare(ta)
        })
}

export async function fetchMissatgesXat(dniFisio, dniPacient) {
    return supabase
        .from('missatges_xat')
        .select('id_missatge, dni_fisio, dni_pacient, remitent_dni, contingut, enviat_en')
        .eq('dni_fisio', dniFisio)
        .eq('dni_pacient', dniPacient)
        .order('enviat_en', { ascending: true })
}

export async function enviarMissatgeXat({ dniFisio, dniPacient, remitentDni, contingut }) {
    const text = (contingut || '').trim()
    if (!text) {
        return { ok: false, missatge: 'Escriu un missatge abans d\'enviar.' }
    }
    if (text.length > MAX_LEN) {
        return { ok: false, missatge: `El missatge no pot superar ${MAX_LEN} caràcters.` }
    }

    const { error } = await supabase
        .from('missatges_xat')
        .insert([{
            dni_fisio: dniFisio,
            dni_pacient: dniPacient,
            remitent_dni: remitentDni,
            contingut: text,
        }])

    if (error) {
        return { ok: false, missatge: error.message }
    }
    return { ok: true }
}

export { MAX_LEN as MAX_MISSATGE_XAT }
