// ============================================================
// MOCK DATABASE — substitueix Supabase temporalment
// Reflexa l'estructura de les taules:
//   exercicis, rutines, rutines_lesio, assignacions_rutina
// ============================================================

// ── Taula: exercicis ────────────────────────────────────────
export const EXERCICIS = [
    { id_exercici: 1, nom: 'Estiraments suaus', reps: 3, duracio_segons: 30, punts: 10 },
    { id_exercici: 2, nom: 'Estiraments controlats', reps: 3, duracio_segons: 30, punts: 10 },
    { id_exercici: 3, nom: 'Estiraments demandats', reps: 3, duracio_segons: 40, punts: 15 },
    { id_exercici: 4, nom: 'Mobilitat articular lenta', reps: 2, duracio_segons: 60, punts: 10 },
    { id_exercici: 5, nom: 'Mobilitat articular regulada', reps: 2, duracio_segons: 60, punts: 10 },
    { id_exercici: 6, nom: 'Massatge suau', reps: 1, duracio_segons: 60, punts: 10 },
    { id_exercici: 7, nom: 'Exercici de força suau', reps: '8-10', duracio_segons: 40, punts: 15 },
    { id_exercici: 8, nom: 'Exercici de força controlat', reps: '10-12', duracio_segons: 45, punts: 20 },
    { id_exercici: 9, nom: 'Exercici força', reps: '10-12', duracio_segons: 45, punts: 20 },
    { id_exercici: 10, nom: 'Contracció isomètrica suau', reps: 5, duracio_segons: 10, punts: 10 },
    { id_exercici: 11, nom: 'Contracció isomètrica', reps: 5, duracio_segons: 15, punts: 10 },
    { id_exercici: 12, nom: 'Activació del múscul', reps: '8-10', duracio_segons: 30, punts: 10 },
    { id_exercici: 13, nom: 'Elevació cama estirada', reps: 10, duracio_segons: 45, punts: 15 },
    { id_exercici: 14, nom: 'Elevació cama lateral', reps: 10, duracio_segons: 45, punts: 15 },
    { id_exercici: 15, nom: 'Elevació talons', reps: 12, duracio_segons: 60, punts: 15 },
    { id_exercici: 16, nom: 'Elevació talons una cama', reps: 12, duracio_segons: 60, punts: 20 },
    { id_exercici: 17, nom: 'Pont de glutis', reps: 10, duracio_segons: 45, punts: 15 },
    { id_exercici: 18, nom: 'Squats', reps: 12, duracio_segons: 60, punts: 20 },
    { id_exercici: 19, nom: 'Lunges', reps: 12, duracio_segons: 60, punts: 20 },
    { id_exercici: 20, nom: 'Curl de cames', reps: 10, duracio_segons: 60, punts: 15 },
    { id_exercici: 21, nom: 'Extensió de genolls', reps: 10, duracio_segons: 60, punts: 15 },
    { id_exercici: 22, nom: 'Equilibri una cama', reps: 1, duracio_segons: 30, punts: 15 },
    { id_exercici: 23, nom: 'Equilibri una cama moviment braços', reps: 1, duracio_segons: 30, punts: 20 },
    { id_exercici: 24, nom: 'Equilibri superfície inestable', reps: 1, duracio_segons: 30, punts: 20 },
    { id_exercici: 25, nom: 'Mini-squats amb equilibri', reps: 10, duracio_segons: 60, punts: 20 },
    { id_exercici: 26, nom: 'Salt suau al lloc', reps: 10, duracio_segons: 45, punts: 20 },
    { id_exercici: 27, nom: 'Salt lateral suau', reps: 10, duracio_segons: 45, punts: 20 },
    { id_exercici: 28, nom: 'Rotacions espatlla', reps: 2, duracio_segons: 30, punts: 10 },
    { id_exercici: 29, nom: 'Mobilitat braç endavant i enrere', reps: 2, duracio_segons: 30, punts: 10 },
    { id_exercici: 30, nom: 'Flexions braços a la paret', reps: 10, duracio_segons: 45, punts: 15 },
    { id_exercici: 31, nom: 'Estirament de tríceps', reps: 2, duracio_segons: 30, punts: 10 },
    { id_exercici: 32, nom: 'Mobilitat colze suau', reps: 2, duracio_segons: 30, punts: 10 },
]

