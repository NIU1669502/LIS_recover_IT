import { supabase } from '../../utils/supabase'

// ============================================================
// Sistema de penalització progressiva per inactivitat (> 72 hores)
//
// Flux:
//  1. comprovarIAplicarPenalitzacio  → crida quan s'obre "Exercicis en curs"
//  2. recuperarSessioPenalitzada     → crida dins completarSessio (lesions.js)
//  3. obtenirSessiosPenalitzades     → helper per llegir l'estat actual
// ============================================================

const HORES_PENALITZACIO = 72
const MS_PENALITZACIO = HORES_PENALITZACIO * 60 * 60 * 1000

// ------------------------------------------------------------
// comprovarIAplicarPenalitzacio
//
// Calcula quants dies han passat des de l'última sessió absoluta
// i penalitza progressivament (3 dies = 1, 4 dies = 2, etc).
// També s'encarrega de fer retrocedir la fase si num_sessions < 0.
// ------------------------------------------------------------
export async function comprovarIAplicarPenalitzacio(userDni, idDiagnostic) {
    // 1. Obtenir TOTES les sessions del diagnòstic, ordenades per data
    const { data: sessions, error } = await supabase
        .from('historial_sessions')
        .select('id_sessio, punts_obtinguts, data_realitzacio, penalitzat')
        .eq('dni_pacient', userDni)
        .eq('id_diagnostic', idDiagnostic)
        .order('data_realitzacio', { ascending: false })

    if (error || !sessions || sessions.length === 0) {
        return { penalitzat: false }
    }

    // 2. Calcular dies passats des de la sessió més recent
    const ultimaSessio = sessions[0]
    const ara = new Date()
    const dataUltimaSessio = new Date(ultimaSessio.data_realitzacio)
    
    // Diferència en dies complets passats
    const diesPassats = Math.floor((ara - dataUltimaSessio) / (1000 * 60 * 60 * 24))

    // 3. Quantes sessions s'haurien d'estar penalitzant ara mateix?
    let esperades = Math.max(0, diesPassats - 2)
    esperades = Math.min(esperades, sessions.length) // no penalitzar més de les que existeixen

    if (esperades === 0) {
        return { penalitzat: false }
    }

    // 4. Analitzar les primeres N sessions per veure quines falten per penalitzar
    let sessionsAPenalitzarAra = []
    let puntsTotalsARestar = 0
    let puntsTotalsPenalitzats = 0 // Per mostrar a la UI

    for (let i = 0; i < esperades; i++) {
        puntsTotalsPenalitzats += sessions[i].punts_obtinguts || 0
        
        if (!sessions[i].penalitzat) {
            sessionsAPenalitzarAra.push(sessions[i].id_sessio)
            puntsTotalsARestar += sessions[i].punts_obtinguts || 0
        }
    }

    // Ja estan totes penalitzades i no cal fer canvis a la BD, només avisar la UI
    if (sessionsAPenalitzarAra.length === 0) {
        return {
            penalitzat: true,
            jaPenalitzat: true,
            puntsRestats: puntsTotalsPenalitzats
        }
    }

    // 5. Aplicar els canvis de la nova penalització massiva a la BD
    return await _aplicarPenalitzacioMassiva(idDiagnostic, sessionsAPenalitzarAra, puntsTotalsARestar, puntsTotalsPenalitzats)
}

// ------------------------------------------------------------
// _aplicarPenalitzacioMassiva (funció interna)
// ------------------------------------------------------------
async function _aplicarPenalitzacioMassiva(idDiagnostic, arrIdSessions, puntsTotalsARestar, puntsTotalsPenalitzats) {
    // Obtenir l'estat actual del diagnòstic
    const { data: diagnostic, error: diagError } = await supabase
        .from('diagnostic')
        .select('punts_recuperacio, num_sessions, fase_actual, id_lesio, part_cos')
        .eq('id_diagnostic', idDiagnostic)
        .eq('finalitzat', false)
        .maybeSingle()

    if (diagError || !diagnostic) return { penalitzat: false }

    // Nou càlcul de punts (mai pot ser negatiu)
    const nousPunts = Math.max(0, (diagnostic.punts_recuperacio || 0) - puntsTotalsARestar)

    // Càlcul de sessions i regressió de fase
    let novaNumSessions = (diagnostic.num_sessions || 0) - arrIdSessions.length
    let novaFase = diagnostic.fase_actual

    while (novaNumSessions < 0 && novaFase > 1) {
        novaFase -= 1

        const { data: rutinaData } = await supabase
            .from('rutines_lesio')
            .select('id_fase_1, id_fase_2, id_fase_3')
            .eq('id_lesio', diagnostic.id_lesio)
            .eq('id_muscul', diagnostic.part_cos)
            .single()

        let idFase = null
        if (novaFase === 1) idFase = rutinaData.id_fase_1
        else if (novaFase === 2) idFase = rutinaData.id_fase_2
        else if (novaFase === 3) idFase = rutinaData.id_fase_3

        if (idFase) {
            const { data: faseData } = await supabase
                .from('fases')
                .select('n_sessions')
                .eq('id_fase', idFase)
                .single()
            
            // Si estem a -1 i la fase demana 6 sessions, tindrem 5 sessions superades a la fase anterior
            novaNumSessions = (faseData?.n_sessions || 0) + novaNumSessions
        } else {
            // Si no es troba la fase per algun motiu, tallem el bucle
            novaNumSessions = 0
            break
        }
    }

    if (novaNumSessions < 0) novaNumSessions = 0

    // Actualitzar diagnòstic
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

    // Marcar les sessions com a penalitzades massivament
    const { error: updateSessioError } = await supabase
        .from('historial_sessions')
        .update({ penalitzat: true })
        .in('id_sessio', arrIdSessions)

    if (updateSessioError) {
        console.error('[Penalització] Error marcant sessions:', updateSessioError)
    }

    console.log(`[Penalització] Aplicada al diag ${idDiagnostic}: -${puntsTotalsARestar} pts, sessions afectades: ${arrIdSessions.length}. Fase: ${novaFase}`)

    return {
        penalitzat: true,
        jaPenalitzat: false,
        puntsRestats: puntsTotalsPenalitzats // enviem el total per mostrar a la UI
    }
}

// ------------------------------------------------------------
// recuperarSessioPenalitzada
//
// Recupera les sessions d'1 en 1 ordenades des de la més antiga
// (per recuperar la penalització més vella primer).
// ------------------------------------------------------------
export async function recuperarSessioPenalitzada(idDiagnostic) {
    const { data: sessioPenalitzada, error } = await supabase
        .from('historial_sessions')
        .select('id_sessio')
        .eq('id_diagnostic', idDiagnostic)
        .eq('penalitzat', true)
        .order('data_realitzacio', { ascending: true }) // <--- Recuperem des de l'antiga
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

// ------------------------------------------------------------
// obtenirSessiosPenalitzades
// ------------------------------------------------------------
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
