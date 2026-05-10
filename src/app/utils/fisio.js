import { supabase } from '../../utils/supabase'
import { showToast } from '../utils/toast'

// ============================================================
// Genera un codi aleatori (lletres + números en majúscula)
// ============================================================
function generarCodiValidacio(longitud = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let resultat = ''

    for (let i = 0; i < longitud; i++) {
        resultat += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return resultat
}

// ============================================================
// Obté tots els pacients vinculats a un fisioterapeuta
// ============================================================
export async function getPacientsDeFisio(dniFisio) {
    const { data, error } = await supabase
        .from('relacio_fisio_pacient')
        .select(`
            dni_pacient,
            data_vinculacio,
            confirmat,
            codi_validacio,
            part_cos,
            id_lesio,
            descripcio
        `)
        .eq('dni_fisio', dniFisio)

    if (error || !data) return []

    const dniPacients = data.map(r => r.dni_pacient)
    if (dniPacients.length === 0) return []

    // Obtenir dades bàsiques dels pacients
    const { data: usuaris, error: usuarisError } = await supabase
        .from('usuaris')
        .select('dni, nom')
        .in('dni', dniPacients)

    if (usuarisError || !usuaris) return []

    // Obtenir diagnòstics actius de cada pacient
    const { data: diagnostics } = await supabase
        .from('diagnostic')
        .select(`
            dni_pacient,
            id_diagnostic,
            fase_actual,
            num_sessions,
            finalitzat,
            id_lesio,
            part_cos
        `)
        .in('dni_pacient', dniPacients)
        .order('id_diagnostic', { ascending: false })

    // IDs necessaris (diagnòstics + pendents)
    const idsLesions = [
        ...new Set([
            ...(diagnostics || []).map(d => d.id_lesio),
            ...data.map(d => d.id_lesio)
        ].filter(Boolean))
    ]

    const idsMusculs = [
        ...new Set([
            ...(diagnostics || []).map(d => d.part_cos),
            ...data.map(d => d.part_cos)
        ].filter(Boolean))
    ]

    // Obtenir noms de lesions
    let nomLesions = {}
    if (idsLesions.length > 0) {
        const { data: lesions } = await supabase
            .from('lesions')
            .select('id_lesio, nom')
            .in('id_lesio', idsLesions)

            ; (lesions || []).forEach(l => {
                nomLesions[l.id_lesio] = l.nom
            })
    }

    // Obtenir noms de músculs
    let nomMusculs = {}
    if (idsMusculs.length > 0) {
        const { data: musculs } = await supabase
            .from('musculs')
            .select('id_cos, nom')
            .in('id_cos', idsMusculs)

            ; (musculs || []).forEach(m => {
                nomMusculs[m.id_cos] = m.nom
            })
    }

    // Combinar dades
    return usuaris.map(u => {
        const vinculacio = data.find(r => r.dni_pacient === u.dni)
        const diagnostic = (diagnostics || []).find(d => d.dni_pacient === u.dni) || null

        return {
            dni: u.dni,
            nom: u.nom,
            data_vinculacio: vinculacio?.data_vinculacio,
            confirmat: vinculacio?.confirmat !== false,
            codi_validacio: vinculacio?.codi_validacio || null,
            relacio: vinculacio,
            diagnostic: diagnostic
                ? {
                    ...diagnostic,
                    nom_lesio: nomLesions[diagnostic.id_lesio] || 'Desconeguda',
                    nom_muscul: nomMusculs[diagnostic.part_cos] || 'Desconegut'
                }
                : null,
            diagnosticPendent:
                vinculacio?.confirmat === false
                    ? {
                        nom_lesio: nomLesions[vinculacio.id_lesio] || 'Desconeguda',
                        nom_muscul: nomMusculs[vinculacio.part_cos] || 'Desconegut',
                        descripcio: vinculacio.descripcio
                    }
                    : null
        }
    })
}

// ============================================================
// Calcula el progrés global d'un pacient (0-100)
// ============================================================
export async function getProgresTotal(diagnostic) {
    if (!diagnostic) return 0

    const {data : punts} = await supabase
    .from('diagnostic')
    .select('punts_recuperacio, puntsFinals')
    .eq('id_diagnostic', diagnostic.id_diagnostic)
    .single() 

    if (diagnostic.finalitzat) return 100

    return Math.round((punts.punts_recuperacio / punts.puntsFinals) * 100)
}

// ============================================================
// Vincula un pacient a un fisioterapeuta amb diagnòstic pendent
// ============================================================
export async function vincularPacient(
    dniFisio,
    dniPacient,
    partCos,
    idLesio,
    descripcio = ''
) {
    const dniNet = dniPacient.trim().toUpperCase()

    // Verificar que el pacient existeix i NO és fisioterapeuta
    const { data: pacient, error: pacientError } = await supabase
        .from('usuaris')
        .select('dni, nom, es_fisioterapeuta')
        .eq('dni', dniNet)
        .maybeSingle()

    if (pacientError || !pacient) {
        return { ok: false, missatge: 'No s\'ha trobat cap usuari amb aquest DNI.' }
    }

    if (pacient.es_fisioterapeuta) {
        return { ok: false, missatge: 'Aquest DNI correspon a un fisioterapeuta.' }
    }

    // Verificar si ja existeix relació
    const { data: existent } = await supabase
        .from('relacio_fisio_pacient')
        .select('dni_pacient')
        .eq('dni_fisio', dniFisio)
        .eq('dni_pacient', dniNet)
        .maybeSingle()

    if (existent) {
        return { ok: false, missatge: 'Aquest pacient ja està vinculat.' }
    }

    const codi = generarCodiValidacio(8)

    const { error: insertError } = await supabase
        .from('relacio_fisio_pacient')
        .insert([{
            dni_fisio: dniFisio,
            dni_pacient: dniNet,
            part_cos: partCos,
            id_lesio: idLesio,
            descripcio: descripcio || null,
            codi_validacio: codi,
            confirmat: false
        }])

    if (insertError) {
        return { ok: false, missatge: `Error en vincular: ${insertError.message}` }
    }

    return {
        ok: true,
        nomPacient: pacient.nom,
        codi
    }
}

// ============================================================
// Estadístiques globals del fisio per al panell
// ============================================================
export async function getEstadistiquesFisio(dniFisio) {
    const pacients = await getPacientsDeFisio(dniFisio)

    let actius = 0
    let enRecuperacio = 0
    let finalitzats = 0
    let pendents = 0

    for (const p of pacients) {
        if (p.confirmat === false) {
            pendents++
            continue
        }

        if (!p.diagnostic) {
            actius++
        } else if (p.diagnostic.finalitzat) {
            finalitzats++
        } else {
            enRecuperacio++
            actius++
        }
    }

    return {
        total: pacients.length,
        actius,
        enRecuperacio,
        finalitzats,
        pendents,
        pacients
    }
}
