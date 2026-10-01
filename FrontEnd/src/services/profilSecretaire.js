import { useEffect, useState } from "react";
import axios from "axios";
import {
    API_URL,
    EVENEMENT_PROFIL,
    enregistrerPhotoProfil,
    lireUser,
    urlPhoto,
} from "./profilMedecin";

/*
|--------------------------------------------------------------------------
| PHOTO DU SECRÉTAIRE CONNECTÉ (espace secrétariat)
|--------------------------------------------------------------------------
|
| La photo est enregistrée sur la fiche secrétaire (table secretaires,
| colonne photo), pas sur le compte de connexion — même principe que la
| photo du médecin.
|
| Les helpers de session (API_URL, urlPhoto, lireUser,
| enregistrerPhotoProfil, EVENEMENT_PROFIL) sont génériques : ils sont
| réutilisés depuis le module profilMedecin et ré-exportés ici pour que
| l'espace secrétariat dispose des mêmes fonctions.
|--------------------------------------------------------------------------
*/

export {
    API_URL,
    EVENEMENT_PROFIL,
    enregistrerPhotoProfil,
    lireUser,
    urlPhoto,
};

/*
| Photo de profil du secrétaire connecté.
| Valeur initiale : session locale ; puis rafraîchie depuis l'API pour
| couvrir les sessions ouvertes avant l'ajout de la photo.
*/
export function usePhotoProfilSecretaire() {
    const [photo, setPhoto] = useState(() => lireUser().photo_url || null);

    useEffect(() => {
        const surMiseAJour = (event) =>
            setPhoto(event.detail?.photo_url ?? urlPhoto(lireUser().photo));

        window.addEventListener(EVENEMENT_PROFIL, surMiseAJour);

        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");

        if (token) {
            axios
                .get(`${API_URL}/secretaire/profil`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                })
                .then((response) => {
                    const fiche = response.data?.data;
                    if (!fiche) return;

                    const url = fiche.photo_url || urlPhoto(fiche.photo);
                    setPhoto(url || null);

                    if ((lireUser().photo || null) !== (fiche.photo || null)) {
                        enregistrerPhotoProfil(fiche.photo || null);
                    }
                })
                .catch(() => {
                    /* profil non accessible : on garde la valeur locale */
                });
        }

        return () => window.removeEventListener(EVENEMENT_PROFIL, surMiseAJour);
    }, []);

    return photo;
}
