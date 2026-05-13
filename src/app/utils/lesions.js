import { supabase } from '../../utils/supabase'
import { TEST_STEPS } from '../data/testSteps.js'
import { showToast } from '../utils/toast'

// ============================================================
// Determina el tipus de lesió a partir de les respostes del test
// ============================================================
export function determinarLesio(respostes) {
    const onset = respostes[1]
    const dolor = respostes[2]
    const mobilitat = respostes[3]

    if (onset === 0 && mobilitat === 0)
        return { tipus: 'Esquinç', id_lesio: 1, emoji: '🤕', temps: '3-6 setmanes', sessions: '12-15', fase: 'Fase 1 - Inicial' }
    if (onset === 0 && mobilitat === 1)
        return { tipus: 'Distensió', id_lesio: 2, emoji: '😖', temps: '2-4 setmanes', sessions: '8-10', fase: 'Fase 1 - Inicial' }
    if (dolor === 1 || dolor === 2)
        return { tipus: 'Contractura / Sobrecarrega', id_lesio: 3, emoji: '😫', temps: '5-10 dies', sessions: '5-7', fase: 'Fase 1 - Inicial' }

    return { tipus: 'Distensió', id_lesio: 2, emoji: '😖', temps: '2-4 setmanes', sessions: '8-10', fase: 'Fase 1 - Inicial' }
}

// ============================================================
// Obté el diagnòstic actiu de l'usuari i els exercicis de la fase actual
// ============================================================
export async function getDiagnosticActiu(userDni) {
    const { data: diagnostic, error } = await supabase
        .from('diagnostic')
        .select('*')
        .eq('dni_pacient', userDni)
        .eq('finalitzat', false)
        .order('id_diagnostic', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error || !diagnostic) return null
    return diagnostic
}

/** Tots els diagnòstics no finalitzats del pacient (més recents primer). */
export async function getDiagnosticsActius(userDni) {
    const { data, error } = await supabase
        .from('diagnostic')
        .select('*')
        .eq('dni_pacient', userDni)
        .eq('finalitzat', false)
        .order('id_diagnostic', { ascending: false })

    if (error || !data?.length) return []
    return data
}

export async function getExercicisDelaFase(diagnostic) {
    const { part_cos, id_lesio, fase_actual } = diagnostic

    // 1. Buscar la rutina que coincideix amb múscul + lesió
    const { data: rutina, error: rutinaError } = await supabase
        .from('rutines_lesio')
        .select('id_fase_1, id_fase_2, id_fase_3')
        .eq('id_muscul', part_cos)
        .eq('id_lesio', id_lesio)
        .single()

    if (rutinaError || !rutina) {
        console.error('No s\'ha trobat rutina per aquest diagnòstic', rutinaError)
        return []
    }

    // 2. Agafar l'id de la fase actual
    const idFase = fase_actual === 1 ? rutina.id_fase_1
        : fase_actual === 2 ? rutina.id_fase_2
            : rutina.id_fase_3

    // 3. Buscar els 3 exercicis d'aquesta fase
    const { data: fase, error: faseError } = await supabase
        .from('fases')
        .select('exercici_1, exercici_2, exercici_3')
        .eq('id_fase', idFase)
        .single()

    if (faseError || !fase) {
        console.error('No s\'ha trobat la fase', faseError)
        return []
    }

    // 4. Fetch dels exercicis
    const ids = [fase.exercici_1, fase.exercici_2, fase.exercici_3].filter(Boolean)

    const { data: exercicis, error: exError } = await supabase
        .from('exercicis')
        .select('*')
        .in('id_exercici', ids)

    if (exError) {
        console.error('Error carregant exercicis', exError)
        return []
    }

    // Mantenir l'ordre de la fase
    return ids.map(id => exercicis.find(e => e.id_exercici === id)).filter(Boolean)
}

