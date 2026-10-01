import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    ChevronLeft,
    Search,
    CalendarDays,
    CreditCard,
    Wallet,
    Clock,
    CheckCircle2,
    X,
    ReceiptText,
    TrendingUp,
    Hourglass,
    Plus,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const fmtDate = (d) => {
    if (!d) return "—";
    const s = String(d).slice(0, 10);
    const parts = s.split("-");
    if (parts.length !== 3) return s;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const fmtHeure = (h) => (h ? String(h).slice(0, 5) : "—");

const fmtMontant = (m) => {
    const n = Number(m || 0);
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "TND",
    }).format(n);
};

const getStatutStyle = (statut) => {
    const s = (statut || "").toLowerCase();
    if (s.includes("pay") || s.includes("valid") || s.includes("encaiss"))
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    if (s.includes("annul"))
        return "bg-rose-50 text-rose-700 border border-rose-100";
    return "bg-amber-50 text-amber-700 border border-amber-100";
};

export default function MedecinPaiements() {
    const navigate = useNavigate();

    const [paiements, setPaiements] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        total_montant: 0,
        mois_total: 0,
        mois_montant: 0,
        en_attente_montant: 0,
    });
    const [rdvs, setRdvs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [statutFiltre, setStatutFiltre] = useState("tous");
    const [dateFiltre, setDateFiltre] = useState("");

    // MODAL ENCAISSEMENT
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [formError, setFormError] = useState("");
    const [form, setForm] = useState({
        rendez_vous_id: "",
        montant: "",
        mode_paiement: "Espèces",
        statut: "Payé",
        date_paiement: new Date().toISOString().slice(0, 10),
        description: "",
    });

    const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

    const chargerPaiements = async () => {
        try {
            const res = await axios.get(`${API_URL}/medecin/paiements`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });
            setPaiements(res.data?.data || []);
            setStats(
                res.data?.stats || {
                    total: 0,
                    total_montant: 0,
                    mois_total: 0,
                    mois_montant: 0,
                    en_attente_montant: 0,
                }
            );
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
            } else {
                setError(
                    err.response?.data?.message ||
                        "Impossible de charger les paiements."
                );
            }
        }
    };

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        const loadAll = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    chargerPaiements(),
                    axios
                        .get(`${API_URL}/medecin/dashboard`, {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                Accept: "application/json",
                            },
                        })
                        .then((res) => {
                            const rdvList = res.data?.rendez_vous || [];
                            const annules = (s) =>
                                (s || "")
                                    .toLowerCase()
                                    .includes("annul");
                            setRdvs(
                                rdvList.filter((r) => !annules(r.statut))
                            );
                        }),
                ]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Statuts distincts pour le filtre
    const statuts = useMemo(() => {
        const s = new Set(
            paiements
                .map((p) => p.statut)
                .filter(Boolean)
                .map((x) => x.trim())
        );
        return ["tous", ...Array.from(s)];
    }, [paiements]);

    const filtered = paiements.filter((p) => {
        const q = searchQuery.toLowerCase().trim();
        const nomPatient = `${p.patient?.prenom || ""} ${p.patient?.nom || ""}`;
        const motif = p.rendez_vous?.motif || p.description || "";
        const okRecherche =
            !q ||
            nomPatient.toLowerCase().includes(q) ||
            motif.toLowerCase().includes(q) ||
            (p.mode_paiement || "").toLowerCase().includes(q);
        const okStatut =
            statutFiltre === "tous" ||
            (p.statut || "").trim() === statutFiltre;
        const okDate =
            !dateFiltre ||
            String(p.date_paiement || p.created_at || "").slice(0, 10) ===
                dateFiltre;
        return okRecherche && okStatut && okDate;
    });

    const openModal = () => {
        setFormError("");
        setForm({
            rendez_vous_id: rdvs[0]?.id || "",
            montant: "",
            mode_paiement: "Espèces",
            statut: "Payé",
            date_paiement: new Date().toISOString().slice(0, 10),
            description: "",
        });
        setShowModal(true);
    };

    const handleEncaisser = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError("");
        setSuccessMsg("");

        try {
            await axios.post(`${API_URL}/medecin/paiements`, form, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });
            setShowModal(false);
            setSuccessMsg("Paiement enregistré avec succès.");
            setTimeout(() => setSuccessMsg(""), 4000);
            chargerPaiements();
        } catch (err) {
            const errors = err.response?.data?.errors;
            const message = err.response?.data?.message;
            if (errors) {
                setFormError(
                    Object.values(errors).flat().join(" ")
                );
            } else {
                setFormError(
                    message ||
                        "Impossible d'enregistrer le paiement. Vérifiez les informations saisies."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    const field = (name) => ({
        value: form[name],
        onChange: (e) => setForm({ ...form, [name]: e.target.value }),
    });

    const statsCards = [
        {
            label: "Total encaissé",
            value: fmtMontant(stats.total_montant),
            icon: Wallet,
            bg: "bg-emerald-50 text-emerald-700",
        },
        {
            label: "Ce mois-ci",
            value: fmtMontant(stats.mois_montant),
            icon: TrendingUp,
            bg: "bg-blue-50 text-blue-700",
        },
        {
            label: "Paiements",
            value: `${stats.total} encaissement${stats.total > 1 ? "s" : ""}`,
            icon: ReceiptText,
            bg: "bg-indigo-50 text-indigo-700",
        },
        {
            label: "En attente",
            value: fmtMontant(stats.en_attente_montant),
            icon: Hourglass,
            bg: "bg-amber-50 text-amber-700",
        },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* EN-TÊTE */}
            <div className="rounded-2xl bg-gradient-to-r from-[#14532D] to-[#059669] shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                        <CreditCard size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Mes paiements</h1>
                        <p className="text-sm text-emerald-50/90 mt-0.5">
                            Encaissements liés à vos consultations
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={() => navigate("/medecin/dashboard")}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition cursor-pointer"
                    >
                        <ChevronLeft size={16} />
                        <span>Dashboard</span>
                    </button>
                </div>
            </div>

            {successMsg && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 size={18} className="shrink-0" />
                    {successMsg}
                </div>
            )}

            {error && (
                <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-semibold text-rose-700">
                    <X size={18} className="shrink-0" />
                    {error}
                </div>
            )}

            {/* CARTES STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 flex items-center gap-4"
                        >
                            <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${card.bg}`}
                            >
                                <Icon size={22} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                    {card.label}
                                </p>
                                <p className="text-lg font-black text-slate-800 truncate">
                                    {card.value}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* BARRE D'ACTIONS */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-xs">
                    <Search
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="text"
                        placeholder="Rechercher un patient, motif, mode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-blue-500 transition shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl px-2.5 py-1.5">
                        <CalendarDays size={14} className="text-slate-400" />
                        <input
                            type="date"
                            value={dateFiltre}
                            onChange={(e) => setDateFiltre(e.target.value)}
                            className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                        />
                        {dateFiltre && (
                            <button
                                type="button"
                                onClick={() => setDateFiltre("")}
                                aria-label="Effacer la date"
                                className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* FILTRES STATUT */}
            <div className="flex flex-wrap items-center gap-2">
                {statuts.map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => setStatutFiltre(s)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
                            statutFiltre === s
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                                : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                        }`}
                    >
                        {s === "tous" ? "Tous" : s}
                        <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                statutFiltre === s
                                    ? "bg-white/20 text-white"
                                    : "bg-slate-100 text-slate-500"
                            }`}
                        >
                            {s === "tous"
                                ? paiements.length
                                : paiements.filter(
                                      (p) =>
                                          (p.statut || "").trim() === s
                                  ).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* CHARGEMENT */}
            {loading ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm">
                    <div className="w-12 h-12 mx-auto mb-4 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-slate-700">
                        Chargement des paiements...
                    </p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                        <CreditCard size={28} />
                    </div>
                    <h2 className="text-base font-black text-slate-800">
                        Aucun paiement
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        {dateFiltre
                            ? "Aucun paiement à cette date."
                            : searchQuery || statutFiltre !== "tous"
                            ? "Aucun paiement ne correspond à votre recherche."
                            : "Aucun paiement enregistré pour vos consultations pour le moment."}
                    </p>
                </div>
            ) : (
                /* TABLEAU */
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Patient</th>
                                    <th className="px-6 py-4">Rendez-vous</th>
                                    <th className="px-6 py-4">Montant</th>
                                    <th className="px-6 py-4">Mode</th>
                                    <th className="px-6 py-4">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {filtered.map((p) => {
                                    const initial = (
                                        p.patient?.prenom?.charAt(0) ||
                                        p.patient?.nom?.charAt(0) ||
                                        "P"
                                    ).toUpperCase();
                                    return (
                                        <tr
                                            key={p.id}
                                            className="hover:bg-slate-50/80 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                                    <CalendarDays
                                                        size={13}
                                                        className="text-slate-400"
                                                    />
                                                    {fmtDate(
                                                        p.date_paiement ||
                                                            p.created_at
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                                                        {initial}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-xs">
                                                            {p.patient
                                                                ?.prenom}{" "}
                                                            {p.patient?.nom}
                                                        </p>
                                                        {p.patient
                                                            ?.telephone && (
                                                            <span className="text-[10px] text-slate-400 font-medium">
                                                                {
                                                                    p.patient
                                                                        .telephone
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {p.rendez_vous ? (
                                                    <div className="text-slate-600 font-medium">
                                                        <span className="block">
                                                            {fmtDate(
                                                                p.rendez_vous
                                                                    .date_rdv
                                                            )}{" "}
                                                            ·{" "}
                                                            {fmtHeure(
                                                                p.rendez_vous
                                                                    .heure_rdv
                                                            )}
                                                        </span>
                                                        <span className="block text-[10px] text-slate-400">
                                                            {p.rendez_vous
                                                                .motif ||
                                                                "Consultation"}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-black text-slate-800">
                                                    {fmtMontant(p.montant)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">
                                                {p.mode_paiement || "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatutStyle(
                                                        p.statut
                                                    )}`}
                                                >
                                                    {p.statut || "En attente"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL ENCAISSER */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                                <CreditCard size={18} className="text-emerald-600" />
                                Encaisser un paiement
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                aria-label="Fermer"
                                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleEncaisser}
                            className="p-6 space-y-4"
                        >
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                    Rendez-vous du patient *
                                </label>
                                <select
                                    required
                                    value={form.rendez_vous_id}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            rendez_vous_id: e.target.value,
                                        })
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                                >
                                    {rdvs.length === 0 && (
                                        <option value="">
                                            Aucun rendez-vous disponible
                                        </option>
                                    )}
                                    {rdvs.map((rdv) => (
                                        <option key={rdv.id} value={rdv.id}>
                                            {rdv.patient?.prenom}{" "}
                                            {rdv.patient?.nom} —{" "}
                                            {fmtDate(rdv.date_rdv)}{" "}
                                            {fmtHeure(rdv.heure_rdv)}
                                            {rdv.motif
                                                ? ` (${rdv.motif})`
                                                : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                        Montant (€) *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        {...field("montant")}
                                        className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                        Mode de paiement *
                                    </label>
                                    <select
                                        required
                                        {...field("mode_paiement")}
                                        className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                                    >
                                        <option>Espèces</option>
                                        <option>Carte bancaire</option>
                                        <option>Chèque</option>
                                        <option>Virement</option>
                                        <option>En ligne</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                    Statut *
                                </label>
                                <select
                                    required
                                    {...field("statut")}
                                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                                >
                                    <option>Payé</option>
                                    <option>En attente</option>
                                </select>
                            </div>

                            {formError && (
                                <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
                                    {formError}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#14532D] to-[#059669] text-white text-xs font-bold shadow-md hover:opacity-90 transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Clock size={14} />
                                    {saving
                                        ? "Enregistrement..."
                                        : "Encaisser le paiement"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
