/*
|--------------------------------------------------------------------------
| MESSAGES NON LUS — RAFRAÎCHISSEMENT IMMÉDIAT
|--------------------------------------------------------------------------
|
| L'ouverture d'une discussion marque ses messages comme lus côté API.
| Pour que le nombre de messages non lus (pastille de la barre latérale,
| onglets de la page Messagerie) diminue immédiatement — sans attendre le
| rafraîchissement automatique — les composants concernés écoutent
| l'événement diffusé ci-dessous.
|--------------------------------------------------------------------------
*/

export const EVENEMENT_NON_LUS = "messages-non-lus-maj";

/**
 * À appeler dès qu'une discussion est ouverte (messages marqués lus)
 * ou qu'un message est envoyé.
 */
export function signalerLectureMessages() {
    window.dispatchEvent(new Event(EVENEMENT_NON_LUS));
}
