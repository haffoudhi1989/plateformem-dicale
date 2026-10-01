import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    AlertCircle,
    CheckCircle2,
    Loader2,
    Lock,
    LogOut,
    MessageCircle,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

/* =====================================================
   ABONNEMENT DU CABINET — espace médecin / secrétaire

   L'abonnement appartient au cabinet : médecin et secrétaire
   ne peuvent pas le renouveler eux-mêmes. Si l'abonnement
   n'est plus actif (expiré ou non souscrit), leur espace est
   bloqué afin de régulariser la situation auprès du cabinet
   ou de l'administration.

   Espace secrétaire : la Messagerie reste accessible et un
   bouton envoie directement un message à l'administration.
   Espace médecin : aucun envoi (pas d'accès messagerie).
===================================================== */

const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
    Accept: "application/json",
});

/**
 * Récupère l'abonnement du cabinet de l'utilisateur connecté.
 *
 * `bloque` n'est vrai que si un statut a bien été reçu et qu'il
 * n'est pas "actif" : en cas d'erreur réseau / API (ou de compte
 * sans cabinet), on ne verrouille pas l'espace par erreur.
 */
export function useAbonnementCabinet() {
    const [abo, setAbo] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!getToken()) {
            setLoaded(true);
            return;
        }

        axios
            .get(`${API_URL}/cabinet/abonnement`, { headers: authHeaders() })
            .then((res) => {
                setAbo(
                    res.data?.success === false ? null : res.data?.data || null
                );
            })
            .catch(() => setAbo(null))
            .finally(() => setLoaded(true));
    }, []);

    const statut = abo?.statut || null;

    return {
        abo,
        statut,
        dateFin: abo?.date_fin || null,
        plan: abo?.plan || null,
        loaded,
        bloque: loaded && !!statut && statut !== "actif",
    };
}

/** 2026-09-10 -> 10/09/2026 */
export const formatDateFr = (d) => {
    if (!d) return "";
    const p = String(d).split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
};

/**
 * Écran de blocage affiché à la place du contenu de l'espace.
 *
 * @param statut   "expire" | "aucun" | ...
 * @param dateFin  date de fin d'abonnement (AAAA-MM-JJ)
 * @param espace   "medecin" | "secretaire" (la secrétaire garde
 *                 l'accès à la Messagerie pour joindre l'administration)
 */
