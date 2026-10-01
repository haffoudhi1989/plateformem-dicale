import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Users,
    Search,
    Phone,
    Mail,
    AlertCircle,
    User,
    Droplets,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const fmtDate = (d) => {
    if (!d) return "—";
    const dateOnly = String(d).split("T")[0];
    const parts = dateOnly.split("-");
    if (parts.length !== 3) return d;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export default function CabinetPatients() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

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
            .get(`${API_URL}/cabinets/${cabinetId}/patients`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            })
            .then((res) => setPatients(res.data?.data || []))
            .catch((err) => {
                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login");
                } else {
                    setError(
                        err.response?.data?.message ||
                            "Impossible de charger les patients."
                    );
                }
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    const filtres = useMemo(() => {
        const q = search.toLowerCase();
        return patients.filter((p) => {
            const name = `${p.prenom || ""} ${p.nom || ""}`.toLowerCase();
            const phone = (p.telephone || "").toLowerCase();
            return name.includes(q) || phone.includes(q);
        });
    }, [patients, search]);

    const initiales = (p) =>
        `${(p.prenom || "?")[0]}${(p.nom || "?")[0]}`.toUpperCase();

    return (
        <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-700 shadow-lg p-3 md:p-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 shrink-0 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                            <Users size={24} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider">Espace Cabinet · Patients</p>
                            <h1 className="text-lg md:text-xl font-bold text-white mt-0.5 truncate">Patients du cabinet</h1>
                            <p className="text-orange-100/80 text-sm mt-0.5">{patients.length} patient(s)</p>
                        </div>
                    </div>
                    <div className="relative w-full sm:w-72 shrink-0">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-100/70" />
                       
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
                </div>
            ) : error ? (
                <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                </div>
            ) : filtres.length === 0 ? (
                <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center">
                    <User size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">
                        Aucun patient trouvé.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[640px]">
                            <thead>
                                <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
                                    <th className="px-5 py-3 font-semibold">Patient</th>
                                    <th className="px-5 py-3 font-semibold">Naissance</th>
                                    <th className="px-5 py-3 font-semibold hidden md:table-cell">Contact</th>
                                    <th className="px-5 py-3 font-semibold hidden lg:table-cell">Groupe</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtres.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                                    {initiales(p)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">
                                                        {p.prenom} {p.nom}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {p.sexe || "—"} · {p.adresse || "—"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {fmtDate(p.date_naissance)}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600 hidden md:table-cell">
                                            <span className="flex items-center gap-2">
                                                <Phone size={14} className="text-slate-400" />
                                                {p.telephone || "—"}
                                            </span>
                                            <span className="flex items-center gap-2 mt-1">
                                                <Mail size={14} className="text-slate-400" />
                                                {p.email || "—"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 hidden lg:table-cell">
                                            {p.groupe_sanguin ? (
                                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                                    <Droplets size={12} />
                                                    {p.groupe_sanguin}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
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
