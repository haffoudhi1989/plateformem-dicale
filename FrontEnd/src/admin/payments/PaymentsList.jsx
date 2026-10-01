import React, { useEffect, useState, useMemo, useCallback } from "react";
import api from "../../services/api";
import {
    CreditCard,
    Search,
    RefreshCw,
    Building2,
    CheckCircle2,
    Clock,
    XCircle,
    Plus,
    Trash2,
    FileText,
    X,
    Stethoscope,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

// =====================================================
// TARIFS & BADGES DES PLANS
// =====================================================
const PLANS_CONFIG = {
    Basic: { prix: 49, badge: "bg-sky-50 text-sky-700 border-sky-200" },
    Pro: { prix: 99, badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    Premium: { prix: 199, badge: "bg-amber-50 text-amber-700 border-amber-200" },
};

const formatMoney = (val) => `${Number(val || 0).toLocaleString("fr-FR")} DT`;

const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("fr-FR");
};

export default function PaymentsList() {
    const [cabinets, setCabinets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [planFilter, setPlanFilter] = useState("all");
    const [statutFilter, setStatutFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Modal nouveau paiement pour un cabinet
    const [selectedCabinet, setSelectedCabinet] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Formulaire de paiement
    const [paymentForm, setPaymentForm] = useState({
        cabinet_id: "",
        plan: "Pro",
        duree_mois: 3,
        montant: 297,
        mode_paiement: "Virement bancaire",
        statut: "Payé",
        date_debut: new Date().toISOString().split("T")[0],
        date_fin: "",
        reference: "",
    });

    // Cabinet sélectionné pour voir son historique
    const [historyCabinet, setHistoryCabinet] = useState(null);

    // =====================================================
    // CHARGEMENT DES CABINETS ET DE LEURS PAIEMENTS
    // =====================================================
    const loadCabinets = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const res = await api.get("/api/admin/cabinet-abonnements/cabinets");
            if (res.data?.success) {
                setCabinets(res.data.data || []);
            }
        } catch (err) {
            console.error("Erreur chargement paiements par cabinet :", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadCabinets();
    }, [loadCabinets]);

    // =====================================================
    // OUVRIR LE MODAL DE PAIEMENT POUR UN CABINET
    // =====================================================
    const openPaymentForCabinet = (cabinet) => {
        const planInitial = cabinet.plan || "Pro";
        const p = PLANS_CONFIG[planInitial] || PLANS_CONFIG.Pro;
        const duree = 3;

        let debutStr = new Date().toISOString().split("T")[0];
        if (cabinet.date_fin_abonnement) {
            const finCab = new Date(cabinet.date_fin_abonnement);
            if (finCab > new Date()) {
                debutStr = cabinet.date_fin_abonnement;
            }
        }

        const debut = new Date(debutStr);
        const fin = new Date(debut);
        fin.setMonth(fin.getMonth() + duree);

        setSelectedCabinet(cabinet);
        setPaymentForm({
            cabinet_id: cabinet.id,
            plan: planInitial,
            duree_mois: duree,
            montant: p.prix * duree,
            mode_paiement: "Virement bancaire",
            statut: "Payé",
            date_debut: debutStr,
            date_fin: fin.toISOString().split("T")[0],
            reference: `ABO-${cabinet.nom.replace(/\s+/g, "").slice(0, 3).toUpperCase()}-${new Date().getFullYear()}`,
        });
        setIsPaymentModalOpen(true);
    };

    // =====================================================
    // CALCUL DU MONTANT LORS D'UN CHANGEMENT DANS LE MODAL
    // =====================================================
    const handlePlanOrDureeChange = (plan, duree) => {
        const p = PLANS_CONFIG[plan] || PLANS_CONFIG.Basic;
        const debut = paymentForm.date_debut ? new Date(paymentForm.date_debut) : new Date();
        const fin = new Date(debut);
        fin.setMonth(fin.getMonth() + Number(duree));

        setPaymentForm((prev) => ({
            ...prev,
            plan,
            duree_mois: Number(duree),
            montant: p.prix * Number(duree),
            date_fin: fin.toISOString().split("T")[0],
        }));
    };

    // =====================================================
    // ENREGISTRER LE PAIEMENT
    // =====================================================
    const handleSavePayment = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await api.post("/api/admin/cabinet-abonnements", paymentForm);
            setIsPaymentModalOpen(false);
            loadCabinets(true);
        } catch (err) {
            alert(err.response?.data?.message || "Erreur lors de l'enregistrement du paiement.");
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // BASCULER LE STATUT DU DERNIER PAIEMENT D'UN CABINET
    // =====================================================
    const handleToggleStatut = async (cabinet) => {
        const dernierPaiement = cabinet.dernier_paiement;
        if (!dernierPaiement) return;

        const nouveau = dernierPaiement.statut === "Payé" ? "En attente" : "Payé";
        try {
            await api.put(`/api/admin/cabinet-abonnements/${dernierPaiement.id}`, {
                statut: nouveau,
            });
            loadCabinets(true);
        } catch (err) {
            console.error(err);
        }
    };

    // =====================================================
    // SUPPRIMER UN PAIEMENT DEPUIS L'HISTORIQUE
    // =====================================================
    const handleDeletePayment = async (paymentId) => {
        if (!window.confirm("Supprimer ce paiement ?")) return;
        try {
            await api.delete(`/api/admin/cabinet-abonnements/${paymentId}`);
            loadCabinets(true);
            if (historyCabinet) {
                setHistoryCabinet((prev) => ({
                    ...prev,
                    abonnements: prev.abonnements.filter((a) => a.id !== paymentId),
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    // =====================================================
    // FILTRAGE DES CABINETS
    // =====================================================
    const filteredCabinets = useMemo(() => {
        return cabinets.filter((cab) => {
            const nom = (cab.nom || "").toLowerCase();
            const medecin = (cab.medecins?.[0]?.nom || "").toLowerCase();
            const q = search.toLowerCase().trim();
            const matchSearch = !q || nom.includes(q) || medecin.includes(q);

            const matchPlan = planFilter === "all" || cab.plan === planFilter;

            const s = (cab.statut_abonnement || "").toLowerCase();
            let matchStatut = true;
            if (statutFilter === "actif") matchStatut = s === "actif" && !cab.est_expire;
            if (statutFilter === "expire") matchStatut = cab.est_expire || s === "expire";
            if (statutFilter === "attente") matchStatut = s.includes("attente");

            // Filtre par date du dernier paiement
            const matchDate =
                !dateFilter ||
                String(cab.dernier_paiement?.date_paiement ?? "").slice(0, 10) ===
                    dateFilter;

            return matchSearch && matchPlan && matchStatut && matchDate;
        });
    }, [cabinets, search, planFilter, statutFilter, dateFilter]);

    // =====================================================
    // PAGINATION
    // =====================================================
    const PAGE_SIZE = 10;

    const totalPages = Math.max(
        1,
        Math.ceil(filteredCabinets.length / PAGE_SIZE)
    );

    const safePage = Math.min(currentPage, totalPages);

    const paginatedCabinets = filteredCabinets.slice(
        (safePage - 1) * PAGE_SIZE,
        safePage * PAGE_SIZE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, planFilter, statutFilter, dateFilter]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

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

    // =====================================================
    // STATISTIQUES GLOBALES
    // =====================================================
    const totalRevenus = useMemo(() => {
        return cabinets.reduce((sum, c) => sum + Number(c.total_paye || 0), 0);
    }, [cabinets]);

    const cabinetsActifsCount = useMemo(() => {
        return cabinets.filter((c) => c.statut_abonnement === "actif" && !c.est_expire).length;
    }, [cabinets]);

    const cabinetsExpiresCount = useMemo(() => {
        return cabinets.filter((c) => c.est_expire || c.statut_abonnement === "expire").length;
    }, [cabinets]);

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* =====================================================
                EN-TÊTE
            ===================================================== */}
                        <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <Building2 size={26} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                            Paiements des Abonnements par Cabinet
                        </h1>
                        <p className="text-blue-100 text-sm mt-0.5">
                            Suivi des encaissements et renouvellements pour chaque cabinet médical
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                
                </div>
            </div>

            {/* =====================================================
                3 CARTES RÉCAPITULATIVES
            ===================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase">Total encaissé abonnements</p>
                        <p className="text-xl font-bold text-emerald-600 mt-0.5">{formatMoney(totalRevenus)}</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                        DT
                    </div>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase">Cabinets avec abonnement actif</p>
                        <p className="text-xl font-bold text-blue-700 mt-0.5">{cabinetsActifsCount} / {cabinets.length}</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <CheckCircle2 size={18} />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase">Abonnements échus / expirés</p>
                        <p className="text-xl font-bold text-rose-600 mt-0.5">{cabinetsExpiresCount} cabinet(s)</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                        <Clock size={18} />
                    </div>
                </div>
            </div>

            {/* =====================================================
                RECHERCHE & FILTRES
            ===================================================== */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm mb-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="relative w-full sm:w-72">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher par cabinet, médecin..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                        value={planFilter}
                        onChange={(e) => setPlanFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium cursor-pointer"
                    >
                        <option value="all">Tous les forfaits</option>
                        <option value="Basic">Basic (49 DT/m)</option>
                        <option value="Pro">Pro (99 DT/m)</option>
                        <option value="Premium">Premium (199 DT/m)</option>
                    </select>

                    <select
                        value={statutFilter}
                        onChange={(e) => setStatutFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium cursor-pointer"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="actif">Abonnement Actif</option>
                        <option value="expire">Abonnement Expiré</option>
                        <option value="attente">En attente</option>
                    </select>

                    <div className="flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-slate-400" />

                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            title="Filtrer par date du dernier paiement"
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 focus:bg-white focus:outline-none cursor-pointer"
                        />

                        {dateFilter && (
                            <button
                                type="button"
                                onClick={() => setDateFilter("")}
                                title="Effacer le filtre de date"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {(search ||
                        planFilter !== "all" ||
                        statutFilter !== "all" ||
                        dateFilter) && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                setPlanFilter("all");
                                setStatutFilter("all");
                                setDateFilter("");
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                            title="Réinitialiser"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>
            </div>

            {/* =====================================================
                TABLEAU : PAIEMENTS PAR CABINET
            ===================================================== */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                        <div className="w-6 h-6 mx-auto border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                        Chargement des cabinets...
                    </div>
                ) : filteredCabinets.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                        Aucun cabinet ne correspond aux critères de recherche.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                    <th className="p-3">Cabinet Médical</th>
                                    <th className="p-3">Forfait Actuel</th>
                                    <th className="p-3">Période & Échéance</th>
                                    <th className="p-3">Statut Abonnement</th>
                                    <th className="p-3">Total Encaissé</th>
                                    <th className="p-3">Dernier Paiement</th>
                                    <th className="p-3 text-right">Actions Paiement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedCabinets.map((cabinet) => {
                                    const planStyle = PLANS_CONFIG[cabinet.plan] || PLANS_CONFIG.Basic;
                                    const medecin = cabinet.medecins?.[0];
                                    const nbPaiements = cabinet.abonnements?.length || 0;
                                    const isActif = cabinet.statut_abonnement === "actif" && !cabinet.est_expire;

                                    return (
                                        <tr key={cabinet.id} className="hover:bg-slate-50/70 transition">
                                            {/* 1. Cabinet */}
                                            <td className="p-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                                                        <Building2 size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-xs">
                                                            {cabinet.nom}
                                                        </p>
                                                        {medecin && (
                                                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                                                <Stethoscope size={10} className="text-slate-400" />
                                                                Dr. {medecin.prenom} {medecin.nom}
                                                            </p>
                                                        )}
                                                        <p className="text-[10px] text-slate-400">
                                                            {cabinet.telephone || cabinet.email || "-"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 2. Forfait */}
                                            <td className="p-3">
                                                <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] border ${planStyle.badge}`}>
                                                    {cabinet.plan || "Basic"}
                                                </span>
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    {planStyle.prix} DT / mois
                                                </p>
                                            </td>

                                            {/* 3. Période & Échéance */}
                                            <td className="p-3">
                                                {cabinet.date_debut_abonnement || cabinet.date_fin_abonnement ? (
                                                    <div>
                                                        <p className="text-slate-700 font-medium">
                                                            {formatDate(cabinet.date_debut_abonnement)} ➔ {formatDate(cabinet.date_fin_abonnement)}
                                                        </p>
                                                        <div className="mt-0.5">
                                                            {cabinet.est_expire ? (
                                                                <span className="text-[10px] font-bold text-rose-600">
                                                                    Échu / Expiré
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-emerald-600">
                                                                    {cabinet.jours_restants} jour(s) restants
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Non configuré</span>
                                                )}
                                            </td>

                                            {/* 4. Statut */}
                                            <td className="p-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatut(cabinet)}
                                                    title="Cliquer pour basculer le statut"
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                                                        isActif
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                                    }`}
                                                >
                                                    {isActif ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                                                    {isActif ? "Actif" : "Expiré"}
                                                </button>
                                            </td>

                                            {/* 5. Total Encaissé */}
                                            <td className="p-3">
                                                <p className="font-bold text-slate-900 text-xs">
                                                    {formatMoney(cabinet.total_paye)}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    {nbPaiements} versement(s)
                                                </p>
                                            </td>

                                            {/* 6. Dernier Paiement */}
                                            <td className="p-3">
                                                {cabinet.dernier_paiement ? (
                                                    <div>
                                                        <p className="font-semibold text-slate-800">
                                                            {formatMoney(cabinet.dernier_paiement.montant)}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            {formatDate(cabinet.dernier_paiement.date_paiement)} · {cabinet.dernier_paiement.mode_paiement}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>

                                            {/* 7. Actions */}
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Bouton Payer / Renouveler */}
                                                    <button
                                                        type="button"
                                                        onClick={() => openPaymentForCabinet(cabinet)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition shadow-xs cursor-pointer"
                                                        title="Ajouter un paiement ou renouveler"
                                                    >
                                                        <Plus size={12} />
                                                        Payer
                                                    </button>

                                                    {/* Bouton Historique des paiements de ce cabinet */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setHistoryCabinet(cabinet)}
                                                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-[11px] transition cursor-pointer"
                                                        title="Voir tous les paiements de ce cabinet"
                                                    >
                                                        <FileText size={12} />
                                                        Détails ({nbPaiements})
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINATION */}
                {!loading && filteredCabinets.length > 0 && totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-slate-400 font-medium">
                            {filteredCabinets.length} cabinet(s) · Page{" "}
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

            {/* =====================================================
                MODAL 1 : ENREGISTRER UN PAIEMENT POUR UN CABINET
            ===================================================== */}
            {isPaymentModalOpen && selectedCabinet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
                        <div className="bg-gradient-to-r from-[#26415E] to-[#3A5570] p-3.5 text-white flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-sm">Paiement d'abonnement</h3>
                                <p className="text-[11px] text-blue-100">Cabinet : {selectedCabinet.nom}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsPaymentModalOpen(false)}
                                className="text-white/80 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSavePayment} className="p-4 space-y-3">
                            {/* Choix Forfait & Durée */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Forfait</label>
                                    <select
                                        value={paymentForm.plan}
                                        onChange={(e) => handlePlanOrDureeChange(e.target.value, paymentForm.duree_mois)}
                                        className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-bold cursor-pointer"
                                    >
                                        <option value="Basic">Basic (49 DT/m)</option>
                                        <option value="Pro">Pro (99 DT/m)</option>
                                        <option value="Premium">Premium (199 DT/m)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Durée</label>
                                    <select
                                        value={paymentForm.duree_mois}
                                        onChange={(e) => handlePlanOrDureeChange(paymentForm.plan, Number(e.target.value))}
                                        className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-bold cursor-pointer"
                                    >
                                        <option value={1}>1 mois</option>
                                        <option value={3}>3 mois</option>
                                        <option value={6}>6 mois</option>
                                        <option value={12}>12 mois (1 an)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Montant & Mode de paiement */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Montant Total (DT)</label>
                                    <input
                                        type="number"
                                        value={paymentForm.montant}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, montant: e.target.value })}
                                        className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Mode de règlement</label>
                                    <select
                                        value={paymentForm.mode_paiement}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, mode_paiement: e.target.value })}
                                        className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50 cursor-pointer"
                                    >
                                        <option value="Virement bancaire">Virement bancaire</option>
                                        <option value="Carte bancaire">Carte bancaire</option>
                                        <option value="Chèque">Chèque</option>
                                        <option value="Espèces">Espèces</option>
                                        <option value="En ligne">En ligne</option>
                                    </select>
                                </div>
                            </div>

                            {/* Dates de début et fin */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date début</label>
                                    <input
                                        type="date"
                                        value={paymentForm.date_debut}
                                        onChange={(e) => {
                                            const debut = new Date(e.target.value);
                                            const fin = new Date(debut);
                                            fin.setMonth(fin.getMonth() + Number(paymentForm.duree_mois));
                                            setPaymentForm({
                                                ...paymentForm,
                                                date_debut: e.target.value,
                                                date_fin: fin.toISOString().split("T")[0],
                                            });
                                        }}
                                        className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date fin</label>
                                    <input
                                        type="date"
                                        value={paymentForm.date_fin}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, date_fin: e.target.value })}
                                        className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
                                    />
                                </div>
                            </div>

                            {/* Statut du paiement */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Statut du paiement</label>
                                <select
                                    value={paymentForm.statut}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, statut: e.target.value })}
                                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-bold"
                                >
                                    <option value="Payé">Payé (Activer immédiatement l'abonnement)</option>
                                    <option value="En attente">En attente de paiement</option>
                                </select>
                            </div>

                            {/* Boutons */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition disabled:opacity-50"
                                >
                                    {saving ? "Enregistrement..." : "Enregistrer le paiement"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =====================================================
                MODAL 2 : HISTORIQUE DES PAIEMENTS DU CABINET
            ===================================================== */}
            {historyCabinet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-[#26415E] to-[#3A5570] p-3.5 text-white flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-sm">Historique des paiements</h3>
                                <p className="text-[11px] text-blue-100">Cabinet : {historyCabinet.nom}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setHistoryCabinet(null)}
                                className="text-white/80 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-4 max-h-[70vh] overflow-y-auto">
                            {historyCabinet.abonnements?.length === 0 ? (
                                <p className="text-center text-slate-400 text-xs py-6">
                                    Aucun paiement enregistré pour ce cabinet.
                                </p>
                            ) : (
                                <div className="space-y-2.5">
                                    {historyCabinet.abonnements.map((abo) => {
                                        const isPaye = (abo.statut || "").toLowerCase().includes("pay");
                                        return (
                                            <div
                                                key={abo.id}
                                                className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-900 text-sm">
                                                            {formatMoney(abo.montant)}
                                                        </span>
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                                                            Plan {abo.plan} ({abo.duree_mois} mois)
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                            isPaye ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                                        }`}>
                                                            {abo.statut}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 mt-1">
                                                        Période : {formatDate(abo.date_debut)} ➔ {formatDate(abo.date_fin)}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        Règlement : {abo.mode_paiement} · Réf : {abo.reference || "N/A"}
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeletePayment(abo.id)}
                                                    className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">
                                Total payé : {formatMoney(historyCabinet.total_paye)}
                            </span>
                            <button
                                type="button"
                                onClick={() => setHistoryCabinet(null)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}