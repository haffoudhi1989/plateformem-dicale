// =====================================================
// JOURS FÉRIÉS TUNISIENS
// =====================================================
// Dates civiles fixes + fêtes religieuses (estimations
// lunaires, à actualiser chaque année).

const FERIES_FIXES = [
    { mois: 1, jour: 1, nom: "Jour de l'An" },
    { mois: 3, jour: 20, nom: "Fête de l'Indépendance" },
    { mois: 4, jour: 9, nom: "Jour des Martyrs" },
    { mois: 5, jour: 1, nom: "Fête du Travail" },
    { mois: 7, jour: 25, nom: "Fête de la République" },
    { mois: 8, jour: 13, nom: "Fête de la Femme" },
    { mois: 10, jour: 15, nom: "Fête de l'Évacuation" },
    { mois: 12, jour: 17, nom: "Fête de la Révolution" },
];

// Fêtes religieuses — dates estimées par année.
const FERIES_MOBILES = {
    2026: {
        "2026-03-20": "Aïd el-Fitr",
        "2026-05-27": "Aïd el-Adha",
        "2026-06-17": "Nouvel An hégirien",
        "2026-08-26": "Mawlid",
    },
    2027: {
        "2027-03-10": "Aïd el-Fitr",
        "2027-05-17": "Aïd el-Adha",
        "2027-06-06": "Nouvel An hégirien",
        "2027-08-15": "Mawlid",
    },
};

const pad = (n) => String(n).padStart(2, "0");

/**
 * Liste des jours fériés tunisiens d'une année.
 * @param {number} annee
 * @returns {{date: string, nom: string}[]} triée par date (YYYY-MM-DD)
 */
export function joursFeriesTunisie(annee) {
    const liste = [];

    for (const f of FERIES_FIXES) {
        liste.push({
            date: `${annee}-${pad(f.mois)}-${pad(f.jour)}`,
            nom: f.nom,
        });
    }

    const mobiles = FERIES_MOBILES[annee] || {};
    for (const [date, nom] of Object.entries(mobiles)) {
        if (date.startsWith(`${annee}-`)) {
            liste.push({ date, nom });
        }
    }

    liste.sort((a, b) => (a.date < b.date ? -1 : 1));

    return liste;
}
