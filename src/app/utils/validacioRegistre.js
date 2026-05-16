// Validació només per a **nous** registres (login i usuaris existents no es toquen).

const LLETRES_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE'

/**
 * DNI espanyol: 8 xifres + 1 lletra, amb lletra de control vàlida.
 * @returns {{ valid: true, dniNormalitzat: string } | { valid: false, error: string }}
 */
export function validarDniNouUsuari(dniBrut) {
    const senseEspais = String(dniBrut || '').trim().toUpperCase().replace(/\s+/g, '')
    if (!/^\d{8}[A-Z]$/.test(senseEspais)) {
        return {
            valid: false,
            error: 'El DNI ha de tenir 8 xifres i una lletra (exemple: 12345678Z).',
        }
    }
    const numero = parseInt(senseEspais.slice(0, 8), 10)
    const lletraEsperada = LLETRES_DNI[numero % 23]
    if (senseEspais[8] !== lletraEsperada) {
        return {
            valid: false,
            error: 'La lletra del DNI no correspon al número. Revisa el document.',
        }
    }
    return { valid: true, dniNormalitzat: senseEspais }
}

/**
 * Format de correu vàlid (suficient per a registre; no cal ser exhaustiu com RFC 5322).
 * @returns {{ valid: true, email: string } | { valid: false, error: string }}
 */
export function validarEmailNouUsuari(emailBrut) {
    const email = String(emailBrut || '').trim().toLowerCase()
    if (!email) {
        return { valid: false, error: 'Introdueix un correu electrònic.' }
    }
    if (email.length > 254) {
        return { valid: false, error: 'El correu electrònic és massa llarg.' }
    }
    // Format estàndard: part local @ domini amb almenys un punt i TLD ≥ 2 caràcters
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!re.test(email)) {
        return {
            valid: false,
            error: 'Introdueix un correu electrònic vàlid (exemple: nom@domini.cat).',
        }
    }
    const [, domini] = email.split('@')
    const ultimSegment = domini?.split('.')?.pop()
    if (!ultimSegment || ultimSegment.length < 2) {
        return {
            valid: false,
            error: 'Introdueix un correu electrònic amb un domini vàlid.',
        }
    }
    return { valid: true, email }
}
