import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Stethoscope,
    Phone,
    Mail,
    AlertCircle,
    User,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

export default function CabinetMedecins() {
    const navigate = useNavigate();
    const [medecins, setMedecins] = useState([]);
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
            .get(`${API_URL}/medecins`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            })
            .then((res) => setMedecins(res.data?.data || []))
            .catch((err) => {
                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login");
                } else {
                    setError(
                        err.response?.data?.message ||
                            "Impossible de charger les médecins."
                    );
                }
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    const initiales = (m) =>
        `${(m.prenom || "?")[0]}${(m.nom || "?")[0]}`.toUpperCase();

    return (
        <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-700 shadow-lg p-3 md:p-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 shrink-0 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                            <Stethoscope size={24} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider">Espace Cabinet · Équipe médicale</p>
                            <h1 className="text-lg md:text-xl font-bold text-white mt-0.5 truncate">Médecin du cabinet</h1>
                            <p className="text-orange-100/80 text-sm mt-0.5">
                                {medecins.length === 0
                                    ? "Aucun médecin rattaché"
                                    : "1 médecin (un seul par cabinet)"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full" />
                </div>
            ) : error ? (
                <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                </div>
            ) : medecins.length === 0 ? (
                <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center">
                    <User size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">
                        Aucun médecin rattaché à ce cabinet.
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {medecins.map((m) => (
                        <div
                            key={m.id}
                            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-11 h-11 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-sm">
                                    {initiales(m)}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-900 truncate">
                                        Dr {m.prenom} {m.nom}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium">
                                        {m.specialite?.nom || "Généraliste"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <p className="flex items-center gap-2 text-slate-600">
                                    <Phone size={14} className="text-slate-400" />
                                    {m.telephone || "—"}
                                </p>
                                <p className="flex items-center gap-2 text-slate-600 truncate">
                                    <Mail size={14} className="text-slate-400" />
                                    {m.email || "—"}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
