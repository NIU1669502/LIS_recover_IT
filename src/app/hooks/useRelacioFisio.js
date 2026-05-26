import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../utils/supabase'
import { getRelacioXatPacient } from '../utils/xat'

function eliminarCanalPerNom(channelName) {
    const existent = supabase
        .getChannels()
        .find(c => c.topic === `realtime:${channelName}`)
    if (existent) {
        supabase.removeChannel(existent)
    }
}

// Només des de page.jsx
export function useRelacioFisioConfirmada(dniPacient) {
    const [relacio, setRelacio] = useState(null)
    const [carregant, setCarregant] = useState(true)

    const carregar = useCallback(async () => {
        if (!dniPacient) {
            setRelacio(null)
            setCarregant(false)
            return
        }
        setCarregant(true)
        const r = await getRelacioXatPacient(dniPacient)
        setRelacio(r)
        setCarregant(false)
    }, [dniPacient])

    useEffect(() => {
        if (!dniPacient) {
            setRelacio(null)
            setCarregant(false)
            return
        }

        let actiu = true
        const channelName = `relacio-fisio-${dniPacient}`

        carregar()

        eliminarCanalPerNom(channelName)

        const canal = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'relacio_fisio_pacient',
                    filter: `dni_pacient=eq.${dniPacient}`,
                },
                () => {
                    if (actiu) carregar()
                }
            )
            .subscribe()

        return () => {
            actiu = false
            supabase.removeChannel(canal)
        }
    }, [dniPacient, carregar])

    return {
        teFisio: !!relacio,
        relacio,
        carregant,
    }
}
