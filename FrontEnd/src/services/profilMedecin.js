import { useEffect, useState } from "react";
import axios from "axios";

/*
|--------------------------------------------------------------------------
| PROFIL DU MÉDECIN CONNECTÉ (espace médecin)
|--------------------------------------------------------------------------
|
| La photo de profil est enregistrée sur la fiche médecin
| (table medecin, colonne photo) et non sur le compte de connexion.
| Ce module centralise :
|   - la lecture des informations stockées dans la session locale,
|   - l'URL publique de la photo,
|   - la synchronisation entre la page « Mon profil » et la barre
|     latérale (via un événement personnalisé, sans reconnexion).
|--------------------------------------------------------------------------
*/

export const API_BASE = "http://127.0.0.1:8000";
export const API_URL = `${API_BASE}/api`;

/* Émis lorsque la photo de profil du médecin change. */
export const EVENEMENT_PROFIL = "medecin-profil-maj";

/* URL publique d'une photo stockée côté back-end (storage/app/public). */
export const urlPhoto = (photo) =>
    photo ? `${API_BASE}/storage/${photo}` : null;

/* Informations de session ("user") : localStorage puis sessionStorage. */
export function lireUser() {
    try {
        const brut =
            localStorage.getItem("user") || sessionStorage.getItem("user");
        return brut ? JSON.parse(brut) : {};
    } catch {
        return {};
    }
}

/* Initiales de repli quand aucune photo n'est disponible. */
export function initiales(user = lireUser()) {
    return (user?.initiales || user?.prenom || user?.name || "M")
        .charAt(0)
        .toUpperCase();
}

/* Nom affiché du médecin connecté. */
export function nomComplet(user = lireUser()) {
    const complet =
        [user?.prenom, user?.nom].filter(Boolean).join(" ") || user?.name || "";
    return complet.trim();
}

/*
| Enregistre la photo dans la session locale (les deux stockages si
| possible) puis prévient les composants montés — la barre latérale
| se met donc à jour immédiatement après un envoi depuis « Mon profil ».
*/
export function enregistrerPhotoProfil(photo) {
    const patch = { photo: photo ?? null, photo_url: urlPhoto(photo) };

    [localStorage, sessionStorage].forEach((stockage) => {
        const brut = stockage.getItem("user");
        if (!brut) return;

        try {
            stockage.setItem(
                "user",
                JSON.stringify({ ...JSON.parse(brut), ...patch })
            );
        } catch {
            /* stockage indisponible : on ignore */
        }
    });

    window.dispatchEvent(
        new CustomEvent(EVENEMENT_PROFIL, { detail: patch })
    );
}

/*
| Photo de profil du médecin connecté.
| Valeur initiale : session locale ; puis rafraîchie depuis l'API pour
| couvrir les sessions ouvertes avant l'ajout de la photo (ou une photo
| modifiée côté administration).
*/
export function usePhotoProfilMedecin() {
    const [photo, setPhoto] = useState(() => lireUser().photo_url || null);

    useEffect(() => {
        const surMiseAJour = (event) =>
            setPhoto(event.detail?.photo_url ?? urlPhoto(lireUser().photo));

        window.addEventListener(EVENEMENT_PROFIL, surMiseAJour);

        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");

        if (token) {
            axios
                .get(`${API_URL}/medecin/profil`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                })
                .then((response) => {
                    const medecin = response.data?.data;
                    if (!medecin) return;

                    const url = medecin.photo_url || urlPhoto(medecin.photo);
                    setPhoto(url || null);

                    if ((lireUser().photo || null) !== (medecin.photo || null)) {
                        enregistrerPhotoProfil(medecin.photo || null);
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
