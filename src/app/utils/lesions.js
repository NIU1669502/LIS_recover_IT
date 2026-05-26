import { supabase } from '../../utils/supabase'
import { TEST_STEPS } from '../data/testSteps.js'
import { showToast } from '../utils/toast'
import { recuperarSessioPenalitzada } from '../utils/penalitzacio'

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
// Obté el diagnòstic actiu de l'usuari
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
    const { part_cos, id_lesio, fase_actual, id_diagnostic, dni_pacient } = diagnostic

    const { data: rutina, error: rutinaError } = await supabase
        .from('rutines_lesio')
        .select('id_fase_1, id_fase_2, id_fase_3')
        .eq('id_muscul', part_cos)
        .eq('id_lesio', id_lesio)
        .single()

    if (rutinaError || !rutina) return []

    const idFase = fase_actual === 1 ? rutina.id_fase_1
        : fase_actual === 2 ? rutina.id_fase_2
        : rutina.id_fase_3

    const { data: fase, error: faseError } = await supabase
        .from('fases')
        .select('exercici_1, exercici_2, exercici_3, multiplicador')
        .eq('id_fase', idFase)
        .single()

    if (faseError || !fase) return []

    // Carregar tots els exercicis disponibles
    const { data: exercicis } = await supabase
        .from('exercicis')
        .select('*')

    const exMap = Object.fromEntries((exercicis || []).map(e => [e.id_exercici, e]))

    // Carregar personalitzacions del fisio per aquest diagnòstic i fase
    const { data: personalitzacions } = await supabase
        .from('rutina_personalitzada_pacient')
        .select('*')
        .eq('id_diagnostic', id_diagnostic)
        .eq('fase', fase_actual)

    const getPerso = (slot) =>
        (personalitzacions || []).find(p => p.slot_exercici === slot) || null

    // Construir la llista aplicant overrides
    const slots = [
        { slot: 1, idBase: fase.exercici_1 },
        { slot: 2, idBase: fase.exercici_2 },
        { slot: 3, idBase: fase.exercici_3 },
    ]

    return slots
        .filter(s => s.idBase)
        .map(s => {
            const perso = getPerso(s.slot)
            const exBase = exMap[s.idBase] || {}
            const exFinal = perso?.id_exercici ? exMap[perso.id_exercici] : exBase

            return {
                ...exFinal,
                // Aplicar overrides camp a camp
                duracio_segons: perso?.duracio_segons ?? exFinal.duracio_segons,
                Repeticions: perso?.repeticions ?? exFinal.Repeticions,
                punts: perso?.punts ?? exFinal.punts,
                multiplicador: perso?.multiplicador ?? fase.multiplicador ?? 1,
            }
        })
}

