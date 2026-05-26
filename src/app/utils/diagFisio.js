import { supabase } from '../../utils/supabase'
import { showToast } from '../utils/toast'

// ============================================================
// Confirmar codi del fisioterapeuta i crear diagnòstic
// ============================================================
export async function confirmarCodiFisio(dniPacient, codiIntroduit) {
    const codiNet = codiIntroduit.trim().toUpperCase()

    if (!codiNet) return { ok: false, missatge: 'Introdueix un codi.' }

    const { data: relacio, error } = await supabase
        .from('relacio_fisio_pacient')
        .select('*')
        .eq('dni_pacient', dniPacient)
        .eq('codi_validacio', codiNet)
        .eq('confirmat', false)
        .maybeSingle()

    if (error || !relacio) return { ok: false, missatge: 'El codi no és vàlid.' }

    const { error: errorUpdate } = await supabase
        .from('relacio_fisio_pacient')
        .update({ confirmat: true, codi_validacio: null })
        .eq('dni_fisio', relacio.dni_fisio)
        .eq('dni_pacient', relacio.dni_pacient)

    if (errorUpdate) return { ok: false, missatge: errorUpdate.message }

    const { data: idFases } = await supabase
        .from('rutines_lesio')
        .select('id_fase_1, id_fase_2, id_fase_3')
        .eq('id_muscul', relacio.part_cos)
        .eq('id_lesio', relacio.id_lesio)
        .single()

    let puntsTotal = 0

    if (idFases) {
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

        if (infoFase1 && infoFase2 && infoFase3) {
            const idsExercicis = [...new Set([
                infoFase1.exercici_1, infoFase1.exercici_2, infoFase1.exercici_3,
                infoFase2.exercici_1, infoFase2.exercici_2, infoFase2.exercici_3,
                infoFase3.exercici_1, infoFase3.exercici_2, infoFase3.exercici_3,
            ].filter(Boolean))]

            const { data: exercicisInfo } = await supabase
                .from('exercicis').select('id_exercici, punts').in('id_exercici', idsExercicis)

            const puntsPer = Object.fromEntries((exercicisInfo || []).map(e => [e.id_exercici, e.punts]))

            const calcularPuntsFase = (infoFase, multiplicador) =>
                [infoFase.exercici_1, infoFase.exercici_2, infoFase.exercici_3]
                    .filter(Boolean)
                    .reduce((acc, id) => acc + (puntsPer[id] ?? 0), 0) * (multiplicador ?? 1) * (infoFase.n_sessions ?? 1)

            puntsTotal =
                calcularPuntsFase(infoFase1, multifase1?.multiplicador) +
                calcularPuntsFase(infoFase2, multifase2?.multiplicador) +
                calcularPuntsFase(infoFase3, multifase3?.multiplicador)
        }
    }

    const { error: errorDiag } = await supabase
        .from('diagnostic')
        .insert([{
            dni_pacient: relacio.dni_pacient,
            id_lesio: relacio.id_lesio,
            part_cos: relacio.part_cos,
            descripcio: relacio.descripcio || 'Sense descripció',
            fase_actual: 1,
            finalitzat: false,
            num_sessions: 0,
            punts_recuperacio: 0,
            puntsFinals: puntsTotal,
        }])

    if (errorDiag) return { ok: false, missatge: errorDiag.message }
    return { ok: true }
}

