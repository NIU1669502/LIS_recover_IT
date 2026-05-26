'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import styles from './overlayAnatomic.module.css'

export default function OverlayAnatomic({ perfilUsuari }) {
    const [punts, setPunts] = useState([])
    const [tooltipActiu, setTooltipActiu] = useState(null)

    useEffect(() => {
        if (!perfilUsuari?.dni) return

        const carregar = async () => {
            const { data: diagnostics } = await supabase
                .from('diagnostic')
                .select('id_diagnostic, fase_actual, part_cos, id_lesio, punts_recuperacio, puntsFinals')
                .eq('dni_pacient', perfilUsuari.dni)
                .eq('finalitzat', false)

            if (!diagnostics?.length) {
                setPunts([])
                return
            }

            const partIds = [...new Set(diagnostics.map(d => d.part_cos).filter(Boolean))]
            const lesioIds = [...new Set(diagnostics.map(d => d.id_lesio).filter(Boolean))]

            const [{ data: musculs }, { data: lesions }] = await Promise.all([
                supabase
                    .from('musculs')
                    .select('id_cos, nom, coord_x, coord_y')
                    .in('id_cos', partIds),
                supabase
                    .from('lesions')
                    .select('id_lesio, nom')
                    .in('id_lesio', lesioIds),
            ])

            const musculsMap = Object.fromEntries((musculs ?? []).map(m => [m.id_cos, m]))
            const lesionsMap = Object.fromEntries((lesions ?? []).map(l => [l.id_lesio, l]))

            const resultats = diagnostics
                .map(d => {
                    const muscul = musculsMap[d.part_cos]
                    const lesio = lesionsMap[d.id_lesio]
                    if (!muscul?.coord_x || !muscul?.coord_y) return null
                    const progres = d.puntsFinals > 0
                        ? Math.min(Math.round((d.punts_recuperacio / d.puntsFinals) * 100), 100)
                        : 0
                    return {
                        id: d.id_diagnostic,
                        x: muscul.coord_x,
                        y: muscul.coord_y,
                        nomMuscul: muscul.nom,
                        nomLesio: lesio?.nom ?? '—',
                        fase: d.fase_actual,
                        progres,
                    }
                })
                .filter(Boolean)

            setPunts(resultats)
        }

        carregar()

        const canal = supabase
            .channel(`overlay-anatomic-${perfilUsuari.dni}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'diagnostic',
                filter: `dni_pacient=eq.${perfilUsuari.dni}`,
            }, carregar)
            .subscribe()

        return () => supabase.removeChannel(canal)
    }, [perfilUsuari?.dni])

    if (!punts.length) return null

    return (
        <div className={styles.overlayContainer}>
            {punts.map(punt => (
                <button
                    key={punt.id}
                    className={styles.dotWrapper}
                    style={{ left: `${punt.x}%`, top: `${punt.y}%` }}
                    onMouseEnter={() => setTooltipActiu(punt.id)}
                    onMouseLeave={() => setTooltipActiu(null)}
                    onClick={() => setTooltipActiu(tooltipActiu === punt.id ? null : punt.id)}
                    aria-label={`Lesió activa: ${punt.nomLesio} al ${punt.nomMuscul}`}
                >
                    
                    <span className={styles.dotRing} aria-hidden="true" />
                    
                    <span className={styles.dotCore} aria-hidden="true" />

                    
                    {tooltipActiu === punt.id && (
                        <div className={styles.tooltip} role="tooltip">
                            <p className={styles.tooltipMuscul}>{punt.nomMuscul}</p>
                            <p className={styles.tooltipLesio}>{punt.nomLesio}</p>
                            <div className={styles.tooltipMeta}>
                                <span className={styles.tooltipFase}>Fase {punt.fase}/3</span>
                                <span className={styles.tooltipProgres}>{punt.progres}%</span>
                            </div>
                            <div className={styles.tooltipBarBg}>
                                <div
                                    className={styles.tooltipBarFill}
                                    style={{ width: `${punt.progres}%` }}
                                />
                            </div>
                        </div>
                    )}
                </button>
            ))}
        </div>
    )
}