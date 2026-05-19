import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../utils/supabase'
import { fetchMissatgesXat, enviarMissatgeXat } from '../utils/xat'

function eliminarCanalPerNom(channelName) {
    const existent = supabase
        .getChannels()
        .find(c => c.topic === `realtime:${channelName}`)
    if (existent) {
        supabase.removeChannel(existent)
    }
}

// ============================================================
// Hook: missatges d'una conversa + realtime
// ============================================================
export function useXat({ dniFisio, dniPacient, dniUsuari, actiu = true }) {
    const [missatges, setMissatges] = useState([])
    const [carregant, setCarregant] = useState(true)
    const [error, setError] = useState(null)
    const [enviant, setEnviant] = useState(false)

    const conversaActiva = actiu && dniFisio && dniPacient

    useEffect(() => {
        if (!conversaActiva) {
            setMissatges([])
            setCarregant(false)
            return
        }

        let cancelat = false

        const carregar = async () => {
            setCarregant(true)
            setError(null)
            const { data, error: err } = await fetchMissatgesXat(dniFisio, dniPacient)
            if (cancelat) return
            if (err) {
                setError(err.message)
                setMissatges([])
            } else {
                setMissatges(data || [])
            }
            setCarregant(false)
        }

        carregar()

        const channelName = `xat-${dniFisio}-${dniPacient}`
        eliminarCanalPerNom(channelName)

        const canal = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'missatges_xat',
                    filter: `dni_fisio=eq.${dniFisio}`,
                },
                (payload) => {
                    const nou = payload.new
                    if (nou?.dni_pacient !== dniPacient) return
                    setMissatges(prev => {
                        if (prev.some(m => m.id_missatge === nou.id_missatge)) return prev
                        return [...prev, nou]
                    })
                }
            )
            .subscribe()

        return () => {
            cancelat = true
            supabase.removeChannel(canal)
        }
    }, [conversaActiva, dniFisio, dniPacient])

    const enviar = useCallback(async (contingut) => {
        if (!conversaActiva || !dniUsuari) {
            return { ok: false, missatge: 'Conversa no disponible.' }
        }
        setEnviant(true)
        const res = await enviarMissatgeXat({
            dniFisio,
            dniPacient,
            remitentDni: dniUsuari,
            contingut,
        })
        setEnviant(false)
        return res
    }, [conversaActiva, dniFisio, dniPacient, dniUsuari])

    return { missatges, carregant, error, enviant, enviar }
}
