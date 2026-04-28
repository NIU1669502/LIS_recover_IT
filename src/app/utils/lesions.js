import { supabase } from '../../utils/supabase'
import { TEST_STEPS } from '../data/testSteps.js'
import { showToast } from '../utils/toast'

// ============================================================
// Determina el tipus de lesió a partir de les respostes del test
// ============================================================
export function determinarLesio(respostes) {
    const onset = respostes[1]    // 0=cop, 1=gradual, 2=dormint
    const dolor = respostes[2]    // 0=agut, 1=rigidesa, 2=tibantor
    const mobilitat = respostes[3] // 0=poc, 1=molèstia, 2=sí

    if (onset === 0 && mobilitat === 0)
        return { tipus: 'Esquinç muscular', id_lesio: 1, emoji: '🤕', temps: '3-6 setmanes', sessions: '12-15', fase: 'Fase 1 - Inicial' }
    if (onset === 0 && mobilitat === 1)
        return { tipus: 'Distensió muscular', id_lesio: 2, emoji: '😖', temps: '2-4 setmanes', sessions: '8-10', fase: 'Fase 1 - Inicial' }
    if (dolor === 1 || dolor === 2)
        return { tipus: 'Contractura / Sobrecàrrega', id_lesio: 3, emoji: '😫', temps: '5-10 dies', sessions: '5-7', fase: 'Fase 1 - Inicial' }

    return { tipus: 'Distensió muscular', id_lesio: 2, emoji: '😖', temps: '2-4 setmanes', sessions: '8-10', fase: 'Fase 1 - Inicial' }
}

// ============================================================
// RF-PAC-01 — Guarda o actualitza la lesió a Supabase
// ============================================================
export async function processarTestDiagnostic(resultat, navegarA) {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
            showToast("Has d'iniciar sessió per poder guardar el teu diagnòstic.", 'warning')
            return
        }

        const userDni = session.user.user_metadata?.dni

        // Determinar id_cos (de l'1 al 7 segons l'índex de l'array de músculs)
        const idxCos = TEST_STEPS[0].opcions.indexOf(resultat.muscle)
        const idCos = idxCos >= 0 ? idxCos + 1 : 1

        // Comprovar si ja té un diagnòstic guardada
        const { data: diagnosticAnterior } = await supabase
            .from('diagnostic')
            .select('id_diagnostic')
            .eq('dni_pacient', userDni)
            .limit(1)

        if (diagnosticAnterior && diagnosticAnterior.length > 0) {
            // ACTUALITZAR UN DIAGNÒSTIC EXISTENT
            const id_diagnostic_existent = diagnosticAnterior[0].id_diagnostic

            const { error } = await supabase
                .from('diagnostic')
                .update({
                    part_cos: idCos,
                    id_lesio: resultat.id_lesio,
                    descripcio: resultat.descripcio || 'Sense descripció',
                })
                .eq('id_diagnostic', id_diagnostic_existent)

            if (error) {
                console.error('Error al actualitzar a Supabase:', error)
                showToast("Hi ha hagut un problema a l'actualitzar el resultat: ${error.message}", 'error')
                return
            }
        } else {
            // CREAR UN NOU DIAGNÒSTIC
            const { data: ultimDiagnostic } = await supabase
                .from('diagnostic')
                .select('id_diagnostic')
                .order('id_diagnostic', { ascending: false })
                .limit(1)

            const novaIdDiagnostic = ultimDiagnostic && ultimDiagnostic.length > 0 ? ultimDiagnostic[0].id_diagnostic + 1 : 1

            const { error } = await supabase
                .from('diagnostic')
                .insert([
                    {
                        id_diagnostic: novaIdDiagnostic,
                        id_lesio: resultat.id_lesio,
                        dni_pacient: userDni || '00000000A',
                        part_cos: idCos,
                        descripcio: resultat.descripcio || 'Sense descripció',

                    },
                ])

            if (error) {
                console.error('Error al guardar a Supabase:', error)
                showToast('Hi ha hagut un problema al guardar el resultat: ${error.message}', 'error')
                return
            }
        }

        showToast('Diagnòstic completat i guardat amb èxit!', 'success')
        navegarA('exercicis-en-curs')
    } catch (err) {
        console.error('Error inesperat:', err)
    }
}