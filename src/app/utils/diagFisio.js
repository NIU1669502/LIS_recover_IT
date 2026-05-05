import { supabase } from '../../utils/supabase'

// ============================================================
// Confirmar codi del fisioterapeuta i crear diagnòstic
// ============================================================
export async function confirmarCodiFisio(dniPacient, codiIntroduit) {
    const codiNet = codiIntroduit.trim().toUpperCase()

    if (!codiNet) {
        return { ok: false, missatge: 'Introdueix un codi.' }
    }

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

    // Confirmar vinculació
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

    // Crear diagnòstic automàtic
    const { error: errorDiag } = await supabase
        .from('diagnostic')
        .insert([{
            dni_pacient: relacio.dni_pacient,
            id_lesio: relacio.id_lesio,
            part_cos: relacio.part_cos,
            descripcio: relacio.descripcio || null,
            fase_actual: 1,
            finalitzat: false,
            num_sessions: 0,
            punts_recuperacio: 0
        }])

    if (errorDiag) {
        return { ok: false, missatge: errorDiag.message }
    }

    return { ok: true }
}