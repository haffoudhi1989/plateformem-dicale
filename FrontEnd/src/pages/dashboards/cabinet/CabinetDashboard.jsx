import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Stethoscope,
    Users,
    CalendarDays,
    AlertCircle,
    Clock,
    CreditCard,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const ACCENT = "#ea580c";

const STATUT_LABELS = {
    confirme: "Confirmé",
    en_attente: "En attente",
    annule: "Annulé",
    termine: "Terminé",
};

const STATUT_BADGES = {
    confirme: "bg-[#EEF4F1] text-[#2F5D50] border-[#DCE8E4]",
    en_attente: "bg-[#F8F3E7] text-[#8A6D1F] border-[#EEE5CE]",
    annule: "bg-[#F8EFEF] text-[#7A2E33] border-[#E4CBCC]",
    termine: "bg-[#EEF2F6] text-[#92400E] border-[#DDE5EC]",
};

const fmtDate = (d) => {
    if (!d) return "—";
    const parts = String(d).split("-");
    if (parts.length !== 3) return d;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const fmtHeure = (h) => (h ? String(h).slice(0, 5) : "—");

const fmtTND = (n) =>
    new Intl.NumberFormat("fr-TN", {
        style: "currency",
        currency: "TND",
        maximumFractionDigits: 0,
    }).format(Number(n || 0));

const fmtDateLongue = () =>
    new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date());

const normStatut = (s) => (s || "").toLowerCase().replace(/\s+/g, "_");

