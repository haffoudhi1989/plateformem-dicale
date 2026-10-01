import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Mail } from "lucide-react";
import StaffMessenger from "../../../components/StaffMessenger";
import { EVENEMENT_NON_LUS } from "../../../services/messagesNonLus";

const API_URL = "http://127.0.0.1:8000/api";

/**
 * Messagerie de l'espace secrétariat.
 *
 * Un seul canal : la messagerie du personnel, soit les médecins du cabinet
 * et l'administration. La messagerie historique (patients/médecins) est
 * réservée aux comptes `users` et n'est pas accessible au secrétariat.
 *
 * Le nombre de messages non lus (messages reçus non lus) est affiché dans
 * l'en-tête et se met à jour immédiatement quand une discussion est ouverte.
 */
export default function Messages() {
    const navigate = useNavigate();

    const [nonLus, setNonLus] = useState(0);

    /* Nombre de messages non lus du secrétaire */
    const chargerNonLus = useCallback(async () => {
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");

        if (!token) return;

        try {
            const response = await axios.get(
                `${API_URL}/staff/messages/non-lus`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            setNonLus(Number(response.data?.total) || 0);
        } catch {
            /* compteur indisponible : on garde la valeur courante */
        }
    }, []);

    useEffect(() => {
        chargerNonLus();

        /* Décrément immédiat quand une discussion est ouverte */
        window.addEventListener(EVENEMENT_NON_LUS, chargerNonLus);

        return () =>
            window.removeEventListener(EVENEMENT_NON_LUS, chargerNonLus);
    }, [chargerNonLus]);

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            {/* EN-TÊTE — BANNIÈRE VERRE */}
            <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/60 backdrop-blur-md shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="absolute -top-10 -right-8 h-32 w-32 rounded-full bg-emerald-200/30 blur-2xl pointer-events-none" />

                <div className="relative">
                    <div className="flex items-center gap-2 mb-1">
                        <button
                            type="button"
                            onClick={() => navigate("/secretaire/dashboard")}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-violet-600 transition cursor-pointer"
                        >
                            <ChevronLeft size={16} />
                            Dashboard
                        </button>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600">
                            Secrétariat Médical
                        </span>
                    </div>

                    <h1 className="text-xl font-bold text-slate-900">
                        Messagerie
                    </h1>

                    <p className="text-sm text-slate-500 mt-0.5">
                        Échangez avec les médecins du cabinet et l'administration
                    </p>
                </div>

                <div className="relative flex flex-wrap items-center gap-2.5">
                    {/* Nombre de messages non lus */}
                    <span
                        className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-bold ${
                            nonLus > 0
                                ? "bg-rose-50 border-rose-200 text-rose-700"
                                : "bg-white border-slate-200/80 text-slate-500"
                        }`}
                    >
                        <Mail size={15} />
                        {nonLus > 0
                            ? `${nonLus} message${nonLus > 1 ? "s" : ""} non lu${nonLus > 1 ? "s" : ""}`
                            : "Aucun message non lu"}
                    </span>

                    <button
                        type="button"
                        onClick={() => navigate("/secretaire/dashboard")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-slate-700 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                    >
                        <ChevronLeft size={16} />
                        <span>Dashboard</span>
                    </button>
                </div>
            </div>

            {/* MESSAGERIE DU PERSONNEL */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden h-[580px]">
                <StaffMessenger groupes={["Médecins", "Administration"]} />
            </div>
        </div>
    );
}