// Helper per buscar id d'exercici pel nom
function eid(nom) {
    const ex = EXERCICIS.find(e => e.nom.toLowerCase() === nom.toLowerCase())
    if (!ex) console.warn(`[mockRutines] Exercici no trobat: "${nom}"`)
    return ex?.id_exercici ?? null
}

// ── Taula: rutines ──────────────────────────────────────────
// Cada rutina té un id, múscul i tipus de lesió
// Les claus de tipus_lesio coincideixen amb el que retorna determinarLesio()
export const RUTINES = [
    { id_rutina: 1, muscul: 'Quàdriceps', tipus_lesio: 'Esquinç muscular' },
    { id_rutina: 2, muscul: 'Quàdriceps', tipus_lesio: 'Distensió muscular' },
    { id_rutina: 3, muscul: 'Quàdriceps', tipus_lesio: 'Contractura / Sobrecàrrega' },
    { id_rutina: 4, muscul: 'Isquiotibials', tipus_lesio: 'Esquinç muscular' },
    { id_rutina: 5, muscul: 'Isquiotibials', tipus_lesio: 'Distensió muscular' },
    { id_rutina: 6, muscul: 'Isquiotibials', tipus_lesio: 'Contractura / Sobrecàrrega' },
    { id_rutina: 7, muscul: 'Bessons', tipus_lesio: 'Esquinç muscular' },
    { id_rutina: 8, muscul: 'Bessons', tipus_lesio: 'Distensió muscular' },
    { id_rutina: 9, muscul: 'Bessons', tipus_lesio: 'Contractura / Sobrecàrrega' },
    { id_rutina: 10, muscul: 'Glutis', tipus_lesio: 'Contractura / Sobrecàrrega' },
    { id_rutina: 11, muscul: 'Glutis', tipus_lesio: 'Distensió muscular' },
    { id_rutina: 12, muscul: 'Deltoides', tipus_lesio: 'Contractura / Sobrecàrrega' },
    { id_rutina: 13, muscul: 'Deltoides', tipus_lesio: 'Distensió muscular' },
    { id_rutina: 14, muscul: 'Bíceps', tipus_lesio: 'Distensió muscular' },
    { id_rutina: 15, muscul: 'Bíceps', tipus_lesio: 'Contractura / Sobrecàrrega' },
    { id_rutina: 16, muscul: 'Tríceps', tipus_lesio: 'Distensió muscular' },
    { id_rutina: 17, muscul: 'Tríceps', tipus_lesio: 'Contractura / Sobrecàrrega' },
]

// ── Taula: rutines_lesio ────────────────────────────────────
// Relaciona cada rutina amb els seus exercicis per fase i ordre
// fase: 1, 2 o 3 | ordre: 1, 2 o 3
function exercicisRutina(id_rutina, f1e1, f1e2, f1e3, f2e1, f2e2, f2e3, f3e1, f3e2, f3e3) {
    return [
        { id_rutina, id_exercici: eid(f1e1), fase: 1, ordre: 1 },
        { id_rutina, id_exercici: eid(f1e2), fase: 1, ordre: 2 },
        { id_rutina, id_exercici: eid(f1e3), fase: 1, ordre: 3 },
        { id_rutina, id_exercici: eid(f2e1), fase: 2, ordre: 1 },
        { id_rutina, id_exercici: eid(f2e2), fase: 2, ordre: 2 },
        { id_rutina, id_exercici: eid(f2e3), fase: 2, ordre: 3 },
        { id_rutina, id_exercici: eid(f3e1), fase: 3, ordre: 1 },
        { id_rutina, id_exercici: eid(f3e2), fase: 3, ordre: 2 },
        { id_rutina, id_exercici: eid(f3e3), fase: 3, ordre: 3 },
    ]
}

