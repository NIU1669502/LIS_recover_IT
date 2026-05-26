'use client'

import { useState } from 'react'
import styles from './graficaRecuperacio.module.css'

const PAD = { top: 24, right: 24, bottom: 48, left: 52 }
const W = 520
const H = 260

function formatShortDate(iso) {
    if (!iso) return ''
    try {
        return new Date(iso).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })
    } catch { return '' }
}

export default function GraficaRecuperacio({ sessions = [], puntsFinals = 0 }) {
    const [tooltip, setTooltip] = useState(null)

    const puntsAcumulats = []
    let acc = 0
    for (const s of sessions) {
        acc += s.punts_obtinguts ?? 0
        puntsAcumulats.push({ data: s.data_realitzacio, punts: acc })
    }

    const totalPunts = puntsFinals > 0 ? puntsFinals : (acc > 0 ? acc : 1)
    const nSessions = puntsAcumulats.length

    const innerW = W - PAD.left - PAD.right
    const innerH = H - PAD.top - PAD.bottom

    const xPos = (i) => PAD.left + (nSessions <= 1 ? innerW / 2 : (i / (nSessions - 1)) * innerW)
    const yPos = (p) => PAD.top + innerH - (Math.min(p, totalPunts) / totalPunts) * innerH

    const punts = [{ punts: 0, data: null }, ...puntsAcumulats]
    const linePoints = punts.map((p, i) => {
        const x = PAD.left + (nSessions === 0 ? 0 : (i / (nSessions)) * innerW)
        const y = yPos(p.punts)
        return { x, y, ...p }
    })

    const linePath = linePoints
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ')

    const areaPath = linePoints.length > 0
        ? `${linePath} L ${linePoints[linePoints.length - 1].x.toFixed(1)} ${(PAD.top + innerH).toFixed(1)} L ${PAD.left} ${(PAD.top + innerH).toFixed(1)} Z`
        : ''

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
        y: PAD.top + innerH - f * innerH,
        label: Math.round(f * totalPunts),
    }))

    const xTicks = []
    if (nSessions > 0) {
        const step = Math.max(1, Math.ceil(nSessions / 4))
        for (let i = 0; i < nSessions; i += step) {
            xTicks.push({ i, x: xPos(i), label: formatShortDate(puntsAcumulats[i]?.data) })
        }
    }

    const progres = totalPunts > 0 ? Math.min(100, Math.round((acc / totalPunts) * 100)) : 0

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <div>
                    <p className={styles.chartTitle}>Evolució de la recuperació</p>
                    <p className={styles.chartSubtitle}>Punts acumulats per sessió</p>
                </div>
                <div className={styles.progresChip}>
                    <span className={styles.progresNum}>{progres}%</span>
                    <span className={styles.progresLabel}>completat</span>
                </div>
            </div>

            {nSessions === 0 ? (
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>📊</span>
                    <p>Completa la teva primera sessió<br />per veure el teu progrés aquí.</p>
                </div>
            ) : (
                <div className={styles.svgWrapper}>
                    <svg
                        viewBox={`0 0 ${W} ${H}`}
                        className={styles.svg}
                        onMouseLeave={() => setTooltip(null)}
                    >
                        <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                            </linearGradient>
                            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#60a5fa" />
                                <stop offset="100%" stopColor="#2563eb" />
                            </linearGradient>
                        </defs>

                        
                        {yTicks.map((t, i) => (
                            <g key={i}>
                                <line
                                    x1={PAD.left} y1={t.y}
                                    x2={W - PAD.right} y2={t.y}
                                    stroke="#e8f0ff" strokeWidth="1"
                                    strokeDasharray={i === 0 ? '0' : '4 3'}
                                />
                                <text
                                    x={PAD.left - 8} y={t.y + 4}
                                    textAnchor="end"
                                    fontSize="11" fill="#94a3b8" fontFamily="Inter, sans-serif"
                                >
                                    {t.label}
                                </text>
                            </g>
                        ))}

                        
                        <line
                            x1={PAD.left} y1={PAD.top}
                            x2={W - PAD.right} y2={PAD.top}
                            stroke="#22c55e" strokeWidth="1.5"
                            strokeDasharray="6 4" opacity="0.6"
                        />
                        <text
                            x={W - PAD.right + 2.25} y={PAD.top + 4}
                            fontSize="10" fill="#22c55e" fontFamily="Inter, sans-serif"
                        >
                            Meta
                        </text>

                        
                        {areaPath && (
                            <path d={areaPath} fill="url(#areaGrad)" />
                        )}

                        
                        <path
                            d={linePath}
                            fill="none"
                            stroke="url(#lineGrad)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        
                        {xTicks.map((t, i) => (
                            <text
                                key={i}
                                x={t.x} y={H - 10}
                                textAnchor="middle"
                                fontSize="11" fill="#94a3b8" fontFamily="Inter, sans-serif"
                            >
                                {t.label}
                            </text>
                        ))}

                        
                        {puntsAcumulats.map((p, i) => {
                            const x = xPos(i)
                            const y = yPos(p.punts)
                            return (
                                <circle
                                    key={i}
                                    cx={x} cy={y} r={i === nSessions - 1 ? 6 : 4}
                                    fill={i === nSessions - 1 ? '#2563eb' : '#93c5fd'}
                                    stroke="#fff" strokeWidth="2"
                                    className={styles.dot}
                                    onMouseEnter={(e) => setTooltip({
                                        x, y,
                                        label: formatShortDate(p.data),
                                        punts: p.punts,
                                        total: totalPunts,
                                    })}
                                />
                            )
                        })}

                        
                        {tooltip && (() => {
                            const tx = Math.min(tooltip.x, W - 110)
                            const ty = Math.max(tooltip.y - 52, PAD.top)
                            return (
                                <g>
                                    <rect
                                        x={tx - 4} y={ty - 2}
                                        width="110" height="40"
                                        rx="8" fill="#1e293b" opacity="0.92"
                                    />
                                    <text x={tx + 51} y={ty + 13} textAnchor="middle"
                                        fontSize="11" fill="#94a3b8" fontFamily="Inter, sans-serif">
                                        {tooltip.label}
                                    </text>
                                    <text x={tx + 51} y={ty + 30} textAnchor="middle"
                                        fontSize="13" fontWeight="700" fill="#fff" fontFamily="Inter, sans-serif">
                                        {tooltip.punts} / {tooltip.total} pts
                                    </text>
                                </g>
                            )
                        })()}
                    </svg>
                </div>
            )}

            
            <div className={styles.llegenda}>
                <div className={styles.llegendaItem}>
                    <span className={styles.llegendaLiniaBlava} />
                    Punts acumulats
                </div>
                <div className={styles.llegendaItem}>
                    <span className={styles.llegendaLiniaVerde} />
                    Objectiu total ({puntsFinals} pts)
                </div>
            </div>
        </div>
    )
}