// ============================================================
// RF-FISIO-07 — Avançar fase d'un pacient manualment
// Suma els punts de les sessions restants de la fase actual
// Retorna { ok, novaFase, completada, missatge }
// ============================================================
export async function avancarFasePacient(idDiagnostic) {
    // 1. Agafar el diagnòstic actual
    const { data: diagnostic, error } = await supabase
        .from('diagnostic')
        .select('fase_actual, finalitzat, num_sessions, punts_recuperacio, id_lesio, part_cos')
        .eq('id_diagnostic', idDiagnostic)
        .maybeSingle()

    if (error || !diagnostic) return { ok: false, missatge: 'No s\'ha trobat el diagnòstic.' }
    if (diagnostic.finalitzat) return { ok: false, missatge: 'Aquest diagnòstic ja està finalitzat.' }

    // 2. Obtenir la rutina de la fase actual per calcular punts restants
    const { data: rutina } = await supabase
        .from('rutines_lesio')
        .select('id_fase_1, id_fase_2, id_fase_3')
        .eq('id_muscul', diagnostic.part_cos)
        .eq('id_lesio', diagnostic.id_lesio)
        .single()

    let puntsAAfegir = 0

    if (rutina) {
        const idFase = diagnostic.fase_actual === 1 ? rutina.id_fase_1
            : diagnostic.fase_actual === 2 ? rutina.id_fase_2
                : rutina.id_fase_3

        const { data: faseInfo } = await supabase
            .from('fases')
            .select('exercici_1, exercici_2, exercici_3, multiplicador, n_sessions')
            .eq('id_fase', idFase)
            .single()

        if (faseInfo) {
            // Usem n_sessions_override si el fisio l'ha definit
            let nSessionsFase = faseInfo.n_sessions ?? 0
            const { data: persoOverride } = await supabase
                .from('rutina_personalitzada_pacient')
                .select('n_sessions_override')
                .eq('id_diagnostic', idDiagnostic)
                .eq('fase', diagnostic.fase_actual)
                .not('n_sessions_override', 'is', null)
                .limit(1)
                .maybeSingle()
            if (persoOverride?.n_sessions_override != null) {
                nSessionsFase = persoOverride.n_sessions_override
            }

            const sessionsRestants = Math.max(0, nSessionsFase - (diagnostic.num_sessions ?? 0))

            // Buscar personalitzacions per a aquesta fase
            const { data: personalitzacions } = await supabase
                .from('rutina_personalitzada_pacient')
                .select('slot_exercici, id_exercici, punts, multiplicador')
                .eq('id_diagnostic', idDiagnostic)
                .eq('fase', diagnostic.fase_actual)

            const persoMap = Object.fromEntries(
                (personalitzacions || []).map(p => [p.slot_exercici, p])
            )

            // Obtenir punts base dels 3 exercicis
            const idsBase = [faseInfo.exercici_1, faseInfo.exercici_2, faseInfo.exercici_3].filter(Boolean)
            const idsPersonalitzats = (personalitzacions || []).map(p => p.id_exercici).filter(Boolean)
            const idsTotal = [...new Set([...idsBase, ...idsPersonalitzats])]

            const { data: exercicisInfo } = await supabase
                .from('exercicis')
                .select('id_exercici, punts')
                .in('id_exercici', idsTotal)

            const puntsPer = Object.fromEntries((exercicisInfo || []).map(e => [e.id_exercici, e.punts]))

            // Calcular punts per sessió (respectant personalitzacions)
            const slots = [
                { slot: 1, id_exercici: faseInfo.exercici_1 },
                { slot: 2, id_exercici: faseInfo.exercici_2 },
                { slot: 3, id_exercici: faseInfo.exercici_3 },
            ]

            const puntsSessio = slots.reduce((acc, s) => {
                const perso = persoMap[s.slot]
                const punts = perso?.punts ?? puntsPer[s.id_exercici] ?? 0
                const mult = perso?.multiplicador ?? faseInfo.multiplicador ?? 1
                return acc + (punts * mult)
            }, 0)

            puntsAAfegir = puntsSessio * sessionsRestants
        }
    }

    // 3. Avançar fase o completar
    // Cap a l'umbral exacte de la fase completada (els punts en excés s'ignoren)
    let nousPunts = (diagnostic.punts_recuperacio ?? 0) + puntsAAfegir
    try {
        const { data: rutinesAll } = await supabase
            .from('rutines_lesio')
            .select('id_fase_1, id_fase_2, id_fase_3')
            .eq('id_muscul', diagnostic.part_cos)
            .eq('id_lesio', diagnostic.id_lesio)
            .single()
        if (rutinesAll) {
            const [{ data: fa1 }, { data: fa2 }, { data: fa3 }] = await Promise.all([
                supabase.from('fases').select('exercici_1, exercici_2, exercici_3, multiplicador, n_sessions').eq('id_fase', rutinesAll.id_fase_1).single(),
                supabase.from('fases').select('exercici_1, exercici_2, exercici_3, multiplicador, n_sessions').eq('id_fase', rutinesAll.id_fase_2).single(),
                supabase.from('fases').select('exercici_1, exercici_2, exercici_3, multiplicador, n_sessions').eq('id_fase', rutinesAll.id_fase_3).single(),
            ])
            const allIds = [...new Set([
                fa1?.exercici_1, fa1?.exercici_2, fa1?.exercici_3,
                fa2?.exercici_1, fa2?.exercici_2, fa2?.exercici_3,
                fa3?.exercici_1, fa3?.exercici_2, fa3?.exercici_3,
            ].filter(Boolean))]
            const { data: exs } = await supabase.from('exercicis').select('id_exercici, punts').in('id_exercici', allIds)
            const pp = Object.fromEntries((exs || []).map(e => [e.id_exercici, e.punts]))
            const calcU = (fi) => {
                if (!fi) return 0
                return [fi.exercici_1, fi.exercici_2, fi.exercici_3].filter(Boolean)
                    .reduce((acc, id) => acc + (pp[id] ?? 0), 0) * (fi.multiplicador ?? 1) * (fi.n_sessions ?? 1)
            }
            const u1 = calcU(fa1), u2 = calcU(fa2), u3 = calcU(fa3)
            if (diagnostic.fase_actual === 1) nousPunts = u1
            else if (diagnostic.fase_actual === 2) nousPunts = u1 + u2
            else nousPunts = u1 + u2 + u3
        }
    } catch (err) {
        console.error('Error capant punts en avançar fase:', err)
    }

    if (diagnostic.fase_actual >= 3) {
        await supabase
            .from('diagnostic')
            .update({ finalitzat: true, data_fi: new Date().toISOString(), punts_recuperacio: nousPunts })
            .eq('id_diagnostic', idDiagnostic)
        return { ok: true, completada: true, novaFase: null }
    }

    const novaFase = diagnostic.fase_actual + 1
    await supabase
        .from('diagnostic')
        .update({ fase_actual: novaFase, num_sessions: 0, punts_recuperacio: nousPunts })
        .eq('id_diagnostic', idDiagnostic)

    return { ok: true, completada: false, novaFase }
}