export const RUTINES_LESIO = [
    // Quàdriceps - Esquinç
    ...exercicisRutina(1,
        'Contracció isomètrica suau', 'Mobilitat articular lenta', 'Activació del múscul',
        'Extensió de genolls', 'Exercici de força suau', 'Elevació cama estirada',
        'Squats', 'Lunges', 'Estiraments demandats'
    ),
    // Quàdriceps - Distensió
    ...exercicisRutina(2,
        'Estiraments suaus', 'Mobilitat articular lenta', 'Contracció isomètrica suau',
        'Elevació cama estirada', 'Exercici de força suau', 'Extensió de genolls',
        'Squats', 'Lunges', 'Equilibri una cama'
    ),
    // Quàdriceps - Contractura
    ...exercicisRutina(3,
        'Massatge suau', 'Estiraments suaus', 'Mobilitat articular lenta',
        'Estiraments controlats', 'Elevació cama estirada', 'Exercici de força suau',
        'Squats', 'Lunges', 'Exercici força'
    ),
    // Isquiotibials - Esquinç
    ...exercicisRutina(4,
        'Contracció isomètrica suau', 'Mobilitat articular lenta', 'Activació del múscul',
        'Curl de cames', 'Exercici de força suau', 'Pont de glutis',
        'Lunges', 'Squats', 'Equilibri una cama moviment braços'
    ),
    // Isquiotibials - Distensió
    ...exercicisRutina(5,
        'Estiraments suaus', 'Mobilitat articular lenta', 'Activació del múscul',
        'Curl de cames', 'Pont de glutis', 'Exercici de força suau',
        'Lunges', 'Squats', 'Mini-squats amb equilibri'
    ),
    // Isquiotibials - Contractura
    ...exercicisRutina(6,
        'Massatge suau', 'Estiraments suaus', 'Mobilitat articular lenta',
        'Estiraments controlats', 'Curl de cames', 'Exercici de força suau',
        'Squats', 'Lunges', 'Estiraments demandats'
    ),
    // Bessons - Esquinç
    ...exercicisRutina(7,
        'Contracció isomètrica suau', 'Mobilitat articular lenta', 'Estiraments suaus',
        'Elevació talons', 'Estiraments controlats', 'Equilibri una cama',
        'Equilibri superfície inestable', 'Salt suau al lloc', 'Elevació talons una cama'
    ),
    // Bessons - Distensió
    ...exercicisRutina(8,
        'Estiraments suaus', 'Mobilitat articular lenta', 'Activació del múscul',
        'Elevació talons', 'Exercici de força suau', 'Equilibri una cama',
        'Mini-squats amb equilibri', 'Salt lateral suau', 'Elevació talons una cama'
    ),
    // Bessons - Contractura
    ...exercicisRutina(9,
        'Massatge suau', 'Estiraments suaus', 'Mobilitat articular lenta',
        'Estiraments controlats', 'Elevació talons', 'Exercici de força suau',
        'Squats', 'Exercici força', 'Elevació talons una cama'
    ),
    // Glutis - Contractura
    ...exercicisRutina(10,
        'Estiraments suaus', 'Mobilitat articular lenta', 'Activació del múscul',
        'Estiraments controlats', 'Pont de glutis', 'Contracció isomètrica',
        'Squats', 'Lunges', 'Mini-squats amb equilibri'
    ),
    // Glutis - Distensió
    ...exercicisRutina(11,
        'Estiraments suaus', 'Mobilitat articular lenta', 'Activació del múscul',
        'Estiraments controlats', 'Pont de glutis', 'Exercici de força suau',
        'Squats', 'Lunges', 'Exercici força'
    ),
    // Deltoides - Contractura
    ...exercicisRutina(12,
        'Massatge suau', 'Estiraments suaus', 'Mobilitat articular lenta',
        'Estiraments controlats', 'Exercici de força suau', 'Activació del múscul',
        'Exercici de força controlat', 'Exercici força', 'Equilibri una cama moviment braços'
    ),
    // Deltoides - Distensió (Sobrecàrrega a l'excel)
    ...exercicisRutina(13,
        'Estiraments suaus', 'Mobilitat articular lenta', 'Contracció isomètrica suau',
        'Rotacions espatlla', 'Exercici de força suau', 'Exercici de força controlat',
        'Exercici força', 'Mobilitat articular regulada', 'Flexions braços a la paret'
    ),
    // Bíceps - Distensió
    ...exercicisRutina(14,
        'Estiraments suaus', 'Mobilitat articular lenta', 'Contracció isomètrica suau',
        'Activació del múscul', 'Exercici de força suau', 'Exercici de força controlat',
        'Exercici força', 'Mobilitat articular regulada', 'Contracció isomètrica'
    ),
    // Bíceps - Contractura
    ...exercicisRutina(15,
        'Massatge suau', 'Estiraments suaus', 'Mobilitat articular lenta',
        'Estiraments controlats', 'Activació del múscul', 'Exercici de força suau',
        'Exercici força', 'Mobilitat articular regulada', 'Mobilitat braç endavant i enrere'
    ),
    // Tríceps - Distensió
    ...exercicisRutina(16,
        'Contracció isomètrica suau', 'Estiraments suaus', 'Mobilitat articular lenta',
        'Activació del múscul', 'Exercici de força suau', 'Exercici de força controlat',
        'Exercici força', 'Flexions braços a la paret', 'Estirament de tríceps'
    ),
    // Tríceps - Contractura
    ...exercicisRutina(17,
        'Massatge suau', 'Estiraments suaus', 'Mobilitat articular lenta',
        'Estiraments controlats', 'Exercici de força suau', 'Estirament de tríceps',
        'Exercici de força controlat', 'Flexions braços a la paret', 'Estirament de tríceps'
    ),
]

