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
        return { tipus: 'Esquinç muscular', emoji: '🤕', temps: '3-6 setmanes', sessions: '12-15', fase: 'Fase 1 - Inicial' }
    if (onset === 0 && mobilitat === 1)
        return { tipus: 'Distensió muscular', emoji: '😖', temps: '2-4 setmanes', sessions: '8-10', fase: 'Fase 1 - Inicial' }
    if (dolor === 1 || dolor === 2)
        return { tipus: 'Contractura / Sobrecàrrega', emoji: '😫', temps: '5-10 dies', sessions: '5-7', fase: 'Fase 1 - Inicial' }

    return { tipus: 'Distensió muscular', emoji: '😖', temps: '2-4 setmanes', sessions: '8-10', fase: 'Fase 1 - Inicial' }
}

// ============================================================
// RF-PAC-01 — Crea SEMPRE una nova lesió (mai sobreescriu)
// Cada cop que un pacient fa el test, s'afegeix una nova entrada
// a l'historial de lesions. Les lesions anteriors es conserven.
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

        // 1. Buscar o crear el tipus de lesió a la taula 'lesions'
        let idLesioFinal = null;
        const { data: lesioExistent } = await supabase
            .from('lesions')
            .select('id_lesio')
            .eq('nom', resultat.tipus)
            .maybeSingle()
            
        if (lesioExistent) {
            idLesioFinal = lesioExistent.id_lesio;
        } else {
            const { data: novaLesio } = await supabase
                .from('lesions')
                .insert([{ nom: resultat.tipus }])
                .select('id_lesio')
                .single()
            if (novaLesio) idLesioFinal = novaLesio.id_lesio;
        }

        // 2. Inserir a la nova taula 'diagnostic' per mantenir l'historial del pacient
        const { error } = await supabase
            .from('diagnostic')
            .insert([{
                dni_pacient: userDni,
                id_lesio: idLesioFinal,
                part_cos: idCos,
                descripcio: resultat.descripcio || 'Sense descripció',
                data_inici: new Date().toISOString(),
                fase_actual: 1
                // Els camps punts_recuperacio, recuperat, data_fi ja no estan a la BD actualment
            }])

        if (error) {
            console.error('Error al guardar la lesió a Supabase:', error)
            showToast(`Hi ha hagut un problema al guardar el resultat: ${error.message}`, 'error')
            return
        }

        showToast('Diagnòstic completat i guardat amb èxit!', 'success')
        navegarA('perfil')
    } catch (err) {
        console.error('Error inesperat:', err)
    }
}

// ============================================================
// Marca una lesió com a recuperada i estableix data_fi.
// Cridat AUTOMÀTICAMENT pel sistema quan punts >= objectiu.
// El pacient NO pot invocar aquesta acció manualment.
// ============================================================
export async function marcarLesioRecuperada(idDiagnostic) {
    // NOTA: Ara mateix la BD (taula diagnostic) no té els camps 'recuperat' ni 'data_fi'.
    // Així que de moment no fem l'update per no provocar un error d'SQL.
    /*
    const { error } = await supabase
        .from('diagnostic')
        .update({
            recuperat: true,
            data_fi: new Date().toISOString(),
        })
        .eq('id_diagnostic', idDiagnostic)

    if (error) {
        showToast(`Error en marcar la lesió com a recuperada: ${error.message}`, 'error')
        return false
    }
    */
    showToast('Enhorabona! Has completat la teva recuperació. 🎉', 'success')
    return true
}