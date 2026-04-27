import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'

// ============================================================
// Hook: useHistorial
// Obté l'historial d'exercicis i l'agrupa per dia (sessió)
// ============================================================
export function useHistorial(dni) {
    const [historial, setHistorial] = useState({})
    const [carregant, setCarregant] = useState(true)
    const [error, setError] = useState(null)

    // ── Agrupar exercicis per dia ────────────────────────────
    const agruparPerDia = (dades) => {
        const grups = {}

        dades.forEach(item => {
            const dia = item.data_realitzacio

            if (!grups[dia]) {
                grups[dia] = []
            }

            grups[dia].push(item)
        })

        return grups
    }

    useEffect(() => {
        if (!dni) return

        const carregarHistorial = async () => {
            setCarregant(true)

            const { data, error } = await supabase
                .from('historial_exercicis_diaris')
                .select(`
                    id_historial,
                    temps_realitzat_segons,
                    data_realitzacio,
                    completat,
                    punts_obtinguts,
                    exercicis (
                        nom,
                        descripcio,
                        duracio_segons
                    )
                `)
                .eq('dni_pacient', dni)
                .order('data_realitzacio', { ascending: false })

            if (error) {
                setError(error.message)
                setHistorial({})
            } else {
                const agrupat = agruparPerDia(data)
                setHistorial(agrupat)
            }

            setCarregant(false)
        }

        carregarHistorial()
    }, [dni])

    return { historial, carregant, error }
}