export default function BlocageAbonnement({
    statut,
    dateFin,
    espace = "medecin",
}) {
    const navigate = useNavigate();
    const estSecretaire = espace === "secretaire";
    const expire = statut === "expire";

    /* Envoi direct d'un message à l'administration (secrétaire) */
    const [envoi, setEnvoi] = useState("idle"); // idle | sending | ok | error

    const messageAdministration = expire
        ? `Bonjour, l'abonnement de notre cabinet a expiré le ${formatDateFr(
              dateFin
          )} : l'accès à l'espace secrétaire est bloqué. Merci de régulariser la situation.`
        : "Bonjour, aucun abonnement actif n'est associé à notre cabinet : l'accès à l'espace secrétaire est bloqué. Merci de régulariser la situation.";

    const contacterAdministration = async () => {
        if (!getToken()) {
            setEnvoi("error");
            return;
        }

        setEnvoi("sending");

        try {
            const reponse = await axios.get(
                `${API_URL}/staff/messages/contacts`,
                { headers: authHeaders() }
            );

            const admins = (reponse.data?.data || []).filter(
                (contact) => contact.type === "admin"
            );

            if (!admins.length) {
                setEnvoi("error");
                return;
            }

            await Promise.all(
                admins.map((admin) =>
                    axios.post(
                        `${API_URL}/staff/messages/send`,
                        {
                            receiver_type: "admin",
                            receiver_id: admin.id,
                            content: messageAdministration,
                        },
                        { headers: authHeaders() }
                    )
                )
            );

            setEnvoi("ok");
        } catch (error) {
            console.error(error);
            setEnvoi("error");
        }
    };

    const deconnexion = async () => {
        try {
            await axios.post(
                `${API_URL}/logout`,
                {},
                { headers: authHeaders() }
            );
        } catch (error) {
            console.error(error);
        }

        ["token", "user", "space"].forEach((cle) => {
            localStorage.removeItem(cle);
            sessionStorage.removeItem(cle);
        });

        navigate("/login");
    };

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-xl mx-auto mt-6 rounded-2xl bg-white border border-[#E7E1D5] p-8 text-center shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                    <Lock size={26} />
                </div>

                <h1 className="text-xl font-bold text-[#1C1B19]">
                    {expire
                        ? "Abonnement du cabinet expiré"
                        : "Aucun abonnement actif pour votre cabinet"}
                </h1>

                <p className="text-sm text-[#8C8577] mt-2 leading-6">
                    {expire
                        ? `L'abonnement de votre cabinet a expiré le ${formatDateFr(
                              dateFin
                          )}. Votre espace est temporairement bloqué afin de régulariser la situation.`
                        : "L'abonnement de votre cabinet n'est pas actif. Votre espace est temporairement bloqué afin de régulariser la situation."}
                </p>

                <p className="text-sm text-[#8C8577] mt-2 leading-6">
                    {estSecretaire
                        ? "La Messagerie reste ouverte : vous pouvez joindre le responsable de votre cabinet ou l'administration pour le renouvellement. L'accès sera rétabli automatiquement dès la réactivation de l'abonnement."
                        : "La régularisation se fait auprès du responsable de votre cabinet. L'accès sera rétabli automatiquement dès la réactivation de l'abonnement."}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    {estSecretaire && envoi !== "ok" && (
                        <button
                            type="button"
                            onClick={contacterAdministration}
                            disabled={envoi === "sending"}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#26415E] hover:bg-[#1C3149] px-6 py-3 font-semibold text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {envoi === "sending" ? (
                                <Loader2 size={17} className="animate-spin" />
                            ) : (
                                <MessageCircle size={17} />
                            )}

                            {envoi === "sending"
                                ? "Envoi en cours…"
                                : "Contacter l'administration"}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={deconnexion}
                        className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors cursor-pointer ${
                            estSecretaire
                                ? "border border-[#E7E1D5] bg-white hover:bg-[#F6F3EE] text-[#4A453D]"
                                : "bg-[#26415E] hover:bg-[#1C3149] text-white"
                        }`}
                    >
                        <LogOut size={17} />
                        Se déconnecter
                    </button>
                </div>

                {estSecretaire && envoi === "ok" && (
                    <div className="mt-6">
                        <p className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 text-emerald-700 px-4 py-3 text-sm font-semibold">
                            <CheckCircle2 size={17} />
                            Message envoyé à l'administration.
                        </p>

                        <button
                            type="button"
                            onClick={() => navigate("/secretaire/messages")}
                            className="mt-4 flex mx-auto items-center gap-2 rounded-lg border border-[#E7E1D5] bg-white hover:bg-[#F6F3EE] px-5 py-2.5 text-sm font-semibold text-[#4A453D] transition-colors cursor-pointer"
                        >
                            <MessageCircle size={16} />
                            Ouvrir la messagerie
                        </button>
                    </div>
                )}

                {estSecretaire && envoi === "error" && (
                    <div className="mt-6">
                        <p className="inline-flex items-center gap-2 rounded-lg bg-rose-50 text-rose-700 px-4 py-3 text-sm font-semibold">
                            <AlertCircle size={17} />
                            Envoi impossible. Écrivez depuis la Messagerie.
                        </p>

                        <button
                            type="button"
                            onClick={() => navigate("/secretaire/messages")}
                            className="mt-4 flex mx-auto items-center gap-2 rounded-lg border border-[#E7E1D5] bg-white hover:bg-[#F6F3EE] px-5 py-2.5 text-sm font-semibold text-[#4A453D] transition-colors cursor-pointer"
                        >
                            <MessageCircle size={16} />
                            Ouvrir la messagerie
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
