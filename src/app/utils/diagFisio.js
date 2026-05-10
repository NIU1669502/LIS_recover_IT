import { supabase } from '../../utils/supabase'

// ============================================================
// Confirmar codi del fisioterapeuta i crear diagnòstic
// Calcula puntsFinals igual que processarTestDiagnostic
// ============================================================
export async function confirmarCodiFisio(dniPacient, codiIntroduit) {
    const codiNet = codiIntroduit.trim().toUpperCase()

    if (!codiNet) {
        return { ok: false, missatge: 'Introdueix un codi.' }
    }

    // ── 1. Validar que el codi existeix i no està confirmat ──
    const { data: relacio, error } = await supabase
        .from('relacio_fisio_pacient')
        .select('*')
        .eq('dni_pacient', dniPacient)
        .eq('codi_validacio', codiNet)
        .eq('confirmat', false)
        .maybeSingle()

    if (error || !relacio) {
        return { ok: false, missatge: 'El codi no és vàlid.' }
    }

    // ── 2. Confirmar vinculació ──────────────────────────────
    const { error: errorUpdate } = await supabase
        .from('relacio_fisio_pacient')
        .update({
            confirmat: true,
            codi_validacio: null
        })
        .eq('dni_fisio', relacio.dni_fisio)
        .eq('dni_pacient', relacio.dni_pacient)

    if (errorUpdate) {
        return { ok: false, missatge: errorUpdate.message }
    }

    // ── 3. Calcular puntsFinals (igual que processarTestDiagnostic) ──

    // Obtenir ids de les 3 fases de la rutina corresponent
    const { data: idFases } = await supabase
        .from('rutines_lesio')
        .select('id_fase_1, id_fase_2, id_fase_3')
        .eq('id_muscul', relacio.part_cos)
        .eq('id_lesio', relacio.id_lesio)
        .single()

    let puntsTotal = 0

    if (idFases) {
        // Obtenir info de les 3 fases en paral·lel (multiplicador + exercicis + n_sessions)
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

        if (infoFase1 && infoFase2 && infoFase3) {
            // Obtenir punts de tots els exercicis de les 3 fases
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
                (exercicisInfo || []).map(e => [e.id_exercici, e.punts])
            )

            // Funció auxiliar: suma punts d'una fase * multiplicador * n_sessions
            const calcularPuntsFase = (infoFase, multiplicador) =>
                [infoFase.exercici_1, infoFase.exercici_2, infoFase.exercici_3]
                    .filter(Boolean)
                    .reduce((acc, id) => acc + (puntsPer[id] ?? 0), 0) * (multiplicador ?? 1) * (infoFase.n_sessions ?? 1)

            const puntsFase1 = calcularPuntsFase(infoFase1, multifase1?.multiplicador)
            const puntsFase2 = calcularPuntsFase(infoFase2, multifase2?.multiplicador)
            const puntsFase3 = calcularPuntsFase(infoFase3, multifase3?.multiplicador)
            puntsTotal = puntsFase1 + puntsFase2 + puntsFase3
        }
    }

    // ── 4. Crear diagnòstic amb puntsFinals calculats ────────
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

    if (errorDiag) {
        return { ok: false, missatge: errorDiag.message }
    }

    return { ok: true }
}

// ============================================================
// Desassignar el fisioterapeuta d'un pacient
// Elimina la relació fisio-pacient i finalitza el diagnòstic actiu
// ============================================================
export async function desassignarFisio(dniPacient) {
    // ── 1. Obtenir la relació activa ─────────────────────────
    const { data: relacio, error: errorRelacio } = await supabase
        .from('relacio_fisio_pacient')
        .select('dni_fisio')
        .eq('dni_pacient', dniPacient)
        .maybeSingle()

    if (errorRelacio) {
        return { ok: false, missatge: errorRelacio.message }
    }

    if (!relacio) {
        return { ok: false, missatge: 'No tens cap fisioterapeuta assignat.' }
    }

    // ── 2. Eliminar la relació fisio-pacient ─────────────────
    const { error: errorDelete } = await supabase
        .from('relacio_fisio_pacient')
        .delete()
        .eq('dni_pacient', dniPacient)
        .eq('dni_fisio', relacio.dni_fisio)

    if (errorDelete) {
        return { ok: false, missatge: errorDelete.message }
    }

    // ── 3. Finalitzar el diagnòstic actiu (si n'hi ha) ───────
    await supabase
        .from('diagnostic')
        .update({ finalitzat: true })
        .eq('dni_pacient', dniPacient)
        .eq('finalitzat', false)

    return { ok: true }
}