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

    const [racha, setRacha] = useState(0)

    const agruparPerDia = (dades) => {
        const grups = {}
        dades.forEach(item => {
            const dia = item.data_realitzacio
            if (!grups[dia]) grups[dia] = []
            grups[dia].push(item)
        })
        return grups
    }

    const calcularRacha = (sessionsArr) => {
        if (!sessionsArr || sessionsArr.length === 0) return 0;
        
        // Obtenir dates úniques (només la part de la data YYYY-MM-DD en hora local)
        const datesUniques = [...new Set(sessionsArr.map(s => {
            const d = new Date(s.data_realitzacio);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }))];
        
        // Ordenar dates descendentment
        datesUniques.sort((a, b) => b.localeCompare(a));

        const avui = new Date();
        const strAvui = `${avui.getFullYear()}-${String(avui.getMonth() + 1).padStart(2, '0')}-${String(avui.getDate()).padStart(2, '0')}`;
        
        const ahir = new Date(avui);
        ahir.setDate(ahir.getDate() - 1);
        const strAhir = `${ahir.getFullYear()}-${String(ahir.getMonth() + 1).padStart(2, '0')}-${String(ahir.getDate()).padStart(2, '0')}`;

        // Si l'última sessió no és ni d'avui ni d'ahir, s'ha trencat la racha
        if (datesUniques[0] !== strAvui && datesUniques[0] !== strAhir) {
            return 0;
        }

        let rachaActual = 1;
        let dataActualStr = datesUniques[0];

        // Comprovar dies consecutius cap enrere
        for (let i = 1; i < datesUniques.length; i++) {
            const prevDateObj = new Date(dataActualStr);
            prevDateObj.setDate(prevDateObj.getDate() - 1);
            const prevExpectedStr = `${prevDateObj.getFullYear()}-${String(prevDateObj.getMonth() + 1).padStart(2, '0')}-${String(prevDateObj.getDate()).padStart(2, '0')}`;
            
            if (datesUniques[i] === prevExpectedStr) {
                rachaActual++;
                dataActualStr = datesUniques[i];
            } else {
                break;
            }
        }
        
        return rachaActual;
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
                        diagnostic!inner (
                            musculs:part_cos ( nom )
                        ),
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
                setRacha(0)
            } else {
                const fetchedSessions = sessionsRes.data || [];
                setSessions(fetchedSessions)
                setRacha(calcularRacha(fetchedSessions))
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
        const channelName = `historial-sessions-${dni}-${Math.random().toString(36).substring(2, 9)}`
        const canal = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'historial_sessions', filter: `dni_pacient=eq.${dni}` },
                () => carregar()
            )
            .subscribe()

        return () => { supabase.removeChannel(canal) }
    }, [dni, idDiagnosticFiltre])

    return { sessions, historial, carregant, error, racha }
}