// ============================================================
// Avança la fase del diagnòstic i suma punts a l'usuari
// ============================================================
export async function completarSessio(userDni, puntsGuanyats, idDiagnostic = null) {
    // 1. Agafar diagnòstic (el de la sessió en curs, o el més recent si no s'especifica)
    let diagnostic
    if (idDiagnostic != null) {
        const { data, error } = await supabase
            .from('diagnostic')
            .select('*')
            .eq('id_diagnostic', idDiagnostic)
            .eq('dni_pacient', userDni)
            .eq('finalitzat', false)
            .maybeSingle()
        if (error || !data) return { completada: false }
        diagnostic = data
    } else {
        diagnostic = await getDiagnosticActiu(userDni)
    }
    if (!diagnostic) return { completada: false }

    // 2. Determinar n_sessions requerides per a la fase actual
    const { data: rutina } = await supabase
        .from('rutines_lesio')
        .select('id_fase_1, id_fase_2, id_fase_3')
        .eq('id_muscul', diagnostic.part_cos)
        .eq('id_lesio', diagnostic.id_lesio)
        .single()

    let idFase;
    if (diagnostic.fase_actual === 1) idFase = rutina?.id_fase_1;
    else if (diagnostic.fase_actual === 2) idFase = rutina?.id_fase_2;
    else idFase = rutina?.id_fase_3;

    let nSessionsRequerides = 1; // Per defecte
    if (idFase) {
        const { data: faseInfo } = await supabase
            .from('fases')
            .select('n_sessions')
            .eq('id_fase', idFase)
            .single()
        if (faseInfo && faseInfo.n_sessions) {
            nSessionsRequerides = faseInfo.n_sessions;
        }
    }

    // 3. Incrementar sessions completades i avaluar si s'avança de fase
    const numSessionsActualitzat = (diagnostic.num_sessions || 0) + 1

    let novaFase = diagnostic.fase_actual
    let nouNumSessions = numSessionsActualitzat
    let completada = false
    let faseAvançada = false

    if (numSessionsActualitzat >= nSessionsRequerides) {
        if (diagnostic.fase_actual === 3) {
            completada = true
            novaFase = 3
            nouNumSessions = numSessionsActualitzat
        } else {
            novaFase = diagnostic.fase_actual + 1
            nouNumSessions = 0
            faseAvançada = true
        }
    }

    const nousPuntsRecuperacio = (diagnostic.punts_recuperacio || 0) + puntsGuanyats

    // 4. Actualitzar fase, num_sessions i punts_recuperacio a la BD
    const actualitzacio = {
        fase_actual: novaFase,
        num_sessions: nouNumSessions,
        punts_recuperacio: nousPuntsRecuperacio
    }

    if (completada) {
        actualitzacio.finalitzat = true
        actualitzacio.data_fi = new Date().toISOString()
    }

    await supabase
        .from('diagnostic')
        .update(actualitzacio)
        .eq('id_diagnostic', diagnostic.id_diagnostic)

    // Registrem la sessió a l'historial (no bloquegem el flux si falla)
    try {
        await supabase
            .from('historial_sessions')
            .insert([{
                dni_pacient: userDni,
                id_diagnostic: diagnostic.id_diagnostic,
                id_lesio: diagnostic.id_lesio,
                fase: diagnostic.fase_actual,
                punts_obtinguts: puntsGuanyats || 0,
            }])
    } catch (err) {
        console.error('No s\'ha pogut registrar la sessió a l\'historial', err)
    }

    return { completada, novaFase: completada ? null : novaFase, faseAvançada, nSessionsRestants: nSessionsRequerides - nouNumSessions }
}

