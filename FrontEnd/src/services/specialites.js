/*
|--------------------------------------------------------------------------
| SPÉCIALITÉS PROPOSÉES DANS L'APPLICATION
|--------------------------------------------------------------------------
|
| Seules les spécialités ci-dessous sont chargées dans les listes
| déroulantes de l'application (profil du médecin, fiche médecin côté
| administration).
|
| Les autres spécialités restent en base et dans la gestion des
| spécialités de l'espace admin : il suffit d'ajouter un nom ici pour
| qu'il réapparaisse dans les listes déroulantes.
|--------------------------------------------------------------------------
*/

export const SPECIALITES_AUTORISEES = ["Dentiste", "Médecine générale"];

/* Ne conserve que les spécialités autorisées (comparaison sans casse). */
export function filtrerSpecialites(liste = []) {
    const autorisees = SPECIALITES_AUTORISEES.map((nom) =>
        nom.trim().toLowerCase()
    );

    return (Array.isArray(liste) ? liste : []).filter((specialite) =>
        autorisees.includes((specialite?.nom || "").trim().toLowerCase())
    );
}
