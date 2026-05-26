import { supabase } from '../../utils/supabase'

// ============================================================
// Objectius / Missions del pacient
//
// 4 objectius que un cop assolits mai es desmarquen:
//   1. primera_sessio      — Completar la primera sessió
//   2. primer_diagnostic   — Realitzar el primer test diagnòstic
//   3. primera_cura        — Curar-se completament d'una lesió
//   4. fisio_assignat      — Tenir un fisio assignat (relació confirmada)
// ============================================================

/**
 * Retorna l'estat actual dels objectius d'un pacient.
 * Si no existeix la fila, la crea amb tots els valors a false.
 */
export async function obtenirObjectius(dniPacient) {
    if (!dniPacient) return null

    const { data, error } = await supabase
        .from('objectius_pacient')
        .select('*')
        .eq('dni_pacient', dniPacient)
        .maybeSingle()

    if (error) {
        // La taula no existeix encara, retornem un objecte per defecte perquè la UI no peti
        return {
            primera_sessio: false,
            primer_diagnostic: false,
            primera_cura: false,
            fisio_assignat: false
        }
    }

    // Si no té fila, la creem
    if (!data) {
        const { data: nova, error: insertError } = await supabase
            .from('objectius_pacient')
            .insert([{ dni_pacient: dniPacient }])
            .select()
            .single()

        if (insertError) {
            return {
                primera_sessio: false,
                primer_diagnostic: false,
                primera_cura: false,
                fisio_assignat: false
            }
        }
        return nova
    }

    return data
}

/**
 * Marca un objectiu com a completat (mai el desmarca).
 * @param {string} dniPacient
 * @param {'primera_sessio'|'primer_diagnostic'|'primera_cura'|'fisio_assignat'} clau
 */
export async function completarObjectiu(dniPacient, clau) {
    if (!dniPacient || !clau) return

    // Primer assegurem que la fila existeix
    await obtenirObjectius(dniPacient)

    const { error } = await supabase
        .from('objectius_pacient')
        .update({ [clau]: true })
        .eq('dni_pacient', dniPacient)

    if (error) {
        // Silenciem l'error si la taula no existeix
    }
}

/**
 * Comprova si algun objectiu hauria d'estar marcat basant-se en
 * l'estat actual de la BD (per si algú va completar l'acció
 * abans que existís la taula d'objectius).
 */
export async function sincronitzarObjectius(dniPacient) {
    if (!dniPacient) return null

    const obj = await obtenirObjectius(dniPacient)
    if (!obj) return null

    const updates = {}

    // 1. primera_sessio — comprovar si hi ha almenys 1 sessió a l'historial
    if (!obj.primera_sessio) {
        const { count } = await supabase
            .from('historial_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('dni_pacient', dniPacient)
        if (count > 0) updates.primera_sessio = true
    }

    // 2. primer_diagnostic — comprovar si hi ha almenys 1 diagnòstic
    if (!obj.primer_diagnostic) {
        const { count } = await supabase
            .from('diagnostic')
            .select('id_diagnostic', { count: 'exact', head: true })
            .eq('dni_pacient', dniPacient)
        if (count > 0) updates.primer_diagnostic = true
    }

    // 3. primera_cura — comprovar si hi ha almenys 1 diagnòstic finalitzat (no soft-deleted)
    if (!obj.primera_cura) {
        const { count } = await supabase
            .from('diagnostic')
            .select('id_diagnostic', { count: 'exact', head: true })
            .eq('dni_pacient', dniPacient)
            .eq('finalitzat', true)
            .neq('punts_recuperacio', -1)
        if (count > 0) updates.primera_cura = true
    }

    // 4. fisio_assignat — comprovar si ACTUALMENT hi ha almenys 1 relació confirmada
    // Aquest objectiu es pot desmarcar si es perd el fisio
    const { count: countFisio } = await supabase
        .from('relacio_fisio_pacient')
        .select('*', { count: 'exact', head: true })
        .eq('dni_pacient', dniPacient)
        .eq('confirmat', true)
        
    const teFisio = countFisio > 0
    if (obj.fisio_assignat !== teFisio) {
        updates.fisio_assignat = teFisio
    }

    // Aplicar actualitzacions si n'hi ha
    if (Object.keys(updates).length > 0) {
        const { error } = await supabase
            .from('objectius_pacient')
            .update(updates)
            .eq('dni_pacient', dniPacient)

        // Silenciem l'error si la taula no existeix
        
        return { ...obj, ...updates }
    }

    return obj
}
