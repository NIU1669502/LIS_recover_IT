'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState('claro')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const temaGuardat = localStorage.getItem('tema') || 'claro'
    setTema(temaGuardat)
    document.documentElement.setAttribute('data-tema', temaGuardat)
    setMounted(true)
  }, [])

  const canviarTema = () => {
    const noTema = tema === 'oscuro' ? 'claro' : 'oscuro'
    setTema(noTema)
    localStorage.setItem('tema', noTema)
    document.documentElement.setAttribute('data-tema', noTema)
  }

  if (!mounted) return children

  return (
    <ThemeContext.Provider value={{ tema, canviarTema }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider')
  }
  return context
}
