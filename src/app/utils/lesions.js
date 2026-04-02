import { supabase } from '../../utils/supabase'
import { TEST_STEPS } from '../data/testSteps.js'

// ============================================================
// Determina el tipus de lesió a partir de les respostes del test
// ============================================================
export function determinarLesio(respostes) {
    const onset = respostes[1]    // 0=cop, 1=gradual, 2=dormint
    const dolor = respostes[2]    // 0=agut, 1=rigidesa, 2=tibantor
    const mobilitat = respostes[3] // 0=poc, 1=molèstia, 2=sí

    if (onset === 0 && mobilitat === 0)
        return { tipus: 'Esquinç muscular', emoji: '🤕', temps: '3-6 setmanes', sessions: '12-15', fase: 'Fase 1 - Inicial' }
    if (onset === 0 && mobilitat === 1)
        return { tipus: 'Distensió muscular', emoji: '😖', temps: '2-4 setmanes', sessions: '8-10', fase: 'Fase 1 - Inicial' }
    if (dolor === 1 || dolor === 2)
        return { tipus: 'Contractura / Sobrecàrrega', emoji: '😫', temps: '5-10 dies', sessions: '5-7', fase: 'Fase 1 - Inicial' }

    return { tipus: 'Distensió muscular', emoji: '😖', temps: '2-4 setmanes', sessions: '8-10', fase: 'Fase 1 - Inicial' }
}

// ============================================================
// RF-PAC-01 — Guarda o actualitza la lesió a Supabase
// ============================================================
export async function processarTestDiagnostic(resultat, navegarA) {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
            alert("Has d'iniciar sessió per poder guardar el teu diagnòstic.")
            return
        }

        const userDni = session.user.user_metadata?.dni

        // Determinar id_cos (de l'1 al 7 segons l'índex de l'array de músculs)
        const idxCos = TEST_STEPS[0].opcions.indexOf(resultat.muscle)
        const idCos = idxCos >= 0 ? idxCos + 1 : 1

        // Comprovar si ja té una lesió guardada
        const { data: lesioAnterior } = await supabase
            .from('lesions')
            .select('id_lesio')
            .eq('dni_pacient', userDni)
            .limit(1)

        if (lesioAnterior && lesioAnterior.length > 0) {
            // ACTUALITZAR LA LESIÓ EXISTENT
            const id_lesio_existent = lesioAnterior[0].id_lesio

            const { error } = await supabase
                .from('lesions')
                .update({
                    id_cos: idCos,
                    nom_lesio: resultat.tipus,
                    descripcio: resultat.descripcio || 'Sense descripció',
                    punts_recuperacio_objectiu: 100,
                    recuperat: false,
                    dia_rehabilitacio: 1,
                })
                .eq('id_lesio', id_lesio_existent)

            if (error) {
                console.error('Error al actualitzar a Supabase:', error)
                alert(`Hi ha hagut un problema a l'actualitzar el resultat: ${error.message}`)
                return
            }
        } else {
            // CREAR UNA NOVA LESIÓ
            const { data: ultimaLesio } = await supabase
                .from('lesions')
                .select('id_lesio')
                .order('id_lesio', { ascending: false })
                .limit(1)

            const novaIdLesio = ultimaLesio && ultimaLesio.length > 0 ? ultimaLesio[0].id_lesio + 1 : 1

            const { error } = await supabase
                .from('lesions')
                .insert([
                    {
                        id_lesio: novaIdLesio,
                        dni_pacient: userDni || '00000000A',
                        id_cos: idCos,
                        nom_lesio: resultat.tipus,
                        descripcio: resultat.descripcio || 'Sense descripció',
                        punts_recuperacio_objectiu: 100,
                        recuperat: false,
                        dia_rehabilitacio: 1,
                    },
                ])

            if (error) {
                console.error('Error al guardar a Supabase:', error)
                alert(`Hi ha hagut un problema al guardar el resultat: ${error.message}`)
                return
            }
        }

        alert('Diagnòstic completat i guardat amb èxit!')
        navegarA('exercici')
    } catch (err) {
        console.error('Error inesperat:', err)
    }
}