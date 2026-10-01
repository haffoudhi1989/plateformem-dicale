import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    CalendarDays,
    AlertCircle,
    User,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const STATUT_LABELS = {
    confirme: "Confirmé",
    en_attente: "En attente",
    annule: "Annulé",
    termine: "Terminé",
};

const STATUT_BADGES = {
    confirme: "bg-emerald-50 text-emerald-700 border-emerald-200",
    en_attente: "bg-amber-50 text-amber-700 border-amber-200",
    annule: "bg-rose-50 text-rose-700 border-rose-200",
    termine: "bg-sky-50 text-sky-700 border-sky-200",
};

const fmtDate = (d) => {
    if (!d) return "—";
    const parts = String(d).split("-");
    if (parts.length !== 3) return d;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const normStatut = (s) => (s || "").toLowerCase().replace(/\s+/g, "_");

const fmtHeure = (h) => (h ? String(h).slice(0, 5) : "—");

const dateISO = (d) => {
    const p = String(d || "").split(" ")[0].split("-");
    return p.length === 3 ? p.join("-") : "";
};

const aujourdHuiISO = () => {
    const t = new Date();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    const j = String(t.getDate()).padStart(2, "0");
    return `${t.getFullYear()}-${m}-${j}`;
};

export default function CabinetRendezVous() {
    const navigate = useNavigate();
    const [rdvs, setRdvs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [onglet, setOnglet] = useState("avenir");

    useEffect(() => {
        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        axios
            .get(`${API_URL}/rendez-vous`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            })
            .then((res) => setRdvs(res.data?.data || []))
            .catch((err) => {
                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login");
                } else {
                    setError(
                        err.response?.data?.message ||
                            "Impossible de charger les rendez-vous."
                    );
                }
            })
            .finally(() => setLoading(false));
    }, [navigate]);



    const iso = aujourdHuiISO();

    const liste = rdvs.filter((rdv) => {
        const d = dateISO(rdv.date_rdv);
        if (!d) return true;
        if (onglet === "aujourdhui") return d === iso;
        if (onglet === "avenir") return d >= iso;
        return true; // tous
    });

    const nbAujourdhui = rdvs.filter(
        (r) => dateISO(r.date_rdv) === iso
    ).length;
    const nbAvenir = rdvs.filter(
        (r) => dateISO(r.date_rdv) >= iso
    ).length;

    const ONGLETS = [
        { id: "aujourdhui", label: "Aujourd'hui", count: nbAujourdhui },
        { id: "avenir", label: "À venir", count: nbAvenir },
        { id: "tous", label: "Tous", count: rdvs.length },
    ];

    return (
        <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-700 shadow-lg p-3 md:p-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 shrink-0 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                            <CalendarDays size={24} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider">Espace Cabinet · Agenda</p>
                            <h1 className="text-lg md:text-xl font-bold text-white mt-0.5 truncate">Rendez-vous du cabinet</h1>
                            <p className="text-orange-100/80 text-sm mt-0.5">{rdvs.length} rendez-vous au total</p>
                        </div>
                    </div>
                </div>
            </div>

            {!loading && !error && (
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    {ONGLETS.map((o) => (
                        <button
                            key={o.id}
                            type="button"
                            onClick={() => setOnglet(o.id)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
                                onglet === o.id
                                    ? "bg-orange-600 border-orange-600 text-white shadow-sm"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-700"
                            }`}
                        >
                            {o.label}
                            <span
                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                    onglet === o.id
                                        ? "bg-white/20 text-white"
                                        : "bg-slate-100 text-slate-500"
                                }`}
                            >
                                {o.count}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
                </div>
            ) : error ? (
                <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                </div>
            ) : liste.length === 0 ? (
                <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center">
                    <User size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">
                        {onglet === "tous"
                            ? "Aucun rendez-vous enregistré."
                            : "Aucun rendez-vous pour cette période."}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[640px]">
                            <thead>
                                <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
                                    <th className="px-5 py-3 font-semibold">Patient</th>
                                    <th className="px-5 py-3 font-semibold">Médecin</th>
                                    <th className="px-5 py-3 font-semibold">Date</th>
                                    <th className="px-5 py-3 font-semibold">Heure</th>
                                    <th className="px-5 py-3 font-semibold">Motif</th>
                                    <th className="px-5 py-3 font-semibold">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {liste.map((rdv) => (
                                    <tr
                                        key={rdv.id}
                                        className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors"
                                    >
                                        <td className="px-5 py-4 font-semibold text-slate-800">
                                            {rdv.patient?.prenom} {rdv.patient?.nom}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            Dr {rdv.medecin?.prenom} {rdv.medecin?.nom}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {fmtDate(rdv.date_rdv)}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {fmtHeure(rdv.heure_rdv)}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600 max-w-[180px] truncate">
                                            {rdv.motif || "—"}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                                                    STATUT_BADGES[normStatut(rdv.statut)] ||
                                                    "bg-slate-50 text-slate-600 border-slate-200"
                                                }`}
                                            >
                                                {STATUT_LABELS[normStatut(rdv.statut)] || rdv.statut}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
