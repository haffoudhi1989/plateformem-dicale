import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    CreditCard,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Check,
    CalendarDays,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const PLANS = [
    {
        id: "Basic",
        prix: 49,
        description: "Pour démarrer",
        features: [
            "Agenda & rendez-vous",
            "1 médecin",
            "Notifications e-mail",
        ],
    },
    {
        id: "Pro",
        prix: 99,
        description: "Le plus populaire",
        features: [
            "Jusqu'à 5 médecins",
            "Gestion des secrétaires",
            "Notifications e-mail + SMS",
            "Statistiques & rapports",
        ],
    },
    {
        id: "Premium",
        prix: 199,
        description: "Pour les grands cabinets",
        features: [
            "1 médecin inclus",
            "Téléconsultation vidéo",
            "Paiement en ligne",
            "Support prioritaire",
        ],
    },
];

const DUREES = [1, 3, 12];

const fmtTND = (n) =>
    new Intl.NumberFormat("fr-TN", {
        style: "currency",
        currency: "TND",
        maximumFractionDigits: 0,
    }).format(Number(n || 0));

const fmtDate = (d) => {
    if (!d) return "—";
    const parts = String(d).split("-");
    if (parts.length !== 3) return d;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const STATUT_BADGES = {
    actif: "bg-emerald-50 text-emerald-600 border-emerald-100",
    expire: "bg-rose-50 text-rose-500 border-rose-100",
    en_attente: "bg-amber-50 text-amber-600 border-amber-100",
};

const STATUT_LABELS = {
    actif: "Actif",
    expire: "Expiré",
    en_attente: "En attente",
};

export default function CabinetAbonnement() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState("Pro");
    const [duree, setDuree] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const token = () =>
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    const headers = () => ({
        Authorization: `Bearer ${token()}`,
        Accept: "application/json",
    });

    useEffect(() => {
        if (!token()) {
            navigate("/login");
            return;
        }

        axios
            .get(`${API_URL}/cabinet/abonnement`, { headers: headers() })
            .then((res) => {
                if (res.data?.success === false) {
                    setError(res.data.message || "Erreur de chargement.");
                    return;
                }
                const ab = res.data?.data || {};
                setData(ab);
                if (ab.plan) setSelectedPlan(ab.plan);
            })
            .catch((err) => {
                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login");
                } else {
                    setError(
                        err.response?.data?.message ||
                            "Impossible de charger l'abonnement."
                    );
                }
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    const planActuel = data?.plan || "Basic";
    const prixMensuel = data?.plans?.[selectedPlan] ?? PLANS.find((p) => p.id === selectedPlan)?.prix ?? 49;
    const montantTotal = prixMensuel * duree;

    const souscrire = async () => {
        setMessage("");
        setError("");
        setSaving(true);

        try {
            const res = await axios.put(
                `${API_URL}/cabinet/abonnement`,
                { plan: selectedPlan, duree },
                { headers: headers() }
            );
            setMessage(res.data?.message || "Abonnement mis à jour.");
            const ab = res.data?.data;
            if (ab) {
                setData((prev) => ({
                    ...prev,
                    plan: ab.plan,
                    statut: ab.statut,
                    date_debut: ab.date_debut,
                    date_fin: ab.date_fin,
                    jours_restants: ab.duree_mois ? ab.duree_mois * 30 : prev?.jours_restants,
                    prix_mensuel: ab.prix_mensuel,
                }));
            }
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
            } else {
                setError(
                    err.response?.data?.message ||
                        "Impossible de mettre à jour l'abonnement."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-10 h-10 border-2 border-orange-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* ===================== Cadre d'en-tête ===================== */}
            <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-700 shadow-lg p-3 md:p-4 mb-4 flex items-center gap-3">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <CreditCard size={24} className="text-white" />
                </div>
                <div className="min-w-0">
                    <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider">Espace Cabinet · Abonnement</p>
                    <h1 className="text-lg md:text-xl font-bold text-white mt-0.5 truncate">Gestion des abonnements</h1>
                    <p className="text-orange-100/80 text-sm mt-0.5">Consultez votre plan actuel et changez d'offre à tout moment</p>
                </div>
            </div>

            {message && (
                <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                    <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{message}</p>
                </div>
            )}

            {error && (
                <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-500">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* ===================== Abonnement actuel ===================== */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 flex flex-col md:flex-row md:items-center gap-5">
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-none">
                    <CreditCard size={20} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-lg font-semibold text-slate-900">
                            Plan {planActuel}
                        </p>
                        <span
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                                STATUT_BADGES[data?.statut] ||
                                "bg-slate-50 text-slate-500 border-slate-100"
                            }`}
                        >
                            {STATUT_LABELS[data?.statut] || data?.statut || "Actif"}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        {fmtTND(data?.prix_mensuel ?? 49)}
                        <span className="text-slate-400">/mois</span>
                    </p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center md:text-right">
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                            Début
                        </p>
                        <p className="text-sm font-semibold text-slate-700 mt-1 tabular-nums">
                            {fmtDate(data?.date_debut)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                            Fin
                        </p>
                        <p className="text-sm font-semibold text-slate-700 mt-1 tabular-nums">
                            {fmtDate(data?.date_fin)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                            Jours restants
                        </p>
                        <p className="text-sm font-semibold text-orange-600 mt-1 tabular-nums">
                            {data?.jours_restants ?? "—"}
                        </p>
                    </div>
                </div>
            </div>

            {/* ===================== Offres ===================== */}
            <h2 className="font-semibold text-slate-900 mb-4">
                Choisissez votre plan
            </h2>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
                {PLANS.map((plan) => {
                    const selected = selectedPlan === plan.id;
                    const isCurrent = planActuel === plan.id;
                    return (
                        <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlan(plan.id)}
                            className={`relative text-left bg-white rounded-xl border p-5 transition-all cursor-pointer ${
                                selected
                                    ? "border-orange-500 ring-4 ring-orange-500/10"
                                    : "border-slate-200 hover:border-orange-300"
                            }`}
                        >
                            {isCurrent && (
                                <span className="absolute top-4 right-4 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                                    Plan actuel
                                </span>
                            )}
                            <p className="font-semibold text-slate-900">
                                {plan.id}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {plan.description}
                            </p>
                            <p className="mt-3 text-2xl font-semibold text-slate-900 tabular-nums">
                                {fmtTND(plan.prix)}
                                <span className="text-sm text-slate-400 font-normal">
                                    /mois
                                </span>
                            </p>
                            <ul className="mt-4 space-y-2">
                                {plan.features.map((f) => (
                                    <li
                                        key={f}
                                        className="flex items-start gap-2 text-sm text-slate-600"
                                    >
                                        <Check
                                            size={15}
                                            className="text-orange-500 shrink-0 mt-0.5"
                                        />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <div
                                className={`mt-4 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                    selected
                                        ? "bg-orange-600 text-white"
                                        : "bg-slate-100 text-slate-600"
                                }`}
                            >
                                {selected ? "Sélectionné" : "Choisir"}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ===================== Durée & souscription ===================== */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-5">
                    <div>
                        <p className="text-sm font-semibold text-slate-900 mb-2">
                            Durée de l'abonnement
                        </p>
                        <div className="flex gap-2">
                            {DUREES.map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setDuree(d)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ${
                                        duree === d
                                            ? "bg-orange-600 text-white border-orange-600"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"
                                    }`}
                                >
                                    {d} mois
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="md:ml-auto text-right">
                        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                            Total à régler
                        </p>
                        <p className="text-xl font-semibold text-orange-600 tabular-nums">
                            {fmtTND(montantTotal)}
                        </p>
                        <p className="text-xs text-slate-400">
                            {fmtTND(prixMensuel)} × {duree} mois
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={souscrire}
                    disabled={saving}
                    className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                    {saving ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Enregistrement…
                        </>
                    ) : (
                        <>
                            <CalendarDays size={16} />
                            {planActuel === selectedPlan
                                ? "Renouveler l'abonnement"
                                : `Passer au plan ${selectedPlan}`}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