// ============================================================
// Avança la fase del diagnòstic i suma punts a l'usuari
// dolorSessio: int (1-10) o null
// dolorExercicis: [{index, nom, dolor}] o null
// ============================================================
export async function completarSessio(userDni, puntsGuanyats, idDiagnostic = null, dolorSessio = null, dolorExercicis = null) {
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

    const { data: rutina } = await supabase
        .from('rutines_lesio')
        .select('id_fase_1, id_fase_2, id_fase_3')
        .eq('id_muscul', diagnostic.part_cos)
        .eq('id_lesio', diagnostic.id_lesio)
        .single()

    let idFase
    if (diagnostic.fase_actual === 1) idFase = rutina?.id_fase_1
    else if (diagnostic.fase_actual === 2) idFase = rutina?.id_fase_2
    else idFase = rutina?.id_fase_3

    let nSessionsRequerides = 1
    if (idFase) {
        const { data: faseInfo } = await supabase
            .from('fases')
            .select('n_sessions')
            .eq('id_fase', idFase)
            .single()
        if (faseInfo?.n_sessions) nSessionsRequerides = faseInfo.n_sessions

        // Comprovar si el fisio ha definit un n_sessions_override per a aquest pacient i fase
        const { data: persoOverride } = await supabase
            .from('rutina_personalitzada_pacient')
            .select('n_sessions_override')
            .eq('id_diagnostic', diagnostic.id_diagnostic)
            .eq('fase', diagnostic.fase_actual)
            .not('n_sessions_override', 'is', null)
            .limit(1)
            .maybeSingle()
        if (persoOverride?.n_sessions_override != null) {
            nSessionsRequerides = persoOverride.n_sessions_override
        }
    }

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

    // Calcular punts: si la fase avança o es completa, cap a l'umbral exacte (els punts en excés s'ignoren)
    let nousPuntsRecuperacio = (diagnostic.punts_recuperacio || 0) + puntsGuanyats

    if ((faseAvançada || completada) && rutina) {
        try {
            const [{ data: f1 }, { data: f2 }, { data: f3 }] = await Promise.all([
                supabase.from('fases').select('exercici_1, exercici_2, exercici_3, multiplicador, n_sessions').eq('id_fase', rutina.id_fase_1).single(),
                supabase.from('fases').select('exercici_1, exercici_2, exercici_3, multiplicador, n_sessions').eq('id_fase', rutina.id_fase_2).single(),
                supabase.from('fases').select('exercici_1, exercici_2, exercici_3, multiplicador, n_sessions').eq('id_fase', rutina.id_fase_3).single(),
            ])
            const allIds = [...new Set([
                f1?.exercici_1, f1?.exercici_2, f1?.exercici_3,
                f2?.exercici_1, f2?.exercici_2, f2?.exercici_3,
                f3?.exercici_1, f3?.exercici_2, f3?.exercici_3,
            ].filter(Boolean))]
            const { data: exs } = await supabase.from('exercicis').select('id_exercici, punts').in('id_exercici', allIds)
            const puntsPer = Object.fromEntries((exs || []).map(e => [e.id_exercici, e.punts]))
            const calcUmbral = (fi) => {
                if (!fi) return 0
                return [fi.exercici_1, fi.exercici_2, fi.exercici_3].filter(Boolean)
                    .reduce((acc, id) => acc + (puntsPer[id] ?? 0), 0) * (fi.multiplicador ?? 1) * (fi.n_sessions ?? 1)
            }
            const u1 = calcUmbral(f1), u2 = calcUmbral(f2), u3 = calcUmbral(f3)
            // Punts exactes acumulats fins al final de la fase completada (sense excés)
            if (diagnostic.fase_actual === 1) nousPuntsRecuperacio = u1
            else if (diagnostic.fase_actual === 2) nousPuntsRecuperacio = u1 + u2
            else nousPuntsRecuperacio = u1 + u2 + u3
        } catch (err) {
            console.error('Error capant punts de fase:', err)
        }
    }

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

    // Registrem la sessió a l'historial amb les valoracions de dolor
    try {
        await supabase
            .from('historial_sessions')
            .insert([{
                dni_pacient: userDni,
                id_diagnostic: diagnostic.id_diagnostic,
                id_lesio: diagnostic.id_lesio,
                fase: diagnostic.fase_actual,
                punts_obtinguts: puntsGuanyats || 0,
                dolor_sessio: dolorSessio ?? null,
                dolor_exercicis: dolorExercicis ? JSON.stringify(dolorExercicis) : null,
            }])
    } catch (err) {
        console.error('No s\'ha pogut registrar la sessió a l\'historial', err)
    }

    // Si hi havia una sessió penalitzada, la marquem com a recuperada
    try {
        await recuperarSessioPenalitzada(diagnostic.id_diagnostic)
    } catch (err) {
        console.error('No s\'ha pogut recuperar la sessió penalitzada', err)
    }

    return { completada, novaFase: completada ? null : novaFase, faseAvançada, nSessionsRestants: nSessionsRequerides - nouNumSessions }
}

