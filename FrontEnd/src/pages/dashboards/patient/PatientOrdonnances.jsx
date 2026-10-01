import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    FileText,
    RefreshCw,
    Calendar,
    CalendarDays,
    X,
    User,
    ArrowLeft,
    CheckCircle,
    Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:8000/api";

// =====================================================
// TOKEN
// =====================================================

const getToken = () => {
    return (
        localStorage.getItem("token") ||
        sessionStorage.getItem("token")
    );
};

// =====================================================
// UTILISATEUR CONNECTÉ
// =====================================================

const getUser = () => {
    const user =
        localStorage.getItem("user") ||
        sessionStorage.getItem("user");

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch (error) {
        console.error("Utilisateur invalide :", error);
        return null;
    }
};

// =====================================================
// AXIOS
// =====================================================

const api = axios.create({
    baseURL: API,
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = getToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// =====================================================
// COMPOSANT
// =====================================================

function PatientOrdonnances() {
    const navigate = useNavigate();

    const [ordonnances, setOrdonnances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filtres (médecin / date)
    const [filtreMedecin, setFiltreMedecin] = useState("");
    const [filtreDate, setFiltreDate] = useState("");

    // =================================================
    // CHARGER LES ORDONNANCES
    // =================================================

    const fetchOrdonnances = async () => {
        const token = getToken();

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await api.get("/patient/ordonnances");

            const data = response.data;

            let liste = [];

            if (Array.isArray(data)) {
                liste = data;
            } else if (Array.isArray(data.ordonnances)) {
                liste = data.ordonnances;
            } else if (Array.isArray(data.data)) {
                liste = data.data;
            } else if (
                data.data &&
                Array.isArray(data.data.ordonnances)
            ) {
                liste = data.data.ordonnances;
            }

            setOrdonnances(liste);
        } catch (err) {
            console.error(
                "Erreur API ordonnances :",
                err.response?.status,
                err.response?.data || err
            );

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");

                navigate("/login");
                return;
            }

            setError(
                err.response?.data?.message ||
                "Impossible de charger vos ordonnances."
            );

            setOrdonnances([]);
        } finally {
            setLoading(false);
        }
    };

    // =================================================
    // CHARGEMENT INITIAL
    // =================================================

    useEffect(() => {
        fetchOrdonnances();
    }, []);

    // =================================================
    // DATE
    // =================================================

    const formatDate = (date) => {
        if (!date) {
            return "Date inconnue";
        }

        const parsedDate = new Date(date);

        if (isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString(
            "fr-FR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }
        );
    };

    // =================================================
    // STATUT
    // =================================================

    const getStatus = (statut) => {
        if (statut === "active") {
            return {
                text: "Active",
                className:
                    "bg-emerald-50 text-emerald-700 border border-emerald-100",
                icon: <CheckCircle size={15} />,
            };
        }

        return {
            text: statut || "Inconnue",
            className:
                "bg-slate-100 text-slate-600",
            icon: <Clock size={15} />,
        };
    };

    // =================================================
    // FILTRES (MÉDECIN / DATE)
    // =================================================

    // Clé unique du médecin d'une ordonnance (id réel si présent)
    const getMedecinKey = (ordonnance) => {
        const medecin = ordonnance?.medecin;

        if (!medecin) {
            return "";
        }

        if (medecin.id !== undefined && medecin.id !== null) {
            return String(medecin.id);
        }

        return `${medecin.prenom || ""} ${medecin.nom || ""}`.trim();
    };

    // Libellé du médecin, identique à celui affiché dans la liste
    const getMedecinLabel = (medecin) => {
        if (!medecin) {
            return "Médecin";
        }

        return `Dr. ${medecin.prenom || ""} ${medecin.nom || ""}`.trim();
    };

    // Médecins réellement présents dans les ordonnances chargées
    const medecins = Array.from(
        new Map(
            ordonnances
                .filter((ordonnance) => ordonnance.medecin)
                .map((ordonnance) => [
                    getMedecinKey(ordonnance),
                    getMedecinLabel(ordonnance.medecin),
                ])
                .filter(([key]) => key !== "")
        ).entries()
    );

    // Convertit une date en "AAAA-MM-JJ" (pour input type="date")
    const toDateKey = (date) => {
        if (!date) {
            return "";
        }

        const parsedDate = new Date(date);

        if (isNaN(parsedDate.getTime())) {
            return "";
        }

        const mois = String(parsedDate.getMonth() + 1).padStart(2, "0");
        const jour = String(parsedDate.getDate()).padStart(2, "0");

        return `${parsedDate.getFullYear()}-${mois}-${jour}`;
    };

    // Application combinée médecin ET date
    const ordonnancesFiltrees = ordonnances.filter((ordonnance) => {
        const matchMedecin =
            !filtreMedecin ||
            getMedecinKey(ordonnance) === filtreMedecin;

        const matchDate =
            !filtreDate ||
            toDateKey(ordonnance.date_ordonnance) === filtreDate;

        return matchMedecin && matchDate;
    });

    // =================================================
    // AFFICHAGE
    // =================================================

    return (
        <div className="bg-slate-50">
            <div className="max-w-6xl mx-auto px-6 py-10">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 mt-1">
                            Mes ordonnances
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Consultez vos prescriptions médicales
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={fetchOrdonnances}
                            aria-label="Actualiser"
                            className="inline-flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                        >
                            <RefreshCw size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/patient/dashboard")}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                        >
                            <ArrowLeft size={16} />
                            Dashboard
                        </button>
                    </div>
                </div>

                {/* =================================================
                    FILTRES (MÉDECIN / DATE)
                ================================================= */}

                {!loading && !error && ordonnances.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                        {/* MÉDECIN */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                            <User size={15} className="text-slate-400" />
                            <select
                                value={filtreMedecin}
                                onChange={(event) =>
                                    setFiltreMedecin(event.target.value)
                                }
                                aria-label="Filtrer par médecin"
                                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                            >
                                <option value="">Tous les médecins</option>
                                {medecins.map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* DATE */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                            <CalendarDays size={15} className="text-slate-400" />
                            <input
                                type="date"
                                value={filtreDate}
                                onChange={(event) =>
                                    setFiltreDate(event.target.value)
                                }
                                aria-label="Filtrer par date"
                                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                            />
                            {filtreDate && (
                                <button
                                    type="button"
                                    onClick={() => setFiltreDate("")}
                                    aria-label="Effacer la date"
                                    className="inline-flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* =================================================
                    CHARGEMENT
                ================================================= */}

                {loading && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                        <RefreshCw
                            size={32}
                            className="mx-auto mb-4 animate-spin text-rose-600"
                        />
                        <p className="text-sm text-slate-500">
                            Chargement de vos ordonnances...
                        </p>
                    </div>
                )}

                {/* =================================================
                    ERREUR
                ================================================= */}

                {!loading && error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                        <p className="font-medium text-red-600">
                            {error}
                        </p>
                        <button
                            type="button"
                            onClick={fetchOrdonnances}
                            className="mt-4 rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700"
                        >
                            Réessayer
                        </button>
                    </div>
                )}

                {/* =================================================
                    AUCUNE ORDONNANCE
                ================================================= */}

                {!loading &&
                    !error &&
                    ordonnances.length === 0 && (
                        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-sm">
                            <FileText
                                size={48}
                                className="mx-auto mb-5 text-slate-300"
                            />
                            <h2 className="text-lg font-semibold text-slate-800">
                                Aucune ordonnance
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Vous n'avez aucune ordonnance pour le moment.
                            </p>
                        </div>
                    )}

                {/* =================================================
                    AUCUN RÉSULTAT POUR LE FILTRE
                ================================================= */}

                {!loading &&
                    !error &&
                    ordonnances.length > 0 &&
                    ordonnancesFiltrees.length === 0 && (
                        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-sm">
                            <FileText
                                size={48}
                                className="mx-auto mb-5 text-slate-300"
                            />
                            <h2 className="text-lg font-semibold text-slate-800">
                                Aucune ordonnance pour ce filtre.
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                {filtreDate && !filtreMedecin
                                    ? "Aucune ordonnance à cette date."
                                    : filtreMedecin && !filtreDate
                                        ? "Aucune ordonnance pour ce médecin."
                                        : "Aucune ordonnance ne correspond à ce médecin et à cette date."}
                            </p>
                        </div>
                    )}

                {/* =================================================
                    ORDONNANCES
                ================================================= */}

                {!loading &&
                    !error &&
                    ordonnancesFiltrees.length > 0 && (
                        <div className="grid gap-6 md:grid-cols-2">
                            {ordonnancesFiltrees.map((ordonnance) => {
                                const status = getStatus(ordonnance.statut);
                                const medecin = ordonnance.medecin;
                                const cabinet = medecin?.cabinet;
                                const lignes = ordonnance.lignes || [];

                                return (
                                    <article
                                        key={ordonnance.id}
                                        className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden"
                                    >
                                        {/* EN-TÊTE MÉDECIN */}
                                        <div className="border-b-2 border-dashed border-slate-200 px-6 py-4 flex items-start justify-between gap-4">
                                            <div>
                                                <p className="font-serif text-lg font-bold text-slate-900">
                                                    Dr. {medecin?.prenom} {medecin?.nom}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {medecin?.specialite?.nom || "Médecin"}
                                                </p>
                                                {medecin?.telephone && (
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Tél : {medecin.telephone}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right text-xs text-slate-500">
                                                {cabinet?.nom && (
                                                    <p className="font-semibold text-slate-600">{cabinet.nom}</p>
                                                )}
                                                {cabinet?.adresse && (
                                                    <p className="mt-0.5">{cabinet.adresse}</p>
                                                )}
                                                {cabinet?.telephone && (
                                                    <p className="mt-0.5">Tél : {cabinet.telephone}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* CORPS DE L'ORDONNANCE */}
                                        <div className="px-6 py-5 font-serif">
                                            {/* TITRE + DATE */}
                                            <div className="flex items-start justify-between gap-4 mb-5">
                                                <h2 className="text-xl font-bold tracking-wide text-slate-900">
                                                    ORDONNANCE
                                                </h2>
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-500">
                                                        Le {formatDate(ordonnance.date_ordonnance)}
                                                    </p>
                                                    <span
                                                        className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${status.className}`}
                                                    >
                                                        {status.icon}
                                                        {status.text}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* PATIENT */}
                                            <p className="text-sm text-slate-700 mb-5">
                                                <span className="font-semibold">Patient :</span>{" "}
                                                {ordonnance.patient?.prenom} {ordonnance.patient?.nom}
                                            </p>

                                            {/* MÉDICAMENTS */}
                                            {lignes.length > 0 ? (
                                                <div className="space-y-4">
                                                    {lignes.map((ligne, index) => (
                                                        <div key={index} className="pl-4 border-l-2 border-blue-100">
                                                            <p className="text-sm font-semibold text-slate-800">
                                                                {index + 1}. {ligne.medicament}
                                                                {ligne.dosage && (
                                                                    <span className="font-normal text-slate-500">
                                                                        {" "}
                                                                        — {ligne.dosage}
                                                                    </span>
                                                                )}
                                                            </p>
                                                            {(ligne.frequence || ligne.duree || ligne.quantite) && (
                                                                <p className="text-xs text-slate-500 mt-0.5 italic">
                                                                    {[
                                                                        ligne.frequence,
                                                                        ligne.duree,
                                                                        ligne.quantite ? `${ligne.quantite} unités` : null,
                                                                    ]
                                                                        .filter(Boolean)
                                                                        .join(" · ")}
                                                                </p>
                                                            )}
                                                            {ligne.instructions && (
                                                                <p className="text-xs text-slate-500 mt-0.5">
                                                                    {ligne.instructions}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-600 leading-6 whitespace-pre-wrap">
                                                    {ordonnance.notes || "Aucune prescription détaillée."}
                                                </p>
                                            )}

                                            {/* NOTES */}
                                            {lignes.length > 0 && ordonnance.notes && (
                                                <div className="mt-5 pt-4 border-t border-dashed border-slate-200">
                                                    <p className="text-xs font-semibold text-slate-500">Notes :</p>
                                                    <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap break-words">
                                                        {ordonnance.notes}
                                                    </p>
                                                </div>
                                            )}

                                            {/* SIGNATURE */}
                                            <div className="mt-8 flex justify-end">
                                                <div className="text-center">
                                                    <div className="w-44 border-t border-slate-300 pt-1.5">
                                                        <p className="text-xs italic text-slate-500">
                                                            Dr. {medecin?.prenom} {medecin?.nom}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
            </div>
        </div>
    );
}

export default PatientOrdonnances;
