import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Users,
    Phone,
    Mail,
    AlertCircle,
    User,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

export default function CabinetSecretaires() {
    const navigate = useNavigate();
    const [secretaires, setSecretaires] = useState([]);
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

        let user = null;
        try {
            user = JSON.parse(
                localStorage.getItem("user") ||
                    sessionStorage.getItem("user")
            );
        } catch {
            user = null;
        }

        const cabinetId = user?.cabinet_id;

        if (!cabinetId) {
            setError("Aucun cabinet associé à ce compte.");
            setLoading(false);
            return;
        }

        axios
            .get(`${API_URL}/cabinets/${cabinetId}/secretaires`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            })
            .then((res) => setSecretaires(res.data?.data || []))
            .catch((err) => {
                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login");
                } else {
                    setError(
                        err.response?.data?.message ||
                            "Impossible de charger les secrétaires."
                    );
                }
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    const initiales = (s) =>
        `${(s.prenom || "?")[0]}${(s.nom || "?")[0]}`.toUpperCase();

    return (
        <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-700 shadow-lg p-3 md:p-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 shrink-0 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                            <Users size={24} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider">Espace Cabinet · Équipe</p>
                            <h1 className="text-lg md:text-xl font-bold text-white mt-0.5 truncate">Secrétaires du cabinet</h1>
                            <p className="text-orange-100/80 text-sm mt-0.5">{secretaires.length} secrétaire(s)</p>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full" />
                </div>
            ) : error ? (
                <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                </div>
            ) : secretaires.length === 0 ? (
                <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center">
                    <User size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">
                        Aucune secrétaire rattachée à ce cabinet.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
                                <th className="px-5 py-3 font-semibold">Secrétaire</th>
                                <th className="px-5 py-3 font-semibold hidden sm:table-cell">E-mail</th>
                                <th className="px-5 py-3 font-semibold hidden md:table-cell">Téléphone</th>
                                <th className="px-5 py-3 font-semibold">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {secretaires.map((s) => (
                                <tr
                                    key={s.id}
                                    className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors"
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs">
                                                {initiales(s)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">
                                                    {s.prenom} {s.nom}
                                                </p>
                                                <p className="text-xs text-slate-400 sm:hidden">
                                                    {s.email || "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-slate-600 hidden sm:table-cell">
                                        <span className="flex items-center gap-2">
                                            <Mail size={14} className="text-slate-400" />
                                            {s.email || "—"}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-slate-600 hidden md:table-cell">
                                        <span className="flex items-center gap-2">
                                            <Phone size={14} className="text-slate-400" />
                                            {s.telephone || "—"}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                                                s.actif
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                            }`}
                                        >
                                            {s.actif ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
