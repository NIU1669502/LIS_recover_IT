import { supabase } from '../../utils/supabase'
import { showToast } from '../utils/toast'

function generarCodiValidacio(longitud = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let resultat = ''

    for (let i = 0; i < longitud; i++) {
        resultat += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return resultat
}

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

    const { data: usuaris, error: usuarisError } = await supabase
        .from('usuaris')
        .select('dni, nom')
        .in('dni', dniPacients)

    if (usuarisError || !usuaris) return []

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
        .eq('finalitzat', false)
        .order('id_diagnostic', { ascending: false })

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

export async function getProgresTotal(diagnostic) {
    if (!diagnostic) return 0

    const { data: punts } = await supabase
        .from('diagnostic')
        .select('punts_recuperacio, puntsFinals')
        .eq('id_diagnostic', diagnostic.id_diagnostic)
        .single()

    if (diagnostic.finalitzat) return 100

    return Math.round((punts.punts_recuperacio / punts.puntsFinals) * 100)
}

export async function vincularPacient(
    dniFisio,
    dniPacient,
    partCos,
    idLesio,
    descripcio = ''
) {
    const dniNet = dniPacient.trim().toUpperCase()

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
        } else if (p.diagnostic.finalitzat && p.diagnostic.punts_recuperacio !== -1) {
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



export async function afegirDiagnosticAPacient(dniFisio, dniPacient, partCos, idLesio, descripcio = '') {
    const { data: idFases } = await supabase
        .from('rutines_lesio')
        .select('id_fase_1, id_fase_2, id_fase_3')
        .eq('id_muscul', partCos)
        .eq('id_lesio', idLesio)
        .single()

    let puntsTotal = 0

    if (idFases) {
        const [
            { data: multifase1 }, { data: multifase2 }, { data: multifase3 },
            { data: infoFase1 }, { data: infoFase2 }, { data: infoFase3 },
        ] = await Promise.all([
            supabase.from('fases').select('multiplicador').eq('id_fase', idFases.id_fase_1).single(),
            supabase.from('fases').select('multiplicador').eq('id_fase', idFases.id_fase_2).single(),
            supabase.from('fases').select('multiplicador').eq('id_fase', idFases.id_fase_3).single(),
            supabase.from('fases').select('exercici_1, exercici_2, exercici_3, n_sessions').eq('id_fase', idFases.id_fase_1).single(),
            supabase.from('fases').select('exercici_1, exercici_2, exercici_3, n_sessions').eq('id_fase', idFases.id_fase_2).single(),
            supabase.from('fases').select('exercici_1, exercici_2, exercici_3, n_sessions').eq('id_fase', idFases.id_fase_3).single(),
        ])

        if (infoFase1 && infoFase2 && infoFase3) {
            const idsExercicis = [...new Set([
                infoFase1.exercici_1, infoFase1.exercici_2, infoFase1.exercici_3,
                infoFase2.exercici_1, infoFase2.exercici_2, infoFase2.exercici_3,
                infoFase3.exercici_1, infoFase3.exercici_2, infoFase3.exercici_3,
            ].filter(Boolean))]

            const { data: exercicisInfo } = await supabase
                .from('exercicis')
                .select('id_exercici, punts')
                .in('id_exercici', idsExercicis)

            const puntsPer = Object.fromEntries((exercicisInfo || []).map(e => [e.id_exercici, e.punts]))

            const calcularPuntsFase = (infoFase, multiplicador) =>
                [infoFase.exercici_1, infoFase.exercici_2, infoFase.exercici_3]
                    .filter(Boolean)
                    .reduce((acc, id) => acc + (puntsPer[id] ?? 0), 0) * (multiplicador ?? 1) * (infoFase.n_sessions ?? 1)

            puntsTotal = calcularPuntsFase(infoFase1, multifase1?.multiplicador)
                + calcularPuntsFase(infoFase2, multifase2?.multiplicador)
                + calcularPuntsFase(infoFase3, multifase3?.multiplicador)
        }
    }

    const { error } = await supabase
        .from('diagnostic')
        .insert([{
            dni_pacient: dniPacient,
            id_lesio: idLesio,
            part_cos: partCos,
            descripcio: descripcio || 'Sense descripció',
            fase_actual: 1,
            finalitzat: false,
            num_sessions: 0,
            punts_recuperacio: 0,
            puntsFinals: puntsTotal,
        }])

    if (error) return { ok: false, missatge: error.message }
    return { ok: true }
}


export async function getRutinaAmbPersonalitzacio(idDiagnostic, idLesio, partCos) {
    const { data: rutina } = await supabase
        .from('rutines_lesio')
        .select('id_fase_1, id_fase_2, id_fase_3')
        .eq('id_lesio', idLesio)
        .eq('id_muscul', partCos)
        .single()

    if (!rutina) return null

    const [{ data: fase1 }, { data: fase2 }, { data: fase3 }] = await Promise.all([
        supabase.from('fases').select('exercici_1, exercici_2, exercici_3, multiplicador, n_sessions').eq('id_fase', rutina.id_fase_1).single(),
        supabase.from('fases').select('exercici_1, exercici_2, exercici_3, multiplicador, n_sessions').eq('id_fase', rutina.id_fase_2).single(),
        supabase.from('fases').select('exercici_1, exercici_2, exercici_3, multiplicador, n_sessions').eq('id_fase', rutina.id_fase_3).single(),
    ])

    const idsExercicis = [...new Set([
        fase1?.exercici_1, fase1?.exercici_2, fase1?.exercici_3,
        fase2?.exercici_1, fase2?.exercici_2, fase2?.exercici_3,
        fase3?.exercici_1, fase3?.exercici_2, fase3?.exercici_3,
    ].filter(Boolean))]

    const { data: exercicis } = await supabase
        .from('exercicis')
        .select('id_exercici, nom, duracio_segons, Repeticions, punts')


    const exMap = Object.fromEntries((exercicis || []).map(e => [e.id_exercici, e]))

    const { data: personalitzacions } = await supabase
        .from('rutina_personalitzada_pacient')
        .select('*')
        .eq('id_diagnostic', idDiagnostic)

    const getPerso = (fase, slot) =>
        (personalitzacions || []).find(p => p.fase === fase && p.slot_exercici === slot) || null

    const buildSlot = (faseNum, slotNum, idExerciciBase, multiplicadorBase) => {
        const perso = getPerso(faseNum, slotNum)
        const exBase = exMap[idExerciciBase] || {}
        const idExerciciFinal = perso?.id_exercici ?? idExerciciBase
        const exFinal = exMap[idExerciciFinal] || exBase

        return {
            slot: slotNum,
            fase: faseNum,
            id_exercici: idExerciciFinal,
            nom: exFinal.nom || '—',
            duracio_segons: perso?.duracio_segons ?? exFinal.duracio_segons ?? 0,
            repeticions: perso?.repeticions ?? exFinal.Repeticions ?? '—',
            punts: perso?.punts ?? exFinal.punts ?? 0,
            multiplicador: perso?.multiplicador ?? multiplicadorBase ?? 1,
            id_exercici_base: idExerciciBase,
            nom_base: exBase.nom || '—',
            duracio_segons_base: exBase.duracio_segons ?? 0,
            repeticions_base: exBase.Repeticions ?? '—',
            punts_base: exBase.punts ?? 0,
            multiplicador_base: multiplicadorBase ?? 1,
            personalitzat: perso !== null,
            id_personalitzacio: perso?.id_personalitzacio ?? null,
        }
    }

    // n_sessions_override per fase (pren el valor de qualsevol fila no-nul·la de la fase)
    const getSessionsOverride = (faseNum) => {
        const fila = (personalitzacions || []).find(p => p.fase === faseNum && p.n_sessions_override != null)
        return fila?.n_sessions_override ?? null
    }

    return {
        fase1: [
            buildSlot(1, 1, fase1?.exercici_1, fase1?.multiplicador),
            buildSlot(1, 2, fase1?.exercici_2, fase1?.multiplicador),
            buildSlot(1, 3, fase1?.exercici_3, fase1?.multiplicador),
        ],
        fase2: [
            buildSlot(2, 1, fase2?.exercici_1, fase2?.multiplicador),
            buildSlot(2, 2, fase2?.exercici_2, fase2?.multiplicador),
            buildSlot(2, 3, fase2?.exercici_3, fase2?.multiplicador),
        ],
        fase3: [
            buildSlot(3, 1, fase3?.exercici_1, fase3?.multiplicador),
            buildSlot(3, 2, fase3?.exercici_2, fase3?.multiplicador),
            buildSlot(3, 3, fase3?.exercici_3, fase3?.multiplicador),
        ],
        nSessions: {
            1: fase1?.n_sessions ?? 0,
            2: fase2?.n_sessions ?? 0,
            3: fase3?.n_sessions ?? 0,
        },
        nSessionsOverride: {
            1: getSessionsOverride(1),
            2: getSessionsOverride(2),
            3: getSessionsOverride(3),
        }
    }
}

export async function guardarPersonalitzacio(dniFisio, {
    id_diagnostic,
    dni_pacient,
    fase,
    slot_exercici,
    id_exercici,
    duracio_segons,
    repeticions,
    punts,
    multiplicador,
}) {
    // ── Calcular n_sessions_override ──────────────────────────
    let n_sessions_override = null
    try {
        const { data: diag } = await supabase
            .from('diagnostic')
            .select('id_lesio, part_cos, fase_actual, punts_recuperacio, num_sessions')
            .eq('id_diagnostic', id_diagnostic)
            .maybeSingle()

        if (diag) {
            const { data: rutina } = await supabase
                .from('rutines_lesio')
                .select('id_fase_1, id_fase_2, id_fase_3')
                .eq('id_lesio', diag.id_lesio)
                .eq('id_muscul', diag.part_cos)
                .single()

            if (rutina) {
                const idFase = fase === 1 ? rutina.id_fase_1
                    : fase === 2 ? rutina.id_fase_2
                        : rutina.id_fase_3

                const { data: faseInfo } = await supabase
                    .from('fases')
                    .select('exercici_1, exercici_2, exercici_3, multiplicador, n_sessions')
                    .eq('id_fase', idFase)
                    .single()

                if (faseInfo) {
                    const idsBase = [faseInfo.exercici_1, faseInfo.exercici_2, faseInfo.exercici_3].filter(Boolean)
                    const { data: exercicisInfo } = await supabase
                        .from('exercicis').select('id_exercici, punts').in('id_exercici', idsBase)
                    const puntsPer = Object.fromEntries((exercicisInfo || []).map(e => [e.id_exercici, e.punts]))

                    // Overrides dels altres slots de la mateixa fase
                    const { data: altresOverrides } = await supabase
                        .from('rutina_personalitzada_pacient')
                        .select('slot_exercici, punts')
                        .eq('id_diagnostic', id_diagnostic)
                        .eq('fase', fase)
                        .neq('slot_exercici', slot_exercici)
                    const overrideMap = Object.fromEntries((altresOverrides || []).map(p => [p.slot_exercici, p.punts]))

                    // Punts per sessió amb tots els overrides actuals
                    const ptsSessio = [1, 2, 3].reduce((acc, s) => {
                        const idEx = faseInfo[`exercici_${s}`]
                        if (!idEx) return acc
                        const ptsSlot = s === slot_exercici ? punts : (overrideMap[s] ?? puntsPer[idEx] ?? 0)
                        return acc + ptsSlot
                    }, 0)
                    const ptsPorSessio = ptsSessio * (multiplicador ?? faseInfo.multiplicador ?? 1)

                    // Umbral original (IMMUTABLE)
                    const ptsOriginalsPerSessio = [1, 2, 3].reduce((acc, s) => {
                        const idEx = faseInfo[`exercici_${s}`]
                        return acc + (idEx ? (puntsPer[idEx] ?? 0) : 0)
                    }, 0)
                    const umbralFase = ptsOriginalsPerSessio * (faseInfo.multiplicador ?? 1) * (faseInfo.n_sessions ?? 1)

                    if (ptsPorSessio > 0) {
                        let ptsFetsEnAquestaFase = 0
                        let sessionsFetes = 0

                        // Només tenim en compte els punts que porta si el pacient està actualment en la fase que estem editant
                        if (diag.fase_actual === fase) {
                            sessionsFetes = diag.num_sessions || 0
                            let puntsTotalsUsuari = diag.punts_recuperacio || 0

                            // Càlcul d'umbrals de fases anteriors per restar-los
                            let umbralFase1 = 0
                            let umbralFase2 = 0

                            if (fase === 2 || fase === 3) {
                                const { data: f1 } = await supabase.from('fases').select('exercici_1, exercici_2, exercici_3, multiplicador, n_sessions').eq('id_fase', rutina.id_fase_1).single()
                                if (f1) {
                                    const ids1 = [f1.exercici_1, f1.exercici_2, f1.exercici_3].filter(Boolean)
                                    const { data: ex1 } = await supabase.from('exercicis').select('id_exercici, punts').in('id_exercici', ids1)
                                    const p1 = Object.fromEntries((ex1 || []).map(e => [e.id_exercici, e.punts]))
                                    const ptsSessio1 = ids1.reduce((acc, id) => acc + (p1[id] ?? 0), 0)
                                    umbralFase1 = ptsSessio1 * (f1.multiplicador ?? 1) * (f1.n_sessions ?? 1)
                                }
                            }

                            if (fase === 3) {
                                const { data: f2 } = await supabase.from('fases').select('exercici_1, exercici_2, exercici_3, multiplicador, n_sessions').eq('id_fase', rutina.id_fase_2).single()
                                if (f2) {
                                    const ids2 = [f2.exercici_1, f2.exercici_2, f2.exercici_3].filter(Boolean)
                                    const { data: ex2 } = await supabase.from('exercicis').select('id_exercici, punts').in('id_exercici', ids2)
                                    const p2 = Object.fromEntries((ex2 || []).map(e => [e.id_exercici, e.punts]))
                                    const ptsSessio2 = ids2.reduce((acc, id) => acc + (p2[id] ?? 0), 0)
                                    umbralFase2 = ptsSessio2 * (f2.multiplicador ?? 1) * (f2.n_sessions ?? 1)
                                }
                            }

                            // Restem l'umbral de la fase 1 (si estem a la fase 2) o de la fase 1 i 2 (si estem a la fase 3)
                            if (fase === 1) {
                                ptsFetsEnAquestaFase = puntsTotalsUsuari
                            } else if (fase === 2) {
                                ptsFetsEnAquestaFase = Math.max(0, puntsTotalsUsuari - umbralFase1)
                            } else if (fase === 3) {
                                ptsFetsEnAquestaFase = Math.max(0, puntsTotalsUsuari - umbralFase1 - umbralFase2)
                            }
                        }

                        // Calcular sessions restants amb els punts que li falten per arribar a l'umbral d'aquesta fase
                        const puntsRestantsFase = Math.max(0, umbralFase - ptsFetsEnAquestaFase)
                        const sessionsRestants = Math.ceil(puntsRestantsFase / ptsPorSessio)

                        // El total override és el que ja ha fet + el que li falta
                        n_sessions_override = sessionsFetes + sessionsRestants
                    }
                }
            }
        }
    } catch (err) {
        console.error('Error calculant n_sessions_override:', err)
    }

    // ── Desar a Supabase ─────────────────────────────────────
    const { error } = await supabase
        .from('rutina_personalitzada_pacient')
        .upsert(
            {
                id_diagnostic,
                dni_pacient,
                fase,
                slot_exercici,
                id_exercici,
                duracio_segons,
                repeticions,
                punts,
                multiplicador,
                n_sessions_override,
                modificat_per: dniFisio,
                data_modificacio: new Date().toISOString(),
            },
            { onConflict: 'id_diagnostic,fase,slot_exercici' }
        )

    if (error) return { ok: false, missatge: error.message }

    // Sincronitzar n_sessions_override a tots els slots de la mateixa fase
    if (n_sessions_override !== null) {
        await supabase
            .from('rutina_personalitzada_pacient')
            .update({ n_sessions_override })
            .eq('id_diagnostic', id_diagnostic)
            .eq('fase', fase)
            .neq('slot_exercici', slot_exercici)
    }

    return { ok: true }
}