// ── Taula: assignacions_rutina ──────────────────────────────
// S'emplena en temps d'execució via assignarRutina()
// Persistit a localStorage per simular BD
const STORAGE_KEY = 'recoverit_assignacio'

export function getAssignacio() {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
}

export function saveAssignacio(assignacio) {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignacio))
}

export function clearAssignacio() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
}

// ── Funció principal: assignar rutina a partir del resultat del test ──
// Retorna l'assignació creada o null si no hi ha rutina per aquesta combinació
export function assignarRutina({ muscle, tipus }) {
    const rutina = RUTINES.find(
        r => r.muscul === muscle && r.tipus_lesio === tipus
    )

    if (!rutina) {
        console.warn(`[mockRutines] No s'ha trobat rutina per: ${muscle} / ${tipus}`)
        return null
    }

    const assignacio = {
        id_assignacio: Date.now(),
        muscle,
        tipus_lesio: tipus,
        id_rutina: rutina.id_rutina,
        fase_actual: 1,
        data_inici: new Date().toISOString(),
        completada: false,
    }

    saveAssignacio(assignacio)
    return assignacio
}

// ── Funció: obtenir exercicis de la fase actual ──────────────
// Retorna array d'exercicis complets (amb nom, reps, duració, punts)
export function getExercicisFaseActual() {
    const assignacio = getAssignacio()
    if (!assignacio) return []

    const { id_rutina, fase_actual } = assignacio

    const ids = RUTINES_LESIO
        .filter(rl => rl.id_rutina === id_rutina && rl.fase === fase_actual)
        .sort((a, b) => a.ordre - b.ordre)
        .map(rl => rl.id_exercici)

    return ids.map(id => EXERCICIS.find(e => e.id_exercici === id)).filter(Boolean)
}

// ── Funció: avançar a la següent fase ───────────────────────
export function avancarFase() {
    const assignacio = getAssignacio()
    if (!assignacio) return null

    if (assignacio.fase_actual >= 3) {
        assignacio.completada = true
    } else {
        assignacio.fase_actual += 1
    }

    saveAssignacio(assignacio)
    return assignacio
}