// ============================================================
// RF-PAC-01 — Guarda o actualitza el diagnòstic a Supabase
// ============================================================
export async function processarTestDiagnostic(resultat, navegarA,) {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
            showToast("Has d'iniciar sessió per poder guardar el teu diagnòstic.", 'warning')
            return
        }

        const userDni = session.user.user_metadata?.dni
        const idxCos = TEST_STEPS[0].opcions.indexOf(resultat.muscle)
        const idCos = idxCos >= 0 ? idxCos + 1 : 1

        // ── Obtenir ids de fases ─────────────────────────────
        const { data: idFases } = await supabase
            .from('rutines_lesio')
            .select('id_fase_1, id_fase_2, id_fase_3')
            .eq('id_muscul', idCos)
            .eq('id_lesio', resultat.id_lesio)
            .single()

        // ── Obtenir info de les 3 fases en paral·lel ────────
        const [
            { data: multifase1 },
            { data: multifase2 },
            { data: multifase3 },
            { data: infoFase1 },
            { data: infoFase2 },
            { data: infoFase3 },
        ] = await Promise.all([
            supabase.from('fases').select('multiplicador').eq('id_fase', idFases.id_fase_1).single(),
            supabase.from('fases').select('multiplicador').eq('id_fase', idFases.id_fase_2).single(),
            supabase.from('fases').select('multiplicador').eq('id_fase', idFases.id_fase_3).single(),
            supabase.from('fases').select('exercici_1, exercici_2, exercici_3, n_sessions').eq('id_fase', idFases.id_fase_1).single(),
            supabase.from('fases').select('exercici_1, exercici_2, exercici_3, n_sessions').eq('id_fase', idFases.id_fase_2).single(),
            supabase.from('fases').select('exercici_1, exercici_2, exercici_3, n_sessions').eq('id_fase', idFases.id_fase_3).single(),
        ])

        // ── Obtenir punts de tots els exercicis ──────────────
        const idsExercicis = [...new Set([
            infoFase1.exercici_1, infoFase1.exercici_2, infoFase1.exercici_3,
            infoFase2.exercici_1, infoFase2.exercici_2, infoFase2.exercici_3,
            infoFase3.exercici_1, infoFase3.exercici_2, infoFase3.exercici_3,
        ].filter(Boolean))]

        const { data: exercicisInfo } = await supabase
            .from('exercicis')
            .select('id_exercici, punts')
            .in('id_exercici', idsExercicis)

        const puntsPer = Object.fromEntries(
            exercicisInfo.map(e => [e.id_exercici, e.punts])
        )

        const calcularPuntsFase = (infoFase, multiplicador) =>
            [infoFase.exercici_1, infoFase.exercici_2, infoFase.exercici_3]
                .filter(Boolean)
                .reduce((acc, id) => acc + (puntsPer[id] ?? 0), 0) * (multiplicador ?? 1) * (infoFase.n_sessions ?? 1)

        const puntsFase1 = calcularPuntsFase(infoFase1, multifase1?.multiplicador)
        const puntsFase2 = calcularPuntsFase(infoFase2, multifase2?.multiplicador)
        const puntsFase3 = calcularPuntsFase(infoFase3, multifase3?.multiplicador)
        const puntsTotal = puntsFase1 + puntsFase2 + puntsFase3

        // ── Guardar diagnòstic ───────────────────────────────
        const { error } = await supabase
            .from('diagnostic')
            .insert([{
                dni_pacient: userDni,
                part_cos: idCos,
                id_lesio: resultat.id_lesio,
                descripcio: resultat.descripcio || 'Sense descripció',
                fase_actual: 1,
                num_sessions: 0,
                punts_recuperacio: 0,
                puntsFinals: puntsTotal,
                finalitzat: false
            }])

        if (error) {
            console.error('Error al guardar:', error)
            showToast(`Hi ha hagut un problema: ${error.message}`, 'error')
            return
        }

        showToast('Diagnòstic completat i guardat amb èxit!', 'success')
        navegarA('exercicis-en-curs')

    } catch (err) {
        console.error('Error inesperat:', err)
    }
}


// ============================================================
// Obté el resum global de sessions del diagnòstic (fetes i totals)
// ============================================================
export async function getResumSessions(diagnostic) {
    if (!diagnostic) return { fetes: 0, totals: 0 }

    // Obtenir ids de les tres fases
    const { data: rutina } = await supabase
        .from('rutines_lesio')
        .select('id_fase_1, id_fase_2, id_fase_3')
        .eq('id_muscul', diagnostic.part_cos)
        .eq('id_lesio', diagnostic.id_lesio)
        .single()

    if (!rutina) return { fetes: 0, totals: 0 }

    const ids = [rutina.id_fase_1, rutina.id_fase_2, rutina.id_fase_3].filter(Boolean)

    // Obtenir n_sessions de cadascuna
    const { data: fases } = await supabase
        .from('fases')
        .select('id_fase, n_sessions')
        .in('id_fase', ids)

    if (!fases) return { fetes: 0, totals: 0 }

    const mapFases = {}
    fases.forEach(f => mapFases[f.id_fase] = f.n_sessions || 0)

    const req1 = mapFases[rutina.id_fase_1] || 0
    const req2 = mapFases[rutina.id_fase_2] || 0
    const req3 = mapFases[rutina.id_fase_3] || 0

    let totals = 0
    if (diagnostic.fase_actual === 1) totals = req1
    else if (diagnostic.fase_actual === 2) totals = req2
    else if (diagnostic.fase_actual === 3) totals = req3

    let fetes = diagnostic.num_sessions || 0

    return { fetes, totals }
}