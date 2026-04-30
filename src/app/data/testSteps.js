// ============================================================
// Dades estàtiques del test diagnòstic
// ============================================================

export const TEST_STEPS = [
    {
        pregunta: 'Quin múscul et fa mal?',
        opcions: ['Quàdriceps', 'Isquiotibials', 'Bessons', 'Tríceps', 'Glutis', 'Deltoides', 'Bíceps'],
    },
    {
        pregunta: 'Quan va apareixer el dolor?',
        opcions: [
            'De cop, durant esport o esforç',
            'Gradualment, en dies o setmanes',
            'Em vaig despertar amb dolor',
        ],
    },
    {
        pregunta: 'Com descriuries el dolor?',
        opcions: [
            'Dolor agut, com una ganivetada',
            'Rigidesa i tensió general al múscul',
            'Tibantor, com si el múscul estigués estret',
        ],
    },
    {
        pregunta: 'Pots moure el múscul amb normalitat?',
        opcions: [
            'Difícilment, em provoca molt de dolor',
            "Puc moure'l però amb molèstia",
            'Sí, però noto tensió i limitació',
        ],
    },
    {
        pregunta: 'Explica una breu descripció de com va succeir el dolor:',
        tipus: 'text',
    },
]