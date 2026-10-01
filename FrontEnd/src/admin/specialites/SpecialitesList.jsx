import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
    Layers,
    Pencil,
    Trash2,
    Plus,
    RefreshCw,
    AlertCircle,
    Search,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    X,
} from "lucide-react";

const API = "http://localhost:8000/api/specialites";

// Nombre de spécialités affichées par page
const PAGE_SIZE = 10;

// =====================================================
// TOKEN
// =====================================================

const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

const authHeaders = () => ({
    Accept: "application/json",
    Authorization: `Bearer ${getToken()}`,
});

function SpecialitesList() {

    const navigate = useNavigate();

    const [specialites, setSpecialites] = useState([]);
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ============================
    // Charger les spécialités
    // ============================

    const loadSpecialites = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(API, {
                headers: authHeaders(),
            });

            let data = response.data;

            if (data.data) {
                data = data.data;
            }

            if (data.specialites) {
                data = data.specialites;
            }

            setSpecialites(Array.isArray(data) ? data : []);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                navigate("/login");
                return;
            }

            console.error(
                "Erreur chargement spécialités :",
                err.response?.data || err
            );

            setError(
                err.response?.data?.message ||
                "Impossible de charger les spécialités."
            );
            setSpecialites([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSpecialites();
    }, []);

    // ============================
    // Supprimer
    // ============================

    const deleteSpecialite = async (id) => {
        const confirmation = window.confirm(
            "Voulez-vous supprimer cette spécialité ?"
        );

        if (!confirmation) {
            return;
        }

        try {
            await axios.delete(`${API}/${id}`, {
                headers: authHeaders(),
            });

            setSpecialites((prev) =>
                prev.filter((specialite) => specialite.id !== id)
            );
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                navigate("/login");
                return;
            }

            console.error(
                "Erreur suppression :",
                err.response?.data || err
            );

            alert(
                err.response?.data?.message ||
                "Erreur lors de la suppression."
            );
        }
    };

    // ============================
    // Recherche
    // ============================

    const filteredSpecialites = specialites.filter((specialite) => {
        const nom = specialite.nom || "";
        const description = specialite.description || "";
        const texte = `${nom} ${description}`.toLowerCase();

        const matchSearch = texte.includes(search.toLowerCase());

        const matchDate =
            !dateFilter ||
            String(specialite.created_at ?? "").slice(0, 10) === dateFilter;

        return matchSearch && matchDate;
    });

    // ============================
    // Pagination
    // ============================

    const totalPages = Math.max(
        1,
        Math.ceil(filteredSpecialites.length / PAGE_SIZE)
    );

    const safePage = Math.min(currentPage, totalPages);

    const paginatedSpecialites = filteredSpecialites.slice(
        (safePage - 1) * PAGE_SIZE,
        safePage * PAGE_SIZE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, dateFilter]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const hasActiveFilters = search.trim() || dateFilter;

    const resetFilters = () => {
        setSearch("");
        setDateFilter("");
    };

    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
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

    const formatDate = (value) => {
        if (!value) return "—";
        const parts = String(value).slice(0, 10).split("-");
        if (parts.length !== 3) return "—";
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

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
                        <Layers size={26} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                            Spécialités
                        </h1>
                        <p className="text-blue-100 text-sm mt-0.5">
                            Gestion des spécialités médicales
                        </p>
                    </div>
                </div>
            </div>

            {/* ========================= */}
            {/* ERREUR */}
            {/* ========================= */}

            {!loading && error && (
                <div className="bg-white rounded-2xl border border-red-200 p-5 shadow-sm mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <p className="flex items-center gap-2 font-medium text-red-600">
                            <AlertCircle size={18} />
                            {error}
                        </p>
                        <button
                            type="button"
                            onClick={loadSpecialites}
                            className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                bg-red-50
                                border
                                border-red-200
                                px-4
                                py-2
                                text-sm
                                font-medium
                                text-red-700
                                hover:bg-red-100
                                transition
                            "
                        >
                            <RefreshCw size={15} />
                            Réessayer
                        </button>
                    </div>
                </div>
            )}

            {/* ========================= */}
            {/* RECHERCHE */}
            {/* ========================= */}

            {/* ========================= */}
            {/* LISTE DES SPÉCIALITÉS */}
            {/* ========================= */}

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

                <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                    <div className="min-w-0">
                        <h2 className="text-base font-bold text-slate-900">
                            Liste des spécialités
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {loading
                                ? "Spécialités médicales enregistrées"
                                : `${filteredSpecialites.length} spécialité${filteredSpecialites.length !== 1 ? "s" : ""}`}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto shrink-0">
                        <div className="relative w-full sm:w-64">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Rechercher une spécialité..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 rounded-lg text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                            />
                        </div>

                        <div className="flex items-center gap-1.5">
                            <CalendarDays size={15} className="text-slate-400 shrink-0" />

                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                title="Filtrer par date de création"
                                className="bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-lg text-sm text-slate-600 outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
                            />

                            {dateFilter && (
                                <button
                                    type="button"
                                    onClick={() => setDateFilter("")}
                                    title="Effacer le filtre de date"
                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            )}

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                                >
                                    Réinitialiser
                                </button>
                            )}
                        </div>
                    </div>

                </div>

                <div className="p-4">

                    {loading ? (

                        <div className="py-8 text-center">
                            <div className="w-9 h-9 mx-auto border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-slate-400 font-medium mt-3">
                                Chargement des spécialités...
                            </p>
                        </div>

                    ) : !error && filteredSpecialites.length === 0 ? (

                        <div className="py-8 text-center">
                            <Layers size={32} className="mx-auto text-slate-300" />
                            <p className="text-sm text-slate-400 font-medium mt-3">
                                {search
                                    ? "Aucune spécialité ne correspond à votre recherche."
                                    : "Aucune spécialité enregistrée."}
                            </p>
                            {!search && (
                                <Link
                                    to="/admin/specialities/add"
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition mt-4"
                                >
                                    <Plus size={16} />
                                    Ajouter une spécialité
                                </Link>
                            )}
                        </div>

                    ) : (

                        <div className="rounded-xl border border-slate-100 overflow-hidden">

                            {filteredSpecialites.map((specialite) => (
                                <div
                                    key={specialite.id}
                                    className="flex items-center gap-2.5 min-w-0 px-4 py-3 border-b border-slate-50 hover:bg-slate-50/60 transition"
                                >
                                    <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Layers size={14} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-slate-800 truncate">
                                            {specialite.nom || "-"}
                                        </p>
                                        <p className="text-[11px] text-slate-400 font-mono">
                                            #{specialite.id} ·{" "}
                                            {specialite.description
                                                ? specialite.description
                                                : "—"}
                                        </p>
                                    </div>

                                    <span className="shrink-0 text-xs text-slate-500 hidden sm:inline">
                                        {formatDate(specialite.created_at)}
                                    </span>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Link
                                            to={`/admin/specialities/edit/${specialite.id}`}
                                            title="Modifier"
                                            className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition"
                                        >
                                            <Pencil size={14} />
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => deleteSpecialite(specialite.id)}
                                            title="Supprimer"
                                            className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                        </div>

                    )}

                    {/* PAGINATION */}
                    {!loading && filteredSpecialites.length > 0 && totalPages > 1 && (
                        <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <p className="text-xs text-slate-400 font-medium">
                                {filteredSpecialites.length} spécialité(s) · Page{" "}
                                {safePage} / {totalPages}
                            </p>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    disabled={safePage === 1}
                                    onClick={() =>
                                        setCurrentPage((p) => Math.max(1, p - 1))
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    <ChevronLeft size={14} />
                                    Précédent
                                </button>

                                {getPageNumbers().map((num, idx) =>
                                    num === "…" ? (
                                        <span
                                            key={`points-${idx}`}
                                            className="px-1.5 text-xs text-slate-400"
                                        >
                                            …
                                        </span>
                                    ) : (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => setCurrentPage(num)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            num === safePage
                                                ? "bg-[#26415E] text-white shadow-sm"
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

export default SpecialitesList;
