import React, { useEffect, useState } from "react";
import { urlPhoto } from "../services/profilMedecin";

/*
|--------------------------------------------------------------------------
| PHOTO DE PROFIL (avatar rond) — médecin, secrétaire…
|--------------------------------------------------------------------------
|
| Accepte :
|   - photoUrl : URL complète (photo_url renvoyée par l'API)
|   - photo    : chemin stocké en base (ex. « medecins/med21.jpg »)
|
| Aucune pastille d'initiales de repli : si aucune photo n'est disponible
| (ou si le fichier est introuvable), rien ne s'affiche.
|--------------------------------------------------------------------------
*/

export default function PhotoProfil({
    photoUrl = null,
    photo = null,
    taille = "w-10 h-10",
}) {
    const url = photoUrl || urlPhoto(photo);

    const [cassee, setCassee] = useState(false);

    useEffect(() => {
        setCassee(false);
    }, [url]);

    if (!url || cassee) {
        return null;
    }

    return (
        <img
            src={url}
            alt="Profil"
            onError={() => setCassee(true)}
            className={`${taille} shrink-0 rounded-full object-cover bg-white ring-2 ring-[#14532D]/15`}
        />
    );
}