// ============================================================
// RF-PAC-01 — Guarda o actualitza el diagnòstic a Supabase
// ============================================================
export async function processarTestDiagnostic(resultat, navegarA) {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
            showToast("Has d'iniciar sessió per poder guardar el teu diagnòstic.", 'warning')
            return
        }

        const userDni = session.user.user_metadata?.dni
        const idxCos = TEST_STEPS[0].opcions.indexOf(resultat.muscle)
        const idCos = idxCos >= 0 ? idxCos + 1 : 1

        const { data: idFases } = await supabase
            .from('rutines_lesio')
            .select('id_fase_1, id_fase_2, id_fase_3')
            .eq('id_muscul', idCos)
            .eq('id_lesio', resultat.id_lesio)
            .single()

        const [
            { data: multifase1 }, { data: multifase2 }, { data: multifase3 },
            { data: infoFase1 }, { data: infoFase2 }, { data: infoFase3 },
        ] = await Promise.all([
            supabase.from('fases').select('multiplicador').eq('id_fase', idFases.id_fase_1).single(),
            supabase.from('fases').select('multiplicador').eq('id_fase', idFases.id_fase_2).single(),
            supabase.from('fases').select('multiplicador').eq('id_fase', idFases.id_fase_3).single(),
            supabase.from('fases').select('exercici_1, exercici_2, exercici_3, n_sessions').eq('id_fase', idFases.id_fase_1).single(),
            supabase.from('fases').select('exercici_1, exercici_2, exercici_3, n_sessions').eq('id_fase', idFases.id_fase_2).single(),
            supabase.from('fases').select('exercici_1, exercici_2, exercici_3, n_sessions').eq('id_fase', idFases.id_fase_3).single(),
        ])

        const idsExercicis = [...new Set([
            infoFase1.exercici_1, infoFase1.exercici_2, infoFase1.exercici_3,
            infoFase2.exercici_1, infoFase2.exercici_2, infoFase2.exercici_3,
            infoFase3.exercici_1, infoFase3.exercici_2, infoFase3.exercici_3,
        ].filter(Boolean))]

        const { data: exercicisInfo } = await supabase
            .from('exercicis')
            .select('id_exercici, punts')
            .in('id_exercici', idsExercicis)

        const puntsPer = Object.fromEntries(exercicisInfo.map(e => [e.id_exercici, e.punts]))

        const calcularPuntsFase = (infoFase, multiplicador) =>
            [infoFase.exercici_1, infoFase.exercici_2, infoFase.exercici_3]
                .filter(Boolean)
                .reduce((acc, id) => acc + (puntsPer[id] ?? 0), 0) * (multiplicador ?? 1) * (infoFase.n_sessions ?? 1)

        const puntsTotal =
            calcularPuntsFase(infoFase1, multifase1?.multiplicador) +
            calcularPuntsFase(infoFase2, multifase2?.multiplicador) +
            calcularPuntsFase(infoFase3, multifase3?.multiplicador)

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
// Obté el resum global de sessions del diagnòstic
// ============================================================
export async function getResumSessions(diagnostic) {
    if (!diagnostic) return { fetes: 0, totals: 0 }

    const { data: rutina } = await supabase
        .from('rutines_lesio')
        .select('id_fase_1, id_fase_2, id_fase_3')
        .eq('id_muscul', diagnostic.part_cos)
        .eq('id_lesio', diagnostic.id_lesio)
        .single()

    if (!rutina) return { fetes: 0, totals: 0 }

    const ids = [rutina.id_fase_1, rutina.id_fase_2, rutina.id_fase_3].filter(Boolean)

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

    // Aplicar n_sessions_override si el fisio l'ha definit per a aquest pacient i fase
    if (diagnostic.id_diagnostic) {
        const { data: persoOverride } = await supabase
            .from('rutina_personalitzada_pacient')
            .select('n_sessions_override')
            .eq('id_diagnostic', diagnostic.id_diagnostic)
            .eq('fase', diagnostic.fase_actual)
            .not('n_sessions_override', 'is', null)
            .limit(1)
            .maybeSingle()
        if (persoOverride?.n_sessions_override != null) {
            totals = persoOverride.n_sessions_override
        }
    }

    return { fetes: diagnostic.num_sessions || 0, totals }
}

// ============================================================
// Elimina (soft-delete) un diagnòstic
// Manté les sessions fetes per l'historial però elimina
// les penalitzacions i l'oculta de les vistes principals.
// ============================================================
export async function eliminarDiagnostic(idDiagnostic) {
    // 1. Treure la penalització de totes les sessions d'aquest diagnòstic
    await supabase
        .from('historial_sessions')
        .update({ penalitzat: false })
        .eq('id_diagnostic', idDiagnostic)

    // 2. Soft-delete del diagnòstic
    const { error } = await supabase
        .from('diagnostic')
        .update({ finalitzat: true, punts_recuperacio: -1 })
        .eq('id_diagnostic', idDiagnostic)

    if (error) {
        console.error('Error esborrant diagnòstic (soft-delete):', error)
        showToast('No s\'ha pogut esborrar el diagnòstic', 'error')
        return false
    }
    showToast('Diagnòstic esborrat correctament', 'success')
    return true
}