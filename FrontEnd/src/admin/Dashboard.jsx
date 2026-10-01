import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import {
    Users,
    Stethoscope,
    CalendarCheck,
    CreditCard,
    ArrowUpRight,
    Activity,
    TrendingUp,
    PieChart,
    ArrowRight,
    Zap,
    RefreshCw,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronRight,
    Bell,
    CalendarDays,
} from "lucide-react";

// =====================================================
// HELPERS
// =====================================================

const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("fr-FR");
};

const formatMoney = (value) => {
    return `${Number(value || 0).toLocaleString("fr-FR")} DT`;
};

const getPatientName = (patient) => {
    if (!patient) return "-";

    if (typeof patient === "string") {
        return patient;
    }

    return (
        `${patient.prenom || ""} ${patient.nom || ""}`.trim() ||
        "-"
    );
};

const getMedecinName = (medecin) => {
    if (!medecin) return "-";

    if (typeof medecin === "string") {
        return medecin.replace(/^Dr\.?\s*/i, "").trim();
    }

    return (
        `${medecin.prenom || ""} ${medecin.nom || ""}`.trim() ||
        "-"
    );
};

const formatDate = (date) => {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return "-";
    }

    return parsed.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const formatRelativeDate = (date) => {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return "-";
    }

    const diff = Date.now() - parsed.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `Il y a ${hours} h`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
        return `Il y a ${days} j`;
    }

    return formatDate(date);
};

const AVATAR_GRADIENTS = [
    "from-[#2563EB] to-[#3B82F6]",
    "from-[#10B981] to-[#059669]",
    "from-[#6B5A82] to-[#5C4B72]",
    "from-[#AC9040] to-[#D97706]",
    "from-[#9C5A61] to-[#8C444A]",
    "from-[#10B981] to-[#2563EB]",
];

const getInitials = (name) => {
    if (!name || name === "-") return "?";

    const parts = String(name).trim().split(/\s+/);

    const initials = parts
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");

    return initials || "?";
};