// ============================================================
// RF-FISIO-07 — Recular fase d'un pacient manualment
// Resta els punts guanyats a la fase actual i torna a la fase anterior
// ============================================================
export async function recullarFasePacient(idDiagnostic) {
    // 1. Agafar el diagnòstic actual
    const { data: diagnostic, error } = await supabase
        .from('diagnostic')
        .select('fase_actual, finalitzat, num_sessions, punts_recuperacio, id_lesio, part_cos')
        .eq('id_diagnostic', idDiagnostic)
        .maybeSingle()

    if (error || !diagnostic) return { ok: false, missatge: 'No s\'ha trobat el diagnòstic.' }
    if (diagnostic.fase_actual <= 1) return { ok: false, missatge: 'El pacient ja és a la Fase 1.' }

    // 2. Calcular punts guanyats a la fase actual (sessions fetes × punts per sessió)
    const { data: rutina } = await supabase
        .from('rutines_lesio')
        .select('id_fase_1, id_fase_2, id_fase_3')
        .eq('id_muscul', diagnostic.part_cos)
        .eq('id_lesio', diagnostic.id_lesio)
        .single()

    let puntsARestar = 0

    if (rutina) {
        const idFase = diagnostic.fase_actual === 1 ? rutina.id_fase_1
            : diagnostic.fase_actual === 2 ? rutina.id_fase_2
                : rutina.id_fase_3

        const { data: faseInfo } = await supabase
            .from('fases')
            .select('exercici_1, exercici_2, exercici_3, multiplicador, n_sessions')
            .eq('id_fase', idFase)
            .single()

        if (faseInfo) {
            const sessionsFetes = diagnostic.num_sessions ?? 0

            const { data: personalitzacions } = await supabase
                .from('rutina_personalitzada_pacient')
                .select('slot_exercici, id_exercici, punts, multiplicador')
                .eq('id_diagnostic', idDiagnostic)
                .eq('fase', diagnostic.fase_actual)

            const persoMap = Object.fromEntries(
                (personalitzacions || []).map(p => [p.slot_exercici, p])
            )

            const idsBase = [faseInfo.exercici_1, faseInfo.exercici_2, faseInfo.exercici_3].filter(Boolean)
            const idsPersonalitzats = (personalitzacions || []).map(p => p.id_exercici).filter(Boolean)
            const idsTotal = [...new Set([...idsBase, ...idsPersonalitzats])]

            const { data: exercicisInfo } = await supabase
                .from('exercicis')
                .select('id_exercici, punts')
                .in('id_exercici', idsTotal)

            const puntsPer = Object.fromEntries((exercicisInfo || []).map(e => [e.id_exercici, e.punts]))

            const slots = [
                { slot: 1, id_exercici: faseInfo.exercici_1 },
                { slot: 2, id_exercici: faseInfo.exercici_2 },
                { slot: 3, id_exercici: faseInfo.exercici_3 },
            ]

            const puntsSessio = slots.reduce((acc, s) => {
                const perso = persoMap[s.slot]
                const punts = perso?.punts ?? puntsPer[s.id_exercici] ?? 0
                const mult = perso?.multiplicador ?? faseInfo.multiplicador ?? 1
                return acc + (punts * mult)
            }, 0)

            puntsARestar = puntsSessio * sessionsFetes
        }
    }

    // 3. Recular fase i reiniciar sessions
    const faseAnterior = diagnostic.fase_actual - 1
    const nousPunts = Math.max(0, (diagnostic.punts_recuperacio ?? 0) - puntsARestar)

    const { error: updateError } = await supabase
        .from('diagnostic')
        .update({ fase_actual: faseAnterior, num_sessions: 0, punts_recuperacio: nousPunts })
        .eq('id_diagnostic', idDiagnostic)

    if (updateError) return { ok: false, missatge: updateError.message }
    return { ok: true, faseAnterior }
}

// ============================================================
// Desassignar el fisioterapeuta d'un pacient
// ============================================================
export async function desassignarFisio(dniPacient) {
    console.log('Desassignar fisio:', dniPacient)
    const { data: relacio, error: errorRelacio } = await supabase
        .from('relacio_fisio_pacient')
        .select('dni_fisio')
        .eq('dni_pacient', dniPacient)
        .maybeSingle()

    if (errorRelacio) return { ok: false, missatge: errorRelacio.message }
    if (!relacio) return { ok: false, missatge: 'No tens cap fisioterapeuta assignat.' }

    const { error: errorDelete } = await supabase
        .from('relacio_fisio_pacient')
        .delete()
        .eq('dni_pacient', dniPacient)
        .eq('dni_fisio', relacio.dni_fisio)

    if (errorDelete) return { ok: false, missatge: errorDelete.message }
    return { ok: true }
}