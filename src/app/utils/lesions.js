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
        .order('id_diagnostic', { ascending: false })
        .limit(1)
        .single()

    if (error || !diagnostic) return null
    return diagnostic
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
export async function completarSessio(userDni, puntsGuanyats) {
    // 1. Agafar diagnòstic actual
    const diagnostic = await getDiagnosticActiu(userDni)
    if (!diagnostic) return { completada: false }

    const novaFase = diagnostic.fase_actual + 1
    const completada = novaFase > 3

    // 2. Actualitzar fase (o marcar com completat)
    await supabase
        .from('diagnostic')
        .update({ fase_actual: completada ? 3 : novaFase })
        .eq('id_diagnostic', diagnostic.id_diagnostic)

    // 3. Sumar punts a l'usuari
    const { data: usuari } = await supabase
        .from('usuaris')
        .select('punts')
        .eq('dni', userDni)
        .single()

    if (usuari) {
        await supabase
            .from('usuaris')
            .update({ punts: (usuari.punts || 0) + puntsGuanyats })
            .eq('dni', userDni)
    }

    return { completada, novaFase: completada ? null : novaFase }
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

        const { data: diagnosticAnterior } = await supabase
            .from('diagnostic')
            .select('id_diagnostic')
            .eq('dni_pacient', userDni)
            .limit(1)

        if (diagnosticAnterior && diagnosticAnterior.length > 0) {
            const { error } = await supabase
                .from('diagnostic')
                .update({
                    part_cos: idCos,
                    id_lesio: resultat.id_lesio,
                    descripcio: resultat.descripcio || 'Sense descripció',
                    fase_actual: 1,
                })
                .eq('id_diagnostic', diagnosticAnterior[0].id_diagnostic)

            if (error) {
                console.error('Error al actualitzar:', error)
                showToast(`Hi ha hagut un problema: ${error.message}`, 'error')
                return
            }
        } else {
            const { data: ultim } = await supabase
                .from('diagnostic')
                .select('id_diagnostic')
                .order('id_diagnostic', { ascending: false })
                .limit(1)

            const novaId = ultim && ultim.length > 0 ? ultim[0].id_diagnostic + 1 : 1

            const { error } = await supabase
                .from('diagnostic')
                .insert([{
                    id_diagnostic: novaId,
                    id_lesio: resultat.id_lesio,
                    dni_pacient: userDni,
                    part_cos: idCos,
                    descripcio: resultat.descripcio || 'Sense descripció',
                    fase_actual: 1,
                }])

            if (error) {
                console.error('Error al guardar:', error)
                showToast(`Hi ha hagut un problema: ${error.message}`, 'error')
                return
            }
        }

        showToast('Diagnòstic completat i guardat amb èxit!', 'success')
        navegarA('exercicis-en-curs')
    } catch (err) {
        console.error('Error inesperat:', err)
    }
}