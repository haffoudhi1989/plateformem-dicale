import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
    Building2,
    CalendarClock,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock,
    Stethoscope,
    X
} from "lucide-react";

// Authentification : ajoute le token sur toutes les requêtes axios
axios.interceptors.request.use((config) => {
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("auth_token") ||
        localStorage.getItem("userToken") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("access_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Nombre de rendez-vous affichés par page
const PAGE_SIZE = 10;

function RdvList() {
    // CRA : la variable est exposée via process.env.REACT_APP_*.
    const BASE_URL =
        process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";
    const API = `${BASE_URL}/rendez-vous`;

    // Racine du serveur : sert les fichiers /storage (photos)
    const API_ROOT = BASE_URL.replace(/\/api\/?$/, "");

    const [rdvs, setRdvs] = useState([]);
    const [filter, setFilter] = useState("Tous");
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [cabinets, setCabinets] = useState([]);
    const [cabinetFilter, setCabinetFilter] = useState("");
    const [medecinFilter, setMedecinFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    // ============================
    // Charger les rendez-vous
    // ============================

    const loadRdv = useCallback(async () => {
        try {
            setLoading(true);

            const response = await axios.get(API);

            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.data || [];

            setRdvs(data);
        } catch (error) {
            console.error(
                "Erreur chargement rendez-vous :",
                error.response?.data || error
            );
        } finally {
            setLoading(false);
        }
    }, [API]);

    useEffect(() => {
        loadRdv();
    }, [loadRdv]);

    // ============================
    // Charger les cabinets (pour le filtre par cabinet)
    // ============================

    const loadCabinets = useCallback(async () => {
        try {
            const response = await axios.get(`${BASE_URL}/cabinets`);

            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.data || [];

            setCabinets(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(
                "Erreur chargement cabinets :",
                error.response?.data || error
            );
        }
    }, [BASE_URL]);

    useEffect(() => {
        loadCabinets();
    }, [loadCabinets]);

    // ============================
    // Filtres (cabinet / médecin / statut / date)
    // ============================

    // ============================
    // Aides : cabinet / médecin d'un RDV
    // ============================

    const rdvCabinetId = (rdv) =>
        rdv?.medecin?.cabinet_id ??
        rdv?.medecin?.cabinet?.id ??
        null;

    const rdvMedecinId = (rdv) => rdv?.medecin?.id ?? null;

    const getMedecinNom = (m) =>
        `Dr ${m?.prenom ?? ""} ${m?.nom ?? ""}`.trim() || "Dr ?";

    // Normalise une date (ISO, datetime ou JJ/MM/AAAA) en "AAAA-MM-JJ"
    const toISODate = (value) => {
        if (!value) return "";

        const s = String(value).trim();

        const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

        const fr = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
        if (fr) return `${fr[3]}-${fr[2]}-${fr[1]}`;

        const d = new Date(s);
        if (!Number.isNaN(d.getTime())) {
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const j = String(d.getDate()).padStart(2, "0");
            return `${d.getFullYear()}-${m}-${j}`;
        }

        return "";
    };

    // Carte id → cabinet (nom du cabinet)
    const cabinetById = useMemo(() => {
        const map = {};
        cabinets.forEach((c) => {
            map[String(c.id)] = c;
        });
        return map;
    }, [cabinets]);

    const cabinetNom = (id) =>
        cabinetById[String(id)]?.nom || `Cabinet n°${id}`;

    // Options « Cabinets » (uniquement ceux ayant des rendez-vous)
    const cabinetOptions = useMemo(() => {
        const map = new Map();
        rdvs.forEach((rdv) => {
            const id = rdvCabinetId(rdv);
            if (id == null) return;
            map.set(String(id), {
                id,
                nom: cabinetNom(id)
            });
        });
        return Array.from(map.values()).sort((a, b) =>
            a.nom.localeCompare(b.nom, "fr")
        );
    }, [rdvs, cabinets]);

    // Options « Médecins » (restreintes au cabinet sélectionné)
    const medecinOptions = useMemo(() => {
        const map = new Map();
        rdvs.forEach((rdv) => {
            const medecin = rdv?.medecin;
            if (!medecin?.id) return;

            if (
                cabinetFilter &&
                String(rdvCabinetId(rdv)) !== String(cabinetFilter)
            ) {
                return;
            }

            map.set(String(medecin.id), medecin);
        });
        return Array.from(map.values()).sort((a, b) =>
            getMedecinNom(a).localeCompare(getMedecinNom(b), "fr")
        );
    }, [rdvs, cabinetFilter]);

    // Médecin sélectionné conservé uniquement s'il reste dans les options
    const effectiveMedecinFilter =
        medecinFilter &&
        medecinOptions.some(
            (m) => String(m.id) === String(medecinFilter)
        )
            ? medecinFilter
            : "";

    const filteredRdv = rdvs.filter((rdv) => {
        const filterOK =
            filter === "Tous" ||
            rdv.statut === filter;

        const cabinetOK =
            !cabinetFilter ||
            String(rdvCabinetId(rdv)) === String(cabinetFilter);

        const medecinOK =
            !effectiveMedecinFilter ||
            String(rdvMedecinId(rdv)) === String(effectiveMedecinFilter);

        const dateOK =
            !dateFilter || toISODate(rdv.date_rdv) === dateFilter;

        return (
            filterOK &&
            cabinetOK &&
            medecinOK &&
            dateOK
        );
    });

    // ============================
    // Pagination (sur les résultats filtrés)
    // ============================

    const totalPages = Math.max(
        1,
        Math.ceil(filteredRdv.length / PAGE_SIZE)
    );

    const safePage = Math.min(currentPage, totalPages);

    const paginatedRdv = filteredRdv.slice(
        (safePage - 1) * PAGE_SIZE,
        safePage * PAGE_SIZE
    );

    // Retour à la page 1 dès qu'un filtre change
    useEffect(() => {
        setCurrentPage(1);
    }, [
        filter,
        cabinetFilter,
        effectiveMedecinFilter,
        dateFilter
    ]);

    // Recalcule la page courante si elle dépasse le nombre total de pages
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // ============================
    // Réinitialisation des filtres
    // ============================

    const hasActiveFilters =
        filter !== "Tous" ||
        cabinetFilter ||
        effectiveMedecinFilter ||
        dateFilter;

    const resetFilters = () => {
        setFilter("Tous");
        setCabinetFilter("");
        setMedecinFilter("");
        setDateFilter("");
    };

    // Numéros de pages affichés (avec « … » si trop de pages)
    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from(
                { length: totalPages },
                (_, i) => i + 1
            );
        }

        const pages = [1];
        const start = Math.max(2, safePage - 1);
        const end = Math.min(totalPages - 1, safePage + 1);

        if (start > 2) pages.push("…");
        for (let i = start; i <= end; i += 1) pages.push(i);
        if (end < totalPages - 1) pages.push("…");

        pages.push(totalPages);
        return pages;
    };

    // ============================
    // Statistiques
    // ============================

    const total = rdvs.length;

    const confirmes = rdvs.filter(
        (rdv) => rdv.statut === "Confirmé"
    ).length;

    const attente = rdvs.filter(
        (rdv) => rdv.statut === "En attente"
    ).length;

    const termines = rdvs.filter(
        (rdv) => rdv.statut === "Terminé"
    ).length;

    const annules = rdvs.filter(
        (rdv) => rdv.statut === "Annulé"
    ).length;

    // ============================
    // Affichage
    // ============================

    return (
        <div className="overflow-x-clip">
            {/* ========================= */}
            {/* EN-TÊTE */}
            {/* ========================= */}

                        <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <CalendarClock size={26} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                            Rendez-vous
                        </h1>
                        <p className="text-blue-100 text-sm mt-0.5">
                            Gestion et suivi des rendez-vous médicaux
                        </p>
                    </div>
                </div>
            </div>

            {/* ========================= */}
            {/* STATISTIQUES */}
            {/* ========================= */}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5">
                <div className="bg-white rounded-lg shadow-sm px-3.5 sm:px-4 md:px-5 py-2.5 sm:py-3.5 md:py-4 border-l-4 border-blue-700 flex items-center justify-between gap-2 sm:gap-3 min-h-[64px] sm:min-h-[72px] md:min-h-[80px]">
                    <span className="text-xs sm:text-sm md:text-[15px] font-semibold text-gray-500 shrink-0">Total RDV</span>
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-700 leading-none">{total}</span>
                </div>
                <div className="bg-white rounded-lg shadow-sm px-3.5 sm:px-4 md:px-5 py-2.5 sm:py-3.5 md:py-4 border-l-4 border-green-500 flex items-center justify-between gap-2 sm:gap-3 min-h-[64px] sm:min-h-[72px] md:min-h-[80px]">
                    <span className="text-xs sm:text-sm md:text-[15px] font-semibold text-gray-500 shrink-0">Confirmés</span>
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 leading-none">{confirmes}</span>
                </div>
                <div className="bg-white rounded-lg shadow-sm px-3.5 sm:px-4 md:px-5 py-2.5 sm:py-3.5 md:py-4 border-l-4 border-yellow-500 flex items-center justify-between gap-2 sm:gap-3 min-h-[64px] sm:min-h-[72px] md:min-h-[80px]">
                    <span className="text-xs sm:text-sm md:text-[15px] font-semibold text-gray-500 shrink-0">En attente</span>
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-500 leading-none">{attente}</span>
                </div>
                <div className="bg-white rounded-lg shadow-sm px-3.5 sm:px-4 md:px-5 py-2.5 sm:py-3.5 md:py-4 border-l-4 border-indigo-500 flex items-center justify-between gap-2 sm:gap-3 min-h-[64px] sm:min-h-[72px] md:min-h-[80px]">
                    <span className="text-xs sm:text-sm md:text-[15px] font-semibold text-gray-500 shrink-0">Terminés</span>
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-indigo-600 leading-none">{termines}</span>
                </div>
                <div className="bg-white rounded-lg shadow-sm px-3.5 sm:px-4 md:px-5 py-2.5 sm:py-3.5 md:py-4 border-l-4 border-red-500 flex items-center justify-between gap-2 sm:gap-3 min-h-[64px] sm:min-h-[72px] md:min-h-[80px]">
                    <span className="text-xs sm:text-sm md:text-[15px] font-semibold text-gray-500 shrink-0">Annulés</span>
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600 leading-none">{annules}</span>
                </div>
            </div>

            {/* ========================= */}
            {/* TABLEAU */}
            {/* ========================= */}

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">
                                Liste des rendez-vous
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Suivi et gestion de l'agenda médical
                            </p>
                        </div>

                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold w-fit">
                            {filteredRdv.length} rendez-vous
                        </span>
                    </div>

                    <div className="mt-2 flex flex-col md:flex-row md:items-center md:justify-end flex-wrap gap-2">
                        {/* FILTRE CABINET */}
                        <div className="relative">
                            <Building2
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            />
                            <select
                                value={cabinetFilter}
                                onChange={(e) =>
                                    setCabinetFilter(e.target.value)
                                }
                                className="w-full sm:w-auto appearance-none bg-slate-50 border border-slate-200 pl-8 pr-8 py-1.5 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
                            >
                                <option value="">Tous les cabinets</option>
                                {cabinetOptions.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.nom}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* FILTRE MÉDECIN */}
                        <div className="relative">
                            <Stethoscope
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            />
                            <select
                                value={effectiveMedecinFilter}
                                onChange={(e) =>
                                    setMedecinFilter(e.target.value)
                                }
                                disabled={medecinOptions.length === 0}
                                className="w-full sm:w-auto appearance-none bg-slate-50 border border-slate-200 pl-8 pr-8 py-1.5 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition cursor-pointer disabled:opacity-50"
                            >
                                <option value="">Tous les médecins</option>
                                {medecinOptions.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {getMedecinNom(m)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* FILTRE STATUT */}
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
                        >
                            <option value="Tous">Tous les statuts</option>
                            <option value="Confirmé">Confirmé</option>
                            <option value="En attente">En attente</option>
                            <option value="Terminé">Terminé</option>
                            <option value="Annulé">Annulé</option>
                        </select>

                        {/* FILTRE DATE (une seule date) */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                            <CalendarDays
                                size={15}
                                className="text-slate-400 shrink-0"
                            />

                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) =>
                                    setDateFilter(e.target.value)
                                }
                                aria-label="Rendez-vous à la date du"
                                className="w-[135px] bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
                            />

                            {dateFilter && (
                                <button
                                    type="button"
                                    onClick={() => setDateFilter("")}
                                    aria-label="Effacer la date"
                                    className="w-5 h-5 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition shrink-0 cursor-pointer"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition shrink-0 cursor-pointer"
                            >
                                <X size={14} />
                                Réinitialiser
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-4">
                    {loading ? (
                        <div className="text-center py-10 text-slate-400 font-medium">
                            Chargement des rendez-vous...
                        </div>
                    ) : filteredRdv.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 font-medium">
                            Aucun rendez-vous trouvé.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm table-fixed">
                                <thead>
                                    <tr className="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                                        <th style={{ width: "28%" }} className="px-4 py-3 font-semibold">Patient</th>
                                        <th style={{ width: "24%" }} className="px-4 py-3 font-semibold">Médecin</th>
                                        <th style={{ width: "20%" }} className="px-4 py-3 font-semibold">Date</th>
                                        <th style={{ width: "12%" }} className="px-4 py-3 font-semibold">Heure</th>
                                        <th style={{ width: "16%" }} className="px-4 py-3 font-semibold text-right">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRdv.map((rdv) => (
                                        <tr
                                            key={rdv.id}
                                            className="border-b border-slate-50 hover:bg-slate-50/60 transition"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-slate-800 text-sm truncate">
                                                    {rdv.patient?.nom || "-"}
                                                    {rdv.patient?.prenom
                                                        ? ` ${rdv.patient.prenom}`
                                                        : ""}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3 min-w-0">

                                                    <div className="w-9 h-9 rounded-full relative overflow-hidden bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                        <span>
                                                            {(
                                                                rdv.medecin?.prenom?.charAt(0) ||
                                                                rdv.medecin?.nom?.charAt(0) ||
                                                                "M"
                                                            ).toUpperCase()}
                                                        </span>

                                                        {rdv.medecin?.photo && (
                                                            <img
                                                                src={`${API_ROOT}/storage/${rdv.medecin.photo}`}
                                                                alt={`${rdv.medecin?.prenom || ""} ${rdv.medecin?.nom || ""}`}
                                                                className="absolute inset-0 w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = "none";
                                                                }}
                                                            />
                                                        )}
                                                    </div>

                                                    <p className="text-slate-600 text-sm truncate">
                                                        Dr {rdv.medecin?.nom || "-"}
                                                        {rdv.medecin?.prenom
                                                            ? ` ${rdv.medecin.prenom}`
                                                            : ""}
                                                    </p>

                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1.5 text-slate-500 text-xs min-w-0">
                                                    <CalendarDays size={14} className="text-slate-400 shrink-0" />
                                                    <span className="truncate">{rdv.date_rdv || "-"}</span>
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1.5 text-slate-500 text-xs shrink-0">
                                                    <Clock size={14} className="text-slate-400" />
                                                    {rdv.heure_rdv
                                                        ? rdv.heure_rdv.substring(0, 5)
                                                        : "-"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                <span
                                                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                        rdv.statut === "Confirmé"
                                                            ? "bg-green-50 text-green-700 border border-green-200"
                                                            : rdv.statut === "Annulé"
                                                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                                                            : rdv.statut === "Terminé"
                                                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                            : "bg-amber-50 text-amber-700 border border-amber-200"
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            rdv.statut === "Confirmé"
                                                                ? "bg-green-500"
                                                                : rdv.statut === "Annulé"
                                                                ? "bg-rose-500"
                                                                : rdv.statut === "Terminé"
                                                                ? "bg-indigo-500"
                                                                : "bg-amber-500"
                                                        }`}
                                                    />
                                                    {rdv.statut || "En attente"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* PAGINATION */}
                    {!loading && filteredRdv.length > 0 && totalPages > 1 && (
                        <div className="px-5 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <p className="text-xs text-slate-400 font-medium">
                                {filteredRdv.length} rendez-vous · Page{" "}
                                {safePage} / {totalPages}
                            </p>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    disabled={safePage === 1}
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.max(1, p - 1)
                                        )
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    <ChevronLeft size={14} />
                                    Précédent
                                </button>

                                {getPageNumbers().map((num, idx) =>
                                    num === "…" ? (
                                        <span
                                            key={`ellipsis-${idx}`}
                                            className="px-1.5 text-xs text-slate-400"
                                        >
                                            …
                                        </span>
                                    ) : (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() =>
                                                setCurrentPage(num)
                                            }
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                                                num === safePage
                                                    ? "bg-blue-600 text-white shadow-sm"
                                                    : "text-slate-600 hover:bg-slate-100"
                                            }`}
                                        >
                                            {num}
                                        </button>
                                    )
                                )}

                                <button
                                    type="button"
                                    disabled={safePage === totalPages}
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.min(totalPages, p + 1)
                                        )
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    Suivant
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RdvList;