function BarChartV({ data, color = ACCENT }) {
    const w = 640;
    const h = 220;
    const padX = 36;
    const padTop = 26;
    const padBottom = 32;
    const max = Math.max(1, ...data.map((d) => d.total));
    const innerW = w - padX * 2;
    const innerH = h - padTop - padBottom;
    const stepX = innerW / data.length;
    const barW = Math.min(40, stepX * 0.45);

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
            {[0, 0.5, 1].map((f, i) => {
                const y = padTop + innerH * (1 - f);
                return (
                    <g key={i}>
                        <line
                            x1={padX}
                            x2={w - padX}
                            y1={y}
                            y2={y}
                            stroke={f === 0 ? "#E7E1D5" : "#EDE8DD"}
                            strokeWidth="1"
                            strokeDasharray={f === 0 ? "none" : "3 4"}
                        />
                        <text
                            x={padX - 8}
                            y={y + 4}
                            textAnchor="end"
                            fontSize="10"
                            fill="#A39A89"
                        >
                            {Math.round(max * f)}
                        </text>
                    </g>
                );
            })}
            {data.map((d, i) => {
                const x = padX + stepX * i + (stepX - barW) / 2;
                const hBar = d.total > 0 ? (d.total / max) * innerH : 2;
                const y = padTop + innerH - hBar;
                return (
                    <g key={i}>
                        <rect
                            x={x}
                            y={y}
                            width={barW}
                            height={hBar}
                            rx="4"
                            fill={d.total > 0 ? color : "#E7E1D5"}
                        />
                        <text
                            x={x + barW / 2}
                            y={y - 7}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="600"
                            fill="#1C1B19"
                        >
                            {d.total}
                        </text>
                        <text
                            x={x + barW / 2}
                            y={h - 9}
                            textAnchor="middle"
                            fontSize="10.5"
                            fill="#A39A89"
                        >
                            {d.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

export default function CabinetDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [abo, setAbo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        axios
            .get(`${API_URL}/cabinet/dashboard`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            })
            .then((res) => {
                if (res.data?.success === false) {
                    setError(res.data.message || "Erreur de chargement.");
                    return;
                }
                setData(res.data);

                // Abonnement (bandeau statut sur le dashboard)
                axios
                    .get(`${API_URL}/cabinet/abonnement`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    })
                    .then((r) => setAbo(r.data?.data || null))
                    .catch(() => setAbo(null));
            })
            .catch((err) => {
                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login");
                } else {
                    setError(
                        err.response?.data?.message ||
                            "Impossible de charger le tableau de bord."
                    );
                }
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="rounded-md border border-[#E7E1D5] bg-white p-10 text-center shadow-[0_1px_3px_rgba(28,27,25,0.06)]">
                    <div className="w-12 h-12 border-[3px] border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-[#8C8577] font-medium">
                        Chargement de votre espace...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto mt-16 p-6 rounded-md bg-[#F8EFEF] border border-[#E4CBCC] text-[#7A2E33] flex items-start gap-3">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold">Erreur</p>
                    <p className="text-sm mt-0.5">{error}</p>
                </div>
            </div>
        );
    }

    const { cabinet, stats, rdv_par_mois = [], prochains_rdv = [], derniers_rdv = [] } = data || {};

    const statutAbo = abo?.statut || "aucun";
    const aboExpire = statutAbo === "expire";
    const aboActif = statutAbo === "actif";
    const aboBadge = aboExpire
        ? "bg-[#F8EFEF] text-[#7A2E33] border-[#E4CBCC]"
        : aboActif
          ? "bg-[#EEF4F1] text-[#2F5D50] border-[#DCE8E4]"
          : "bg-[#F8F3E7] text-[#8A6D1F] border-[#EEE5CE]";
    const aboLabel = aboExpire ? "Expiré" : aboActif ? "Actif" : "Non souscrit";

    const cards = [
        { label: "Médecin", description: "Médecin du cabinet", value: stats?.medecins ?? 0, icon: Stethoscope },
        { label: "Secrétaires", description: "Comptes secrétariat", value: stats?.secretaires ?? 0, icon: Users },
        { label: "Patients", description: "Suivi des dossiers", value: stats?.patients ?? 0, icon: Users },
        { label: "RDV aujourd'hui", description: "Consultations du jour", value: stats?.rdv_aujourdhui ?? 0, icon: CalendarDays },
        { label: "RDV cette semaine", description: "Charge hebdomadaire", value: stats?.rdv_semaine ?? 0, icon: Clock },
    ];

    return (
        <div>
            {/* ===================== Cadre d'en-tête ===================== */}
            <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-700 shadow-lg p-3 md:p-4 mb-4 flex items-center gap-3">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <CalendarDays size={24} className="text-white" />
                </div>
                <div className="min-w-0">
                    <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider">Espace Cabinet · Tableau de bord</p>
                    <h1 className="text-lg md:text-xl font-bold text-white mt-0.5 truncate">{cabinet?.nom || "Cabinet médical"}</h1>
                    <p className="text-orange-100/80 text-sm mt-0.5">Vue d'ensemble de l'activité de votre établissement</p>
                </div>
                <span className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-3 py-1.5 text-xs text-orange-100 font-medium">
                    <CalendarDays size={14} />
                    <span className="capitalize">{fmtDateLongue()}</span>
                </span>
            </div>

            {/* ===================== Indicateurs ===================== */}
            {/* ===================== Abonnement ===================== */}
            <div className="mb-8 rounded-lg bg-white border border-[#E7E1D5] p-5 shadow-[0_1px_3px_rgba(28,27,25,0.06)]">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#EEF2F6] text-[#92400E] flex items-center justify-center flex-none">
                        <CreditCard size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <p className="font-bold text-[#1C1B19]">
                                Abonnement {abo?.plan ? `— Plan ${abo.plan}` : ""}
                            </p>
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${aboBadge}`}>
                                {aboLabel}
                            </span>
                        </div>
                        <p className="text-xs text-[#8C8577] mt-1">
                            {aboActif
                                ? `Échéance le ${fmtDate(abo?.date_fin)} · ${abo?.jours_restants ?? "—"} jour(s) restant(s)`
                                : aboExpire
                                  ? `Expiré le ${fmtDate(abo?.date_fin)} — renouvelez pour réactiver l'espace.`
                                  : "Aucun abonnement souscrit — ajoutez un abonnement pour activer l'espace."}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate("/cabinet/abonnement")}
                        className={`shrink-0 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-semibold text-white transition-colors ${
                            aboActif
                                ? "bg-orange-600 hover:bg-orange-700"
                                : "bg-rose-600 hover:bg-rose-700"
                        }`}
                    >
                        <CreditCard size={16} />
                        {aboActif ? "Gérer l'abonnement" : aboExpire ? "Renouveler" : "Ajouter un abonnement"}
                    </button>
                </div>
            </div>

            <div className="grid gap-5 mb-8 [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]">
                {cards.map(({ label, description, value, icon: Icon }) => (
                    <div
                        key={label}
                        className="group bg-white rounded-md p-5 border border-[#E7E1D5] hover:border-amber-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ring-1 ring-transparent hover:ring-[#DDE5EC]"
                    >
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 bg-[#EEF2F6] rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                                <Icon size={22} className="text-[#92400E]" />
                            </div>

                            <span className="text-3xl font-bold text-[#92400E] tabular-nums">
                                {value}
                            </span>
                        </div>

                        <h3 className="font-semibold text-[#2A2825] mt-4 mb-1">
                            {label}
                        </h3>
                        <p className="text-sm text-[#A39A89]">
                            {description}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
                {/* ===================== Graphique ===================== */}
                <div className="lg:col-span-2 bg-white border border-[#E7E1D5] rounded-md p-6 shadow-[0_1px_3px_rgba(28,27,25,0.06)]">
                    <div className="flex items-start justify-between mb-5">
                        <div>
                            <h2 className="font-bold text-[#1C1B19]">
                                Rendez-vous par mois
                            </h2>
                            <p className="text-xs text-[#8C8577] mt-1">
                                Activité des 6 derniers mois
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-medium tracking-widest text-[#A39A89]">
                                Revenus (total)
                            </p>
                            <p className="text-lg font-semibold text-[#92400E] tabular-nums tracking-tight">
                                {fmtTND(stats?.revenus)}
                            </p>
                        </div>
                    </div>
                    <BarChartV data={rdv_par_mois} />
                </div>

                {/* ===================== Prochains RDV ===================== */}
                <div className="bg-white border border-[#E7E1D5] rounded-md p-6 shadow-[0_1px_3px_rgba(28,27,25,0.06)]">
                    <h2 className="font-bold text-[#1C1B19] mb-5">
                        Prochains rendez-vous
                    </h2>
                    {prochains_rdv.length === 0 ? (
                        <p className="text-sm text-[#8C8577] py-8 text-center">
                            Aucun rendez-vous à venir.
                        </p>
                    ) : (
                        <div className="space-y-2.5">
                            {prochains_rdv.map((rdv) => (
                                <div
                                    key={rdv.id}
                                    className="flex items-center gap-4 p-3 rounded-md border border-[#E7E1D5] hover:border-[#DDE5EC] hover:bg-[#EEF2F6]/40 transition-colors"
                                >
                                    <div className="flex-none w-14 text-center bg-[#EEF2F6] rounded-xl border border-[#DDE5EC] py-2">
                                        <p className="text-sm font-semibold text-[#92400E] leading-none">
                                            {fmtHeure(rdv.heure_rdv)}
                                        </p>
                                        <p className="text-[10px] text-[#A39A89] mt-1">
                                            {fmtDate(rdv.date_rdv)}
                                        </p>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#2A2825] truncate">
                                            {rdv.patient?.prenom} {rdv.patient?.nom}
                                        </p>
                                        <p className="text-xs text-[#8C8577] truncate">
                                            Dr {rdv.medecin?.prenom} {rdv.medecin?.nom}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border flex-none ${
                                            STATUT_BADGES[normStatut(rdv.statut)] ||
                                            "bg-[#EDE8DD] text-[#8C8577] border-[#E7E1D5]"
                                        }`}
                                    >
                                        {STATUT_LABELS[normStatut(rdv.statut)] || rdv.statut}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-6 pt-5 border-t border-[#EDE8DD]">
                        <h3 className="text-[11px] font-semibold tracking-widest text-[#A39A89] mb-3">
                            Derniers rendez-vous
                        </h3>
                        {derniers_rdv.length === 0 ? (
                            <p className="text-sm text-[#8C8577]">
                                Aucun rendez-vous enregistré.
                            </p>
                        ) : (
                            <div className="space-y-2.5">
                                {derniers_rdv.map((rdv) => (
                                    <div
                                        key={rdv.id}
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <span className="text-sm text-[#4A453D] truncate">
                                            {rdv.patient?.prenom} {rdv.patient?.nom}
                                        </span>
                                        <span className="text-xs text-[#A39A89] flex-none tabular-nums">
                                            {fmtDate(rdv.date_rdv)} · {fmtHeure(rdv.heure_rdv)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
