import fs from 'node:fs'
import path from 'node:path'

function parseEnvLine(rawLine: string): { key: string; value: string } | null {
  let line = rawLine.trim()
  if (!line || line.startsWith('#')) return null

  line = line.replace(/^\$/, '')
  const eq = line.indexOf('=')
  if (eq === -1) return null

  const key = line.slice(0, eq).trim()
  let value = line.slice(eq + 1).trim()
  value = value.replace(/^["']|["']$/g, '')

  if (!key) return null
  return { key, value }
}

/** Carrega variables E2E des de .env.e2e (prioritari) o .env.e2e.example */
export function loadE2eEnv(rootDir = path.resolve(__dirname, '..')) {
  const files = ['.env.e2e', '.env.e2e.example']

  for (const name of files) {
    const filePath = path.join(rootDir, name)
    if (!fs.existsSync(filePath)) continue

    for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
      const parsed = parseEnvLine(rawLine)
      if (!parsed) continue
      if (process.env[parsed.key] === undefined || process.env[parsed.key] === '') {
        process.env[parsed.key] = parsed.value
      }
    }
  }
}
