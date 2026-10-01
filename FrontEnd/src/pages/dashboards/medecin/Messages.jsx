import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { MessageCircle, UserRound, Users } from "lucide-react";
import MessagerieInterne from "../../../components/MessagerieInterne";
import StaffMessenger from "../../../components/StaffMessenger";
import { EVENEMENT_NON_LUS } from "../../../services/messagesNonLus";

const API_URL = "http://127.0.0.1:8000/api";

/** Contact du carnet « patients » : rôle patient, ou rôle non renseigné. */
function estPatient(c) {
    const role = String(c?.role || c?.type || "").toLowerCase().trim();
    if (!role) return true;
    return role.includes("patient");
}

/** Pastille du nombre de messages non lus d'un canal. */
function Compteur({ nombre }) {
    if (!nombre) {
        return null;
    }

    return (
        <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold">
            {nombre > 99 ? "99+" : nombre}
        </span>
    );
}

/**
 * Canaux de la messagerie du médecin.
 *  - « Mes patients » : table `messages` (API /mes-contacts + /messages/…)
 *  - « Secrétaires »  : messagerie du personnel (API /staff/messages/…),
 *                       limitée au secrétariat du cabinet : l'administration
 *                       n'est pas affichée dans l'espace médecin.
 */
const CANAUX = [
    {
        id: "patients",
        label: "Mes patients",
        description: "Échanges avec vos patients",
        icon: UserRound,
    },
    {
        id: "secretaires",
        label: "Secrétaires",
        description: "Secrétariat du cabinet",
        icon: Users,
    },
];

/* Groupe de contacts affiché par le canal du personnel. */
const GROUPES_SECRETARIAT = ["Secrétaires"];

export default function Messages() {
    const [canal, setCanal] = useState("patients");
    const [nonLusPatients, setNonLusPatients] = useState(0);
    const [nonLusSecretaires, setNonLusSecretaires] = useState(0);

    /* Compteurs des deux canaux : messages reçus non lus, par type de contact.
       Chaque compteur ne retient que les contacts réellement affichés dans le
       canal correspondant : le nombre diminue donc toujours quand on ouvre la
       discussion concernée. */
    const chargerCompteurs = useCallback(async () => {
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");

        if (!token) return;

        const headers = {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        };

        const [contacts, staff] = await Promise.allSettled([
            axios.get(`${API_URL}/mes-contacts`, { headers }),
            axios.get(`${API_URL}/staff/messages/contacts`, { headers }),
        ]);

        if (contacts.status === "fulfilled") {
            const liste = Array.isArray(contacts.value.data?.data)
                ? contacts.value.data.data
                : [];

            setNonLusPatients(
                liste
                    .filter(estPatient)
                    .reduce((total, c) => total + (Number(c.unread) || 0), 0)
            );
        }

        if (staff.status === "fulfilled") {
            const liste = Array.isArray(staff.value.data?.data)
                ? staff.value.data.data
                : [];

            /* Seul le secrétariat du cabinet est affiché dans ce canal : les
               messages de l'administration ne sont donc pas comptés ici. */
            setNonLusSecretaires(
                liste
                    .filter((c) => GROUPES_SECRETARIAT.includes(c?.groupe))
                    .reduce((total, c) => total + (Number(c.unread) || 0), 0)
            );
        }
    }, []);

    useEffect(() => {
        chargerCompteurs();

        /* Décrément immédiat quand une discussion est ouverte */
        window.addEventListener(EVENEMENT_NON_LUS, chargerCompteurs);

        const timer = setInterval(chargerCompteurs, 30000);

        return () => {
            window.removeEventListener(EVENEMENT_NON_LUS, chargerCompteurs);
            clearInterval(timer);
        };
    }, [chargerCompteurs]);

    const compteurs = {
        patients: nonLusPatients,
        secretaires: nonLusSecretaires,
    };

    return (
        <div className="bg-slate-50">
            <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Bannière */}
                <div className="rounded-2xl bg-gradient-to-r from-[#14532D] to-[#059669] shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-white/15 border border-white/20 items-center justify-center text-white">
                            <MessageCircle size={22} />
                        </div>

                        <div>
                            <h1 className="text-xl font-bold text-white">
                                Messagerie
                            </h1>

                            <p className="text-sm text-emerald-50/90 mt-0.5">
                                Échangez avec vos patients et le secrétariat du
                                cabinet
                            </p>
                        </div>
                    </div>
                </div>

                {/* Choix du canal */}
                <div className="flex flex-wrap items-center gap-2">
                    {CANAUX.map((item) => {
                        const Icon = item.icon;
                        const actif = canal === item.id;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setCanal(item.id)}
                                aria-pressed={actif}
                                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition cursor-pointer ${
                                    actif
                                        ? "bg-emerald-700 border-emerald-700 text-white shadow-sm"
                                        : "bg-white border-slate-200/80 text-slate-600 hover:border-emerald-200 hover:text-emerald-800"
                                }`}
                            >
                                <Icon size={16} />
                                {item.label}
                                <Compteur nombre={compteurs[item.id]} />
                            </button>
                        );
                    })}
                </div>

                {/* Canal actif */}
                <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden h-[580px]">
                    {canal === "patients" ? (
                        <MessagerieInterne
                            titre="Mes patients"
                            filtreRoles={["patient"]}
                        />
                    ) : (
                        <StaffMessenger groupes={GROUPES_SECRETARIAT} />
                    )}
                </div>
            </div>
        </div>
    );
}
