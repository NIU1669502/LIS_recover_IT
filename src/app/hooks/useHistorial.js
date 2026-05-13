import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'

// ============================================================
// Hook: useHistorial
// Obté l'historial de SESSIONS (dia + fase + lesió) i, per
// compatibilitat, també retorna l'historial d'exercicis agrupats
// per dia per components que encara el facin servir.
// ============================================================
export function useHistorial(dni, idDiagnosticFiltre = null) {
    const [sessions, setSessions] = useState([])
    const [historial, setHistorial] = useState({})
    const [carregant, setCarregant] = useState(true)
    const [error, setError] = useState(null)

    const agruparPerDia = (dades) => {
        const grups = {}
        dades.forEach(item => {
            const dia = item.data_realitzacio
            if (!grups[dia]) grups[dia] = []
            grups[dia].push(item)
        })
        return grups
    }

    useEffect(() => {
        if (!dni) return

        const carregar = async () => {
            setCarregant(true)
            setError(null)

            let sessionsQuery = supabase
                .from('historial_sessions')
                .select(`
                        id_sessio,
                        data_realitzacio,
                        fase,
                        punts_obtinguts,
                        id_diagnostic,
                        id_lesio,
                        lesions ( nom )
                    `)
                .eq('dni_pacient', dni)

            if (idDiagnosticFiltre != null && idDiagnosticFiltre !== '') {
                sessionsQuery = sessionsQuery.eq('id_diagnostic', idDiagnosticFiltre)
            }

            const [sessionsRes, exercicisRes] = await Promise.all([
                sessionsQuery.order('data_realitzacio', { ascending: false }),

                supabase
                    .from('historial_exercicis_diaris')
                    .select(`
                        id_historial,
                        temps_realitzat_segons,
                        data_realitzacio,
                        completat,
                        punts_obtinguts,
                        exercicis ( nom, descripcio, duracio_segons )
                    `)
                    .eq('dni_pacient', dni)
                    .order('data_realitzacio', { ascending: false }),
            ])

            if (sessionsRes.error) {
                setError(sessionsRes.error.message)
                setSessions([])
            } else {
                setSessions(sessionsRes.data || [])
            }

            if (exercicisRes.error) {
                setHistorial({})
            } else {
                setHistorial(agruparPerDia(exercicisRes.data || []))
            }

            setCarregant(false)
        }

        carregar()

        // ── Realtime: actualitzar quan s'insereix una nova sessió ──
        const canal = supabase
            .channel(`historial-sessions-${dni}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'historial_sessions', filter: `dni_pacient=eq.${dni}` },
                () => carregar()
            )
            .subscribe()

        return () => { supabase.removeChannel(canal) }
    }, [dni, idDiagnosticFiltre])

    return { sessions, historial, carregant, error }
}
