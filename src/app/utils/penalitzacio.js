import { supabase } from '../../utils/supabase'

const HORES_PENALITZACIO = 72
const MS_PENALITZACIO = HORES_PENALITZACIO * 60 * 60 * 1000

export async function comprovarIAplicarPenalitzacio(userDni, idDiagnostic) {
    const { data: sessions, error } = await supabase
        .from('historial_sessions')
        .select('id_sessio, punts_obtinguts, data_realitzacio, penalitzat')
        .eq('dni_pacient', userDni)
        .eq('id_diagnostic', idDiagnostic)
        .order('data_realitzacio', { ascending: false })

    if (error || !sessions || sessions.length === 0) {
        return { penalitzat: false }
    }

    const ultimaSessio = sessions[0]
    const ara = new Date()
    const dataUltimaSessio = new Date(ultimaSessio.data_realitzacio)
    
    const diesPassats = Math.floor((ara - dataUltimaSessio) / (1000 * 60 * 60 * 24))

    let esperades = Math.max(0, diesPassats - 2)
    esperades = Math.min(esperades, sessions.length)

    if (esperades === 0) {
        return { penalitzat: false }
    }

    let sessionsAPenalitzarAra = []
    let puntsTotalsARestar = 0
    let puntsTotalsPenalitzats = 0
    let totalSessionsADescomptar = 0

    for (let i = 0; i < esperades; i++) {
        puntsTotalsPenalitzats += sessions[i].punts_obtinguts || 0
        totalSessionsADescomptar++

        if (!sessions[i].penalitzat) {
            sessionsAPenalitzarAra.push(sessions[i].id_sessio)
            puntsTotalsARestar += sessions[i].punts_obtinguts || 0
        }
    }
 
    if (sessionsAPenalitzarAra.length === 0) {
        return {
            penalitzat: true,
            jaPenalitzat: true,
            puntsRestats: puntsTotalsPenalitzats
        }
    }

    return await _aplicarPenalitzacioMassiva(
        idDiagnostic,
        sessionsAPenalitzarAra,
        puntsTotalsARestar,
        puntsTotalsPenalitzats,
        totalSessionsADescomptar
    )
}

export async function _aplicarPenalitzacioMassiva(
    idDiagnostic, arrIdSessions, puntsTotalsARestar, puntsTotalsPenalitzats, totalSessionsADescomptar
) {
    const { data: diagnostic, error: diagError } = await supabase
        .from('diagnostic')
        .select('punts_recuperacio, num_sessions, fase_actual, id_lesio, part_cos')
        .eq('id_diagnostic', idDiagnostic)
        .eq('finalitzat', false)
        .maybeSingle()

    if (diagError || !diagnostic) return { penalitzat: false }
    if (diagnostic.punts_recuperacio < puntsTotalsARestar) {
        return {
            penalitzat: true,
            jaPenalitzat: true,
            puntsRestats: puntsTotalsPenalitzats
        }
    }

    const nousPunts = Math.max(0, (diagnostic.punts_recuperacio || 0) - puntsTotalsARestar)

    const { data: totesLesPenalitzades } = await supabase
        .from('historial_sessions')
        .select('id_sessio')
        .eq('id_diagnostic', idDiagnostic)
        .eq('penalitzat', true)

    const idsExcloure = [
        ...arrIdSessions,
        ...(totesLesPenalitzades?.map(s => s.id_sessio) ?? [])
    ]

    let novaNumSessions = (diagnostic.num_sessions || 0) - totalSessionsADescomptar
    let novaFase = diagnostic.fase_actual

    console.log('[DEBUG] idsExcloure:', idsExcloure)
    console.log('[DEBUG] novaNumSessions inicial:', novaNumSessions)
    console.log('[DEBUG] novaFase inicial:', novaFase)

    while (novaNumSessions < 0 && novaFase > 1) {
    novaFase -= 1

    const { data: sessionsAnteriors } = await supabase
        .from('historial_sessions')
        .select('id_sessio')
        .eq('id_diagnostic', idDiagnostic)
        .eq('fase', novaFase)
        .filter('id_sessio', 'not.in', `(${idsExcloure.join(',')})`)

    const sessionsAFase = sessionsAnteriors?.length ?? 0
    
    if (sessionsAFase > 0 || novaFase === 1) {
        novaNumSessions = sessionsAFase
        break
    }
}


    if (novaNumSessions < 0) novaNumSessions = 0

    const { error: updateDiagError } = await supabase
        .from('diagnostic')
        .update({
            punts_recuperacio: nousPunts,
            num_sessions: novaNumSessions,
            fase_actual: novaFase
        })
        .eq('id_diagnostic', idDiagnostic)

    if (updateDiagError) {
        console.error('[Penalització] Error actualitzant diagnòstic:', updateDiagError)
        return { penalitzat: false }
    }

    const { error: updateSessioError } = await supabase
        .from('historial_sessions')
        .update({ penalitzat: true })
        .in('id_sessio', arrIdSessions)

    if (updateSessioError) {
        console.error('[Penalització] Error marcant sessions:', updateSessioError)
    }


    return {
        penalitzat: true,
        jaPenalitzat: false,
        puntsRestats: puntsTotalsPenalitzats
    }
}

export async function recuperarSessioPenalitzada(idDiagnostic) {
    const { data: sessioPenalitzada, error } = await supabase
        .from('historial_sessions')
        .select('id_sessio')
        .eq('id_diagnostic', idDiagnostic)
        .eq('penalitzat', true)
        .order('data_realitzacio', { ascending: true })
        .limit(1)
        .maybeSingle()

    if (error || !sessioPenalitzada) return false

    const { error: updateError } = await supabase
        .from('historial_sessions')
        .update({ penalitzat: false })
        .eq('id_sessio', sessioPenalitzada.id_sessio)

    if (updateError) {
        console.error('[Penalització] Error recuperant sessió:', updateError)
        return false
    }

    console.log(`[Penalització] Sessió ${sessioPenalitzada.id_sessio} recuperada (penalitzat → false)`)
    return true
}

export async function obtenirSessiosPenalitzades(userDni, idDiagnostic) {
    const { data, error } = await supabase
        .from('historial_sessions')
        .select('id_sessio, punts_obtinguts, data_realitzacio, fase')
        .eq('dni_pacient', userDni)
        .eq('id_diagnostic', idDiagnostic)
        .eq('penalitzat', true)
        .order('data_realitzacio', { ascending: false })

    if (error) {
        console.error('[Penalització] Error obtenint sessions penalitzades:', error)
        return []
    }
    return data || []
}