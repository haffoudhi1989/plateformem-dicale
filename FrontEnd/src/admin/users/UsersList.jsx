import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import {
    Users,
    Search,
    Loader2,
    AlertCircle,
    ShieldCheck,
    UserX,
    Trash2,
    RefreshCw,
    UserCheck,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    X,
} from "lucide-react";

// Nombre d'utilisateurs affichés par page
const PAGE_SIZE = 10;

const ROLE_BADGE = {
    admin: "bg-rose-50 text-rose-700 border-rose-200",
    medecin: "bg-sky-50 text-sky-700 border-sky-200",
    patient: "bg-emerald-50 text-emerald-700 border-emerald-200",
    secretaire: "bg-violet-50 text-violet-700 border-violet-200",
    cabinet: "bg-orange-50 text-orange-700 border-orange-200",
};

const ROLE_LABEL = {
    admin: "Admin",
    medecin: "Médecin",
    patient: "Patient",
    secretaire: "Secrétaire",
    cabinet: "Cabinet",
};

function UsersList() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================
    // Charger les utilisateurs
    // =========================
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/api/admin/users");

            const data = response.data?.data ?? response.data;

            setUsers(
                Array.isArray(data)
                    ? data.map((user) => ({
                          ...user,
                          is_active: user.is_active ?? true,
                      }))
                    : []
            );
        } catch (err) {
            console.error(
                "Erreur chargement utilisateurs :",
                err.response?.data || err
            );

            setError(
                err.response?.data?.message ||
                    "Impossible de charger les utilisateurs."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // =========================
    // Recherche
    // =========================
    const filteredUsers = users.filter((user) => {
        const query = search.trim().toLowerCase();

        const matchSearch =
            !query ||
            (user.name ?? "").toLowerCase().includes(query) ||
            (user.email ?? "").toLowerCase().includes(query) ||
            (user.role ?? "").toLowerCase().includes(query);

        const matchDate =
            !dateFilter ||
            String(user.created_at ?? "").slice(0, 10) === dateFilter;

        return matchSearch && matchDate;
    });

    // =========================
    // Pagination (résultats filtrés)
    // =========================
    const totalPages = Math.max(
        1,
        Math.ceil(filteredUsers.length / PAGE_SIZE)
    );

    const safePage = Math.min(currentPage, totalPages);

    const paginatedUsers = filteredUsers.slice(
        (safePage - 1) * PAGE_SIZE,
        safePage * PAGE_SIZE
    );

    // Retour page 1 dès qu'un critère change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, dateFilter]);

    // Recalage si la page courante dépasse le nombre de pages
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

    // =========================
    // Statistiques
    // =========================
    const totalCount = users.length;
    const medecinsCount = users.filter((u) => u.role === "medecin").length;
    const patientsCount = users.filter((u) => u.role === "patient").length;
    const staffCount = users.filter(
        (u) =>
            u.role === "secretaire" ||
            u.role === "admin" ||
            u.role === "cabinet"
    ).length;

    // =========================
    // Désactiver
    // =========================
    const handleDisable = async (user) => {
        if (!window.confirm(`Désactiver ${user.name} ?`)) {
            return;
        }

        try {
            setError("");

            await api.patch(
                `/api/admin/users/${user.id}/disable`
            );

            setUsers((prevUsers) =>
                prevUsers.map((u) =>
                    u.id === user.id
                        ? { ...u, is_active: false }
                        : u
                )
            );
        } catch (err) {
            console.error(
                "Erreur désactivation :",
                err.response?.data || err
            );

            setError(
                err.response?.data?.message ||
                    "Impossible de désactiver cet utilisateur."
            );
        }
    };

    // =========================
    // Activer (réactivation)
    // =========================
    const handleActivate = async (user) => {
        if (!window.confirm(`Réactiver le compte de ${user.name} ?`)) {
            return;
        }

        try {
            setError("");

            await api.patch(
                `/api/admin/users/${user.id}/activate`
            );

            setUsers((prevUsers) =>
                prevUsers.map((u) =>
                    u.id === user.id
                        ? { ...u, is_active: true }
                        : u
                )
            );
        } catch (err) {
            console.error(
                "Erreur activation :",
                err.response?.data || err
            );

            setError(
                err.response?.data?.message ||
                    "Impossible d'activer cet utilisateur."
            );
        }
    };

    // =========================
    // Supprimer
    // =========================
    const handleDelete = async (user) => {
        const confirmed = window.confirm(
            `Voulez-vous vraiment supprimer ${user.name} ? Cette action est irréversible.`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            await api.delete(`/api/admin/users/${user.id}`);

            setUsers((prevUsers) =>
                prevUsers.filter((u) => u.id !== user.id)
            );
        } catch (err) {
            console.error(
                "Erreur suppression :",
                err.response?.data || err
            );

            setError(
                err.response?.data?.message ||
                    "Impossible de supprimer cet utilisateur."
            );
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 overflow-x-clip font-sans">

            {/* En-tête bleu */}
                        <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <Users size={26} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                            Gestion des utilisateurs
                        </h1>
                        <p className="text-blue-100 text-sm mt-0.5">
                            Gestion, rôles et suivi des comptes de la plateforme
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5">
                <div className="bg-white rounded-lg shadow-sm px-3.5 sm:px-4 md:px-5 py-2.5 sm:py-3.5 md:py-4 border-l-4 border-blue-700 flex items-center justify-between gap-2 sm:gap-3 min-h-[64px] sm:min-h-[72px] md:min-h-[80px]">
                    <span className="text-xs sm:text-sm md:text-[15px] font-semibold text-gray-500 shrink-0">Total</span>
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-700 leading-none">{totalCount}</span>
                </div>
                <div className="bg-white rounded-lg shadow-sm px-3.5 sm:px-4 md:px-5 py-2.5 sm:py-3.5 md:py-4 border-l-4 border-sky-500 flex items-center justify-between gap-2 sm:gap-3 min-h-[64px] sm:min-h-[72px] md:min-h-[80px]">
                    <span className="text-xs sm:text-sm md:text-[15px] font-semibold text-gray-500 shrink-0">Médecins</span>
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-sky-600 leading-none">{medecinsCount}</span>
                </div>
                <div className="bg-white rounded-lg shadow-sm px-3.5 sm:px-4 md:px-5 py-2.5 sm:py-3.5 md:py-4 border-l-4 border-emerald-500 flex items-center justify-between gap-2 sm:gap-3 min-h-[64px] sm:min-h-[72px] md:min-h-[80px]">
                    <span className="text-xs sm:text-sm md:text-[15px] font-semibold text-gray-500 shrink-0">Patients</span>
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-600 leading-none">{patientsCount}</span>
                </div>
                <div className="bg-white rounded-lg shadow-sm px-3.5 sm:px-4 md:px-5 py-2.5 sm:py-3.5 md:py-4 border-l-4 border-purple-500 flex items-center justify-between gap-2 sm:gap-3 min-h-[64px] sm:min-h-[72px] md:min-h-[80px]">
                    <span className="text-xs sm:text-sm md:text-[15px] font-semibold text-gray-500 truncate">Secrétaires & Admins</span>
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 shrink-0 leading-none">{staffCount}</span>
                </div>
            </div>

            {/* Erreur */}
            {error && (
                <div
                    role="alert"
                    className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2"
                >
                    <AlertCircle
                        size={17}
                        className="shrink-0 mt-px"
                    />

                    <span>{error}</span>
                </div>
            )}

            {/* Carte */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">

                {/* Barre supérieure */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">

                    <div>
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                            Comptes utilisateurs
                        </h2>

                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                            {filteredUsers.length} utilisateur(s)
                            {filteredUsers.length !== users.length
                                ? ` sur ${users.length}`
                                : ""}
                        </p>
                    </div>

                    {/* Recherche + filtre par date */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                placeholder="Rechercher un utilisateur..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                className="w-full sm:w-64 pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-1.5">
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
                                title="Filtrer par date d'inscription"
                                className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-600 outline-none focus:bg-white focus:border-sky-500 cursor-pointer"
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

                {/* Contenu */}
                {loading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500 p-8 justify-center">
                        <Loader2
                            size={18}
                            className="animate-spin text-sky-600"
                        />

                        Chargement des utilisateurs...
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center text-sm text-slate-400 p-10">
                        <ShieldCheck
                            size={36}
                            className="mx-auto mb-3 text-slate-300"
                        />

                        Aucun utilisateur trouvé.
                    </div>
                ) : (
                    <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm table-fixed">
                            <thead>
                                <tr className="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                                    <th
                                        style={{ width: "24%" }}
                                        className="px-4 py-3 font-semibold"
                                    >
                                        Utilisateur
                                    </th>
                                    <th
                                        style={{ width: "24%" }}
                                        className="px-4 py-3 font-semibold"
                                    >
                                        Email
                                    </th>
                                    <th
                                        style={{ width: "12%" }}
                                        className="px-4 py-3 font-semibold"
                                    >
                                        Rôle
                                    </th>
                                    <th
                                        style={{ width: "13%" }}
                                        className="px-4 py-3 font-semibold"
                                    >
                                        Statut
                                    </th>
                                    <th
                                        style={{ width: "14%" }}
                                        className="px-4 py-3 font-semibold"
                                    >
                                        Inscription
                                    </th>
                                    <th
                                        style={{ width: "13%" }}
                                        className="px-4 py-3 font-semibold text-right"
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedUsers.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-b border-slate-50 hover:bg-slate-50/60 transition"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                                                <Users size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-800 truncate">
                                                    {user.name || "—"}
                                                </p>
                                                <p className="text-[11px] text-slate-400">
                                                    ID #{user.id}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 text-slate-600">
                                        <p className="truncate">
                                            {user.email || "—"}
                                        </p>
                                    </td>

                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                            ROLE_BADGE[user.role] ||
                                            "bg-slate-50 text-slate-600 border-slate-200"
                                        }`}>
                                            {ROLE_LABEL[user.role] ||
                                                user.role ||
                                                "—"}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                            user.is_active
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : "bg-slate-100 text-slate-500 border-slate-200"
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                user.is_active
                                                    ? "bg-emerald-500"
                                                    : "bg-slate-400"
                                            }`} />
                                            {user.is_active ? "Actif" : "Désactivé"}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 text-xs text-slate-500">
                                        {formatDate(user.created_at)}
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {user.role !== "admin" &&
                                                (user.is_active ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDisable(user)
                                                        }
                                                        title="Désactiver ce compte"
                                                        className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                                                    >
                                                        <UserX size={14} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleActivate(user)
                                                        }
                                                        title="Réactiver ce compte"
                                                        className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                    >
                                                        <UserCheck size={14} />
                                                    </button>
                                                ))}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(user)
                                                }
                                                title="Supprimer"
                                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    {!loading && filteredUsers.length > 0 && totalPages > 1 && (
                        <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <p className="text-xs text-slate-400 font-medium">
                                {filteredUsers.length} utilisateur(s) · Page{" "}
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
                    </>
                )}
            </div>
        </div>
    );
}

export default UsersList;