const getTodayLabel = () => {
    const date = new Date();

    return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

const getStatus = (statut) => {
    const status = String(statut || "").toLowerCase();

    if (status.includes("confirm")) {
        return {
            label: "Confirmé",
            className:
                "bg-[#EEF4F1] text-[#047857] border-[#DCE8E4]",
            icon: CheckCircle2,
        };
    }

    if (status.includes("annul")) {
        return {
            label: "Annulé",
            className:
                "bg-[#F8EFEF] text-[#642529] border-[#F0DEDF]",
            icon: XCircle,
        };
    }

    if (status.includes("termin")) {
        return {
            label: "Terminé",
            className:
                "bg-[#EEF2F6] text-[#1E40AF] border-[#DDE5EC]",
            icon: CheckCircle2,
        };
    }

    return {
        label: statut || "En attente",
        className:
            "bg-[#F8F3E7] text-[#B45309] border-[#EEE5CE]",
        icon: Clock,
    };
};

// =====================================================
// STATISTIQUE CARD
// =====================================================

function StatCard({
    title,
    value,
    description,
    icon: Icon,
    iconClass,
    link,
    delay = 0,
}) {
    const navigate = useNavigate();

    return (
        <button
            type="button"
            onClick={() => navigate(link)}
            className="group relative overflow-hidden text-left bg-white border border-slate-200 rounded-lg p-5 shadow-[0_1px_2px_rgba(28,27,25,0.06)] hover:shadow-[0_2px_10px_rgba(28,27,25,0.08)] hover:-translate-y-0.5 hover:border-[#E2E8F0] transition-all duration-300 w-full"
            style={{
                animation: `fadeUp .5s ease-out ${delay}ms both`,
            }}
        >
            {/* Halo décoratif très léger */}
            <div
                className={`absolute -top-14 -right-14 w-28 h-28 rounded-full ${iconClass} opacity-[0.06] blur-2xl group-hover:opacity-10 transition-opacity duration-300`}
            />

            <div className="relative flex items-start justify-between">
                <div
                    className={`w-11 h-11 rounded-md flex items-center justify-center ${iconClass} group-hover:scale-105 transition-transform duration-300`}
                >
                    <Icon size={21} />
                </div>

                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-[#EEF2F6] group-hover:text-[#3B82F6] transition">
                    <ArrowUpRight size={16} />
                </div>
            </div>

            <div className="relative mt-4">
                <p className="text-sm font-semibold text-slate-500">
                    {title}
                </p>

                <h2 className="text-2xl font-sans text-blue-900 mt-1 tracking-tight tabular-nums">
                    {value}
                </h2>

                <p className="text-xs text-[#A39A89] mt-1.5">
                    {description}
                </p>
            </div>
        </button>
    );
}

// =====================================================
// EVOLUTION CHART
// =====================================================

function EvolutionChart({ chartData }) {
    const [period, setPeriod] = useState("mois");
    const [hoveredPoint, setHoveredPoint] = useState(null);

    const fallbackData = {
        semaine: [
            { label: "Lun", rdv: 8 },
            { label: "Mar", rdv: 12 },
            { label: "Mer", rdv: 10 },
            { label: "Jeu", rdv: 15 },
            { label: "Ven", rdv: 18 },
            { label: "Sam", rdv: 11 },
            { label: "Dim", rdv: 6 },
        ],
        mois: [
            { label: "Jan", rdv: 18 },
            { label: "Fév", rdv: 24 },
            { label: "Mar", rdv: 21 },
            { label: "Avr", rdv: 35 },
            { label: "Mai", rdv: 42 },
            { label: "Juin", rdv: 38 },
            { label: "Juil", rdv: 55 },
            { label: "Août", rdv: 48 },
        ],
        annee: [
            { label: "2020", rdv: 120 },
            { label: "2021", rdv: 180 },
            { label: "2022", rdv: 240 },
            { label: "2023", rdv: 310 },
            { label: "2024", rdv: 380 },
            { label: "2025", rdv: 450 },
            { label: "2026", rdv: 520 },
        ],
    };

    const currentData =
        chartData?.[period]?.length > 0
            ? chartData[period]
            : fallbackData[period];

    const maxRdv = Math.max(
        ...currentData.map((item) => Number(item.rdv || 0)),
        1
    );

    const svgWidth = 700;
    const svgHeight = 230;
    const paddingX = 40;
    const paddingY = 30;

    const points = currentData.map((item, index) => {
        const x =
            paddingX +
            (index / Math.max(currentData.length - 1, 1)) *
                (svgWidth - 2 * paddingX);

        const y =
            svgHeight -
            paddingY -
            (Number(item.rdv || 0) / (maxRdv * 1.15)) *
                (svgHeight - 2 * paddingY);

        return {
            x,
            y,
            data: item,
            index,
        };
    });

    const pathD = points.reduce(
        (path, point, index, array) => {
            if (index === 0) {
                return `M ${point.x},${point.y}`;
            }

            const previous = array[index - 1];
            const controlX = (previous.x + point.x) / 2;

            return `${path} C ${controlX},${previous.y} ${controlX},${point.y} ${point.x},${point.y}`;
        },
        ""
    );

    const areaD =
        points.length > 0
            ? `${pathD}
               L ${points[points.length - 1].x},${svgHeight - 15}
               L ${points[0].x},${svgHeight - 15}
               Z`
            : "";

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-[0_1px_2px_rgba(28,27,25,0.06)] h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-[#EEF2F6] text-[#3B82F6] flex items-center justify-center">
                        <TrendingUp size={20} />
                    </div>

                    <div>
                        <h3 className="text-base font-sans text-blue-900">
                            Évolution des consultations
                        </h3>

                        <p className="text-xs text-[#A39A89] mt-0.5">
                            Tendance des rendez-vous médicaux
                        </p>
                    </div>
                </div>

                <div className="flex bg-slate-200 p-1 rounded-md gap-1 text-xs font-bold">
                    {["semaine", "mois", "annee"].map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => {
                                setPeriod(item);
                                setHoveredPoint(null);
                            }}
                            className={`px-3 py-1.5 rounded-lg transition ${
                                period === item
                                    ? "bg-white text-[#1E40AF] shadow-[0_1px_2px_rgba(28,27,25,0.06)]"
                                    : "text-slate-500 hover:text-[#2A2825]"
                            }`}
                        >
                            {item === "semaine"
                                ? "Semaine"
                                : item === "mois"
                                ? "Mois"
                                : "Année"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative w-full overflow-x-auto pt-5">
                <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full min-w-[580px] h-56"
                >
                    <defs>
                        <linearGradient
                            id="dashboardAreaGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="#3B82F6"
                                stopOpacity="0.25"
                            />

                            <stop
                                offset="100%"
                                stopColor="#3B82F6"
                                stopOpacity="0"
                            />
                        </linearGradient>

                        <linearGradient
                            id="dashboardLineGradient"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                        >
                            <stop
                                offset="0%"
                                stopColor="#3B82F6"
                            />

                            <stop
                                offset="100%"
                                stopColor="#10B981"
                            />
                        </linearGradient>
                    </defs>

                    {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
                        <line
                            key={ratio}
                            x1={paddingX}
                            y1={svgHeight * ratio}
                            x2={svgWidth - paddingX}
                            y2={svgHeight * ratio}
                            stroke="#CBD5E1"
                            strokeDasharray="5 5"
                        />
                    ))}

                    <path
                        d={areaD}
                        fill="url(#dashboardAreaGradient)"
                    />

                    <path
                        d={pathD}
                        fill="none"
                        stroke="url(#dashboardLineGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />

                    {points.map((point) => (
                        <circle
                            key={point.index}
                            cx={point.x}
                            cy={point.y}
                            r={
                                hoveredPoint?.index === point.index
                                    ? 8
                                    : 5
                            }
                            fill="white"
                            stroke="#3B82F6"
                            strokeWidth="3"
                            className="cursor-pointer"
                            onMouseEnter={() =>
                                setHoveredPoint(point)
                            }
                            onMouseLeave={() =>
                                setHoveredPoint(null)
                            }
                        />
                    ))}
                </svg>

                {hoveredPoint && (
                    <div
                        className="absolute bg-[#1C1B19] text-white text-xs rounded-md px-3 py-2 shadow-[0_10px_30px_rgba(28,27,25,0.20)] pointer-events-none z-10"
                        style={{
                            left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                            top: `${(hoveredPoint.y / svgHeight) * 100}%`,
                            transform: "translate(-50%, -120%)",
                        }}
                    >
                        <div className="font-bold text-[#8FA6BC]">
                            {hoveredPoint.data.label}
                        </div>

                        <div className="font-semibold">
                            {hoveredPoint.data.rdv} rendez-vous
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-between px-5 text-xs font-semibold text-[#A39A89] border-t border-slate-200 pt-3 min-w-[580px]">
                {currentData.map((item) => (
                    <span key={item.label}>
                        {item.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

// =====================================================
// DONUT
// =====================================================

function StatutDonutChart({ rendezVous }) {
    const statsCount = useMemo(() => {
        return rendezVous.reduce(
            (acc, rdv) => {
                const status = String(
                    rdv.statut || ""
                ).toLowerCase();

                if (status.includes("confirm")) {
                    acc.confirmes++;
                } else if (status.includes("annul")) {
                    acc.annules++;
                } else if (status.includes("termin")) {
                    acc.termines++;
                } else {
                    acc.attente++;
                }

                return acc;
            },
            {
                confirmes: 0,
                attente: 0,
                annules: 0,
                termines: 0,
            }
        );
    }, [rendezVous]);

    const categories = [
        {
            label: "Confirmés",
            count: statsCount.confirmes,
            color: "#059669",
            bg: "bg-[#10B981]",
        },
        {
            label: "En attente",
            count: statsCount.attente,
            color: "#F59E0B",
            bg: "bg-[#D97706]",
        },
        {
            label: "Annulés",
            count: statsCount.annules,
            color: "#7A2E33",
            bg: "bg-[#8C444A]",
        },
        {
            label: "Terminés",
            count: statsCount.termines,
            color: "#3B82F6",
            bg: "bg-[#3B82F6]",
        },
    ];

    const total = categories.reduce(
        (sum, item) => sum + item.count,
        0
    );

    let cumulative = 0;

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-[0_1px_2px_rgba(28,27,25,0.06)] h-full">
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-[#EEF2F6] text-[#1E40AF] flex items-center justify-center">
                    <PieChart size={20} />
                </div>

                <div>
                    <h3 className="text-base font-sans text-blue-900">
                        Répartition par statut
                    </h3>

                    <p className="text-xs text-[#A39A89] mt-0.5">
                        État des rendez-vous
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-center gap-7 py-7">
                <div className="relative w-40 h-40">
                    {total > 0 ? (
                        <svg
                            viewBox="0 0 36 36"
                            className="w-full h-full -rotate-90"
                        >
                            <circle
                                cx="18"
                                cy="18"
                                r="15.915"
                                fill="transparent"
                                stroke="#CBD5E1"
                                strokeWidth="4.2"
                            />

                            {categories.map((category) => {
                                const percent =
                                    category.count / total;

                                const offset = -cumulative;

                                cumulative += percent * 100;

                                if (!category.count) {
                                    return null;
                                }

                                return (
                                    <circle
                                        key={category.label}
                                        cx="18"
                                        cy="18"
                                        r="15.915"
                                        fill="transparent"
                                        stroke={category.color}
                                        strokeWidth="4.2"
                                        strokeDasharray={`${percent * 100} ${
                                            100 - percent * 100
                                        }`}
                                        strokeDashoffset={offset}
                                        strokeLinecap="round"
                                    />
                                );
                            })}
                        </svg>
                    ) : (
                        <div className="w-full h-full rounded-full border-[12px] border-slate-200" />
                    )}

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-sans text-blue-900">
                            {total}
                        </span>

                        <span className="text-[10px] font-semibold tracking-wide text-[#A39A89]">
                            Total
                        </span>
                    </div>
                </div>

                <div className="space-y-2.5 w-full">
                    {categories.map((category) => {
                        const percentage =
                            total > 0
                                ? Math.round(
                                      (category.count / total) * 100
                                  )
                                : 0;

                        return (
                            <div
                                key={category.label}
                                className="flex items-center justify-between text-xs p-2 rounded-md hover:bg-slate-50"
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`w-2.5 h-2.5 rounded-full ${category.bg}`}
                                    />

                                    <span className="text-[#4A453D] font-medium">
                                        {category.label}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-[#2A2825]">
                                        {category.count}
                                    </span>

                                    <span className="font-bold bg-slate-200 px-2 py-1 rounded-lg text-slate-500">
                                        {percentage}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// =====================================================
// DASHBOARD
// =====================================================

export default function Dashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        medecins: 0,
        patients: 0,
        rendez_vous: 0,
        revenus: 0,
    });

    const [rendezVous, setRendezVous] = useState([]);
    const [activities, setActivities] = useState([]);
    const [chartData, setChartData] = useState(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    // =====================================================
    // INFOS ADMIN (EN-TÊTE)
    // =====================================================

    const adminIdentity = useMemo(() => {
        let name = "Admin";
        let initials = "A";

        try {
            const raw = localStorage.getItem("user");

            if (raw) {
                const user = JSON.parse(raw);

                const fullName =
                    `${user.prenom || ""} ${user.nom || ""}`.trim();

                if (fullName) {
                    name = fullName;
                    initials = getInitials(fullName);
                } else if (user.name) {
                    name = user.name;
                    initials = getInitials(user.name);
                }
            }
        } catch (err) {
            // Données utilisateur illisibles : valeurs par défaut
        }

        return { name, initials };
    }, []);

    const todayLabel = getTodayLabel();

    // =====================================================
    // ACTIVITÉS
    // =====================================================

    const generateActivities = (data) => {
        const dynamicActivities = [];

        if (Array.isArray(data?.activities)) {
            data.activities.forEach((activity, index) => {
                dynamicActivities.push({
                    id:
                        activity.id ||
                        `api-${index}-${activity.created_at || ""}`,

                    type: activity.type || "system",

                    title: activity.title || "Activité",

                    desc:
                        activity.desc ||
                        activity.description ||
                        "",

                    time:
                        activity.time ||
                        formatRelativeDate(
                            activity.date ||
                                activity.created_at
                        ),

                    date:
                        activity.date ||
                        activity.created_at ||
                        null,
                });
            });
        }

        const derniersRdv = Array.isArray(
            data?.derniers_rendez_vous
        )
            ? data.derniers_rendez_vous
            : [];

        derniersRdv.forEach((rdv) => {
            const patient = getPatientName(rdv.patient);
            const medecin = getMedecinName(rdv.medecin);

            const date =
                rdv.created_at ||
                rdv.updated_at ||
                rdv.date_rendez_vous ||
                rdv.date ||
                rdv.date_rdv ||
                null;

            dynamicActivities.push({
                id: `rdv-${rdv.id}`,

                type: "rdv",

                title: "Rendez-vous",

                desc: `${patient} avec Dr. ${medecin}`,

                time: formatRelativeDate(date),

                date,
            });
        });

        const derniersPaiements = Array.isArray(
            data?.derniers_paiements
        )
            ? data.derniers_paiements
            : [];

        derniersPaiements.forEach((paiement) => {
            const patient = getPatientName(
                paiement.patient
            );

            const date =
                paiement.created_at ||
                paiement.updated_at ||
                paiement.date_paiement ||
                null;

            dynamicActivities.push({
                id: `paiement-${paiement.id}`,

                type: "paiement",

                title: "Paiement enregistré",

                desc: `${patient} - ${formatMoney(
                    paiement.montant || 0
                )}`,

                time: formatRelativeDate(date),

                date,
            });
        });

        const uniqueActivities =
            dynamicActivities.filter(
                (activity, index, array) =>
                    index ===
                    array.findIndex(
                        (item) =>
                            item.id === activity.id
                    )
            );

        uniqueActivities.sort((a, b) => {
            const dateA = a.date
                ? new Date(a.date).getTime()
                : 0;

            const dateB = b.date
                ? new Date(b.date).getTime()
                : 0;

            return dateB - dateA;
        });

        return uniqueActivities.slice(0, 8);
    };

    // =====================================================
    // CHARGEMENT API
    // =====================================================

    const chargerDashboard = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const token = localStorage.getItem("token");

            if (!token) {
                setError(
                    "Aucun token trouvé. Veuillez vous connecter."
                );
                return;
            }

            const response = await api.get(
                "/api/admin/dashboard"
            );

            console.log(
                "Dashboard API :",
                response.data
            );

            if (!response.data?.success) {
                setError(
                    response.data?.message ||
                        "Impossible de charger le dashboard."
                );
                return;
            }

            const data = response.data;

            setStats({
                medecins:
                    data.stats?.medecins ?? 0,

                patients:
                    data.stats?.patients ?? 0,

                rendez_vous:
                    data.stats?.rendez_vous ?? 0,

                revenus:
                    data.stats?.revenus ?? 0,
            });

            setRendezVous(
                Array.isArray(
                    data.derniers_rendez_vous
                )
                    ? data.derniers_rendez_vous
                    : []
            );

            setActivities(
                generateActivities(data)
            );

            if (data.chart || data.charts) {
                setChartData(
                    data.chart || data.charts
                );
            }
        } catch (err) {
            console.error(
                "Erreur Dashboard :",
                err
            );

            if (err.response?.status === 401) {
                setError(
                    "Session expirée ou token invalide. Veuillez vous reconnecter."
                );
            } else if (
                err.response?.status === 404
            ) {
                setError(
                    "API Dashboard introuvable. Vérifiez /api/admin/dashboard."
                );
            } else {
                setError(
                    err.response?.data?.message ||
                        "Impossible de contacter l'API Laravel."
                );
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        chargerDashboard();
    }, []);

    // =====================================================
    // CARTES
    // =====================================================

    const cards = [
        {
            title: "Médecins",
            value: formatNumber(stats.medecins),
            icon: Stethoscope,
            description: "1 médecin par cabinet ",
            link: "/admin/doctors",
            iconClass:
                "bg-blue-50 text-blue-700",
        },

        {
            title: "Patients",
            value: formatNumber(stats.patients),
            icon: Users,
            description: "Patients enregistrés",
            link: "/admin/patients",
            iconClass:
                "bg-emerald-50 text-emerald-700",
        },

        {
            title: "Rendez-vous",
            value: formatNumber(
                stats.rendez_vous
            ),
            icon: CalendarCheck,
            description:
                "Rendez-vous enregistrés",
            link: "/admin/rdv",
            iconClass:
                "bg-violet-50 text-violet-700",
        },

        {
            title: "Revenus",
            value: formatMoney(
                stats.revenus
            ),
            icon: CreditCard,
            description:
                "Revenus enregistrés",
            link: "/admin/payments",
            iconClass:
                "bg-amber-50 text-amber-700",
        },
    ];

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="w-full min-h-full bg-slate-50 space-y-6">
                {/* Skeleton en-tête */}
                <div className="rounded-lg bg-white border border-slate-200 h-28 animate-pulse" />

                {/* Skeleton cartes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    {[0, 1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="rounded-lg border border-slate-200 bg-white p-5 space-y-4 animate-pulse"
                        >
                            <div className="w-12 h-12 rounded-lg bg-slate-200" />
                            <div className="space-y-2">
                                <div className="h-3 w-24 bg-slate-200 rounded" />
                                <div className="h-8 w-32 bg-slate-200 rounded" />
                                <div className="h-3 w-20 bg-slate-200 rounded" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Skeleton graphiques */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-6 h-80 animate-pulse" />
                    <div className="rounded-lg border border-slate-200 bg-white p-6 h-80 animate-pulse" />
                </div>
            </div>
        );
    }

    // =====================================================
    // INTERFACE
    // =====================================================

    return (
        <div className="w-full min-h-full bg-slate-50 space-y-6">
            {/* BANNIÈRE DE BIENVENUE */}
            {/* ================================================= */}

            <section className="banniere-admin-pleine-largeur rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px]">

                <div className="flex items-center gap-4">

                    

                    <div>

                        <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                            Bonjour, {adminIdentity.name}
                        </h1>

                        <p className="text-blue-100 text-sm mt-0.5">
                            Voici la vue d'ensemble de votre
                            plateforme médicale et de son activité
                            aujourd'hui.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">

                   

                   

                   
                </div>
            </section>

            {/* ================================================= */}
            {/* ERREUR */}
            {/* ================================================= */}

            {error && (
                <div className="rounded-lg border border-[#E4CBCC] bg-[#F8EFEF] p-5">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-md bg-white text-[#7A2E33] flex items-center justify-center shrink-0">
                            <AlertCircle size={20} />
                        </div>

                        <div className="flex-1">
                            <p className="font-extrabold text-[#4E2024]">
                                Erreur de connexion à
                                l'API
                            </p>

                            <p className="text-sm text-[#7A2E33] mt-1">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    chargerDashboard()
                                }
                                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[#7A2E33] hover:bg-[#642529] text-white rounded-md text-xs font-bold"
                            >
                                <RefreshCw size={14} />
                                Réessayer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================================================= */}
            {/* STATISTIQUES */}
            {/* ================================================= */}

            <section>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-sans text-blue-900">
                            Vue d'ensemble
                        </h2>

                        <p className="text-xs text-[#A39A89] mt-1">
                            Indicateurs principaux de la
                            plateforme
                        </p>
                    </div>

                    
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    {cards.map((card, index) => (
                        <StatCard
                            key={card.title}
                            {...card}
                            delay={index * 60}
                        />
                    ))}
                </div>
            </section>

            {/* ================================================= */}
            {/* GRAPHIQUES */}
            {/* ================================================= */}

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                <div className="xl:col-span-2">
                    <EvolutionChart
                        chartData={chartData}
                    />
                </div>

                <StatutDonutChart
                    rendezVous={rendezVous}
                />
            </section>

            {/* ================================================= */}
            {/* RDV + ACTIVITÉS */}
            {/* ================================================= */}

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* ================================================= */}
                {/* RENDEZ-VOUS */}
                {/* ================================================= */}

                <div className="xl:col-span-2 bg-white border border-slate-200 rounded-lg shadow-[0_1px_2px_rgba(28,27,25,0.06)] overflow-hidden">

                    <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                        <div className="flex items-center gap-3">

                            <div className="w-11 h-11 rounded-lg bg-[#EEF2F6] text-[#3B82F6] flex items-center justify-center">
                                <CalendarCheck size={20} />
                            </div>

                            <div>
                                <h2 className="font-sans text-blue-900">
                                    Derniers rendez-vous
                                </h2>

                                <p className="text-xs text-[#A39A89] mt-0.5">
                                    Les rendez-vous les plus
                                    récents
                                </p>
                            </div>
                        </div>

                        <Link
                            to="/admin/rdv"
                            className="group inline-flex items-center gap-1 text-xs font-extrabold text-[#1E40AF] hover:text-[#1E40AF] transition-colors"
                        >
                            Tout voir
                            <ChevronRight
                                size={15}
                                className="group-hover:translate-x-0.5 transition-transform"
                            />
                        </Link>
                    </div>

                    {rendezVous.length === 0 ? (
                        <div className="py-16 text-center">

                            <div className="w-14 h-14 mx-auto rounded-lg bg-slate-200 text-[#A39A89] flex items-center justify-center">
                                <CalendarCheck size={27} />
                            </div>

                            <p className="mt-4 font-bold text-[#4A453D]">
                                Aucun rendez-vous
                            </p>

                            <p className="text-xs text-[#A39A89] mt-1">
                                Les prochains rendez-vous
                                apparaîtront ici.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[700px]">

                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200">

                                        <th className="px-6 py-4 text-left text-[10px] tracking-wide font-extrabold text-[#A39A89]">
                                            Patient
                                        </th>

                                        <th className="px-6 py-4 text-left text-[10px] tracking-wide font-extrabold text-[#A39A89]">
                                            Médecin
                                        </th>

                                        <th className="px-6 py-4 text-left text-[10px] tracking-wide font-extrabold text-[#A39A89]">
                                            Date
                                        </th>

                                        <th className="px-6 py-4 text-left text-[10px] tracking-wide font-extrabold text-[#A39A89]">
                                            Statut
                                        </th>

                                    </tr>
                                </thead>

                                <tbody>
                                    {rendezVous
                                        .slice(0, 5)
                                        .map(
                                            (
                                                rdv,
                                                index
                                            ) => {

                                                const status =
                                                    getStatus(
                                                        rdv.statut
                                                    );

                                                const StatusIcon =
                                                    status.icon;

                                                const patient =
                                                    getPatientName(
                                                        rdv.patient
                                                    );

                                                return (
                                                    <tr
                                                        key={
                                                            rdv.id ||
                                                            index
                                                        }
                                                        className="border-b border-slate-200 last:border-0 hover:bg-slate-50 transition"
                                                    >

                                                        <td className="px-6 py-4">

                                                            <div className="flex items-center gap-3">

                                                                <div
                                                                    className={`w-10 h-10 rounded-md bg-gradient-to-br ${
                                                                        AVATAR_GRADIENTS[
                                                                            index %
                                                                            AVATAR_GRADIENTS.length
                                                                        ]
                                                                    } text-white flex items-center justify-center text-xs font-black shadow-[0_1px_2px_rgba(28,27,25,0.06)]`}
                                                                >
                                                                    {getInitials(
                                                                        patient
                                                                    )}
                                                                </div>

                                                                <div>

                                                                    <p className="font-bold text-sm text-[#2A2825]">
                                                                        {patient}
                                                                    </p>

                                                                    <p className="text-[11px] text-[#A39A89]">
                                                                        Patient
                                                                    </p>

                                                                </div>

                                                            </div>

                                                        </td>

                                                        <td className="px-6 py-4">

                                                            <div className="flex items-center gap-2 text-sm text-[#2A2825]">

                                                                <Stethoscope
                                                                    size={15}
                                                                    className="text-[#2563EB]"
                                                                />

                                                                Dr.{" "}
                                                                {getMedecinName(
                                                                    rdv.medecin
                                                                )}

                                                            </div>

                                                        </td>

                                                        <td className="px-6 py-4">

                                                            <div className="flex items-center gap-2 text-sm text-[#4A453D]">

                                                                <Clock
                                                                    size={14}
                                                                    className="text-[#A39A89]"
                                                                />

                                                                <div className="leading-tight">
                                                                    {formatDate(
                                                                        rdv.date_rendez_vous ||
                                                                            rdv.date ||
                                                                            rdv.date_rdv ||
                                                                            rdv.date_appointment
                                                                    )}

                                                                    {rdv.heure_rdv && (
                                                                        <span className="block text-[11px] text-[#A39A89] font-semibold">
                                                                            {rdv.heure_rdv}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                            </div>

                                                        </td>

                                                        <td className="px-6 py-4">

                                                            <span
                                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold ${status.className}`}
                                                            >

                                                                <StatusIcon
                                                                    size={13}
                                                                />

                                                                {status.label}

                                                            </span>

                                                        </td>

                                                    </tr>
                                                );
                                            }
                                        )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ================================================= */}
                {/* ACTIVITÉS */}
                {/* ================================================= */}

                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-[0_1px_2px_rgba(28,27,25,0.06)]">

                    <div className="flex items-center justify-between mb-6">

                        <div className="flex items-center gap-3">

                            <div className="w-11 h-11 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center">
                                <Zap size={20} />
                            </div>

                            <div>
                                <h2 className="font-sans text-blue-900">
                                    Activité récente
                                </h2>

                                <p className="text-xs text-[#A39A89] mt-0.5">
                                    Dernières actions
                                </p>
                            </div>

                        </div>

                        <span className="text-[11px] font-extrabold bg-slate-200 text-[#4A453D] px-3 py-1.5 rounded-full">
                            {activities.length}
                        </span>

                    </div>

                    {activities.length === 0 ? (
                        <div className="py-10 text-center">

                            <Activity
                                size={32}
                                className="mx-auto text-[#C7BEAC]"
                            />

                            <p className="mt-4 font-bold text-[#4A453D]">
                                Aucune activité
                            </p>

                            <p className="text-xs text-[#A39A89] mt-1">
                                Les nouvelles activités
                                apparaîtront ici.
                            </p>

                        </div>
                    ) : (
                        <div className="relative">

                            <div className="absolute left-5 top-5 bottom-5 w-px bg-gradient-to-b from-[#E2E8F0] via-[#CBD5E1] to-transparent" />

                            <div className="space-y-5">

                                {activities.map(
                                    (
                                        activity,
                                        index
                                    ) => {

                                        let Icon = Activity;

                                        let iconClass =
                                            "bg-[#EEF2F6] text-[#3B82F6]";

                                        if (
                                            activity.type ===
                                            "rdv"
                                        ) {
                                            Icon =
                                                CalendarCheck;

                                            iconClass =
                                                "bg-[#EEF2F6] text-[#3B82F6]";
                                        }

                                        if (
                                            activity.type ===
                                            "paiement"
                                        ) {
                                            Icon =
                                                CreditCard;

                                            iconClass =
                                                "bg-[#EEF4F1] text-[#059669]";
                                        }

                                        return (
                                            <div
                                                key={
                                                    activity.id ||
                                                    index
                                                }
                                                className="relative flex gap-3 group"
                                            >

                                                <div
                                                    className={`relative z-10 w-10 h-10 shrink-0 rounded-md flex items-center justify-center ${iconClass} group-hover:scale-110 transition-transform duration-200`}
                                                >
                                                    <Icon size={17} />
                                                </div>

                                                <div className="min-w-0 flex-1 pt-0.5">

                                                    <div className="flex items-start justify-between gap-2">

                                                        <p className="text-sm font-bold text-[#2A2825]">
                                                            {activity.title}
                                                        </p>

                                                        <span className="text-[10px] text-[#A39A89] whitespace-nowrap">
                                                            {activity.time}
                                                        </span>

                                                    </div>

                                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                        {activity.desc}
                                                    </p>

                                                </div>

                                            </div>
                                        );
                                    }
                                )}

                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Animations globales */}
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

        </div>
    );
}
