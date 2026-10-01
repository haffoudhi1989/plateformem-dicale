import { useEffect, useState } from "react";
import axios from "axios";
import { EVENEMENT_NON_LUS } from "../services/messagesNonLus";

const API_URL = "http://127.0.0.1:8000/api";

/**
 * Pastille du nombre de messages non lus.
 *
 * Compte les messages REÇUS non lus du membre du personnel connecté,
 * toutes messageries confondues (l'API /staff/messages/non-lus cumule
 * la messagerie du personnel et la messagerie historique).
 *
 * Le nombre diminue dès qu'une discussion est ouverte : l'ouverture
 * marque ses messages comme lus et diffuse l'événement écouté ici
 * (rafraîchissement immédiat, sans attendre les 30 s).
 *
 * Composant autonome : il n'affiche rien tant que le compteur est à zéro.
 */
export default function BadgeNonLus({ className = "" }) {
    const [nonLus, setNonLus] = useState(0);

    useEffect(() => {
        let actif = true;

        const charger = async () => {
            const token =
                localStorage.getItem("token") ||
                sessionStorage.getItem("token");

            if (!token) return;

            try {
                const res = await axios.get(
                    `${API_URL}/staff/messages/non-lus`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    }
                );

                // Total des messages non lus (staff_messages + messages)
                const total = Number(res.data?.total) || 0;

                if (actif) setNonLus(total);
            } catch (error) {
                // Silencieux : la pastille ne doit jamais gêner la navigation
            }
        };

        charger();

        /* Rafraîchissement immédiat après ouverture d'une discussion */
        window.addEventListener(EVENEMENT_NON_LUS, charger);

        const timer = setInterval(charger, 30000);

        return () => {
            actif = false;
            window.removeEventListener(EVENEMENT_NON_LUS, charger);
            clearInterval(timer);
        };
    }, []);

    if (!nonLus) return null;

    return (
        <span
            className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shrink-0 ${className}`}
        >
            {nonLus > 99 ? "99+" : nonLus}
        </span>
    );
}
