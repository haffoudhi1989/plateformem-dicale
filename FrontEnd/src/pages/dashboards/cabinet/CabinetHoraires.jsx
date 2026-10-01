import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Clock,
    AlertCircle,
    Plus,
    Trash2,
    CheckCircle2,
    XCircle,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const JOURS = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
];

export default function CabinetHoraires() {
    const navigate = useNavigate();
    const [horaires, setHoraires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [cabinetId, setCabinetId] = useState(null);

    const [form, setForm] = useState({
        jour: "Lundi",
        heure_ouverture: "08:00",
        heure_fermeture: "17:00",
    });

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

        const id = user?.cabinet_id;

        if (!id) {
            setError("Aucun cabinet associé à ce compte.");
            setLoading(false);
            return;
        }

        setCabinetId(id);
        chargerHoraires(token, id);
    }, [navigate]);

    const chargerHoraires = async (token, id) => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/horaires`, {
                params: { cabinet_id: id },
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });
            setHoraires(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
            } else {
                setError(
                    err.response?.data?.message ||
                        "Impossible de charger les horaires."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const token = () =>
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    const ajouter = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            await axios.post(
                `${API_URL}/horaires`,
                {
                    cabinet_id: cabinetId,
                    jour: form.jour,
                    heure_ouverture: form.heure_ouverture,
                    heure_fermeture: form.heure_fermeture,
                    actif: true,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token()}`,
                        Accept: "application/json",
                    },
                }
            );
            setMessage(`Horaire du ${form.jour} ajouté avec succès.`);
            setForm((f) => ({ ...f }));
            chargerHoraires(token(), cabinetId);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Impossible d'ajouter l'horaire."
            );
        }
    };

    const toggleActif = async (horaire) => {
        try {
            await axios.put(
                `${API_URL}/horaires/${horaire.id}`,
                { actif: !horaire.actif },
                {
                    headers: {
                        Authorization: `Bearer ${token()}`,
                        Accept: "application/json",
                    },
                }
            );
            chargerHoraires(token(), cabinetId);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Impossible de modifier l'horaire."
            );
        }
    };

    const supprimer = async (horaire) => {
        if (!window.confirm(`Supprimer l'horaire du ${horaire.jour} ?`)) {
            return;
        }
        try {
            await axios.delete(`${API_URL}/horaires/${horaire.id}`, {
                headers: {
                    Authorization: `Bearer ${token()}`,
                    Accept: "application/json",
                },
            });
            chargerHoraires(token(), cabinetId);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Impossible de supprimer l'horaire."
            );
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-700 shadow-lg p-3 md:p-4 mb-4 flex items-center gap-3">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <Clock size={24} className="text-white" />
                </div>
                <div className="min-w-0">
                    <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider">Espace Cabinet · Horaires</p>
                    <h1 className="text-lg md:text-xl font-bold text-white mt-0.5 truncate">Horaires d'ouverture</h1>
                    <p className="text-orange-100/80 text-sm mt-0.5">Jours et plages horaires du cabinet</p>
                </div>
            </div>

            {message && (
                <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                    <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{message}</p>
                </div>
            )}

            {error && (
                <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="grid lg:grid-cols-5 gap-6">
                {/* Formulaire */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-fit">
                    <h2 className="font-bold text-slate-900 mb-4">
                        Ajouter un horaire
                    </h2>
                    <form onSubmit={ajouter} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Jour
                            </label>
                            <select
                                value={form.jour}
                                onChange={(e) =>
                                    setForm({ ...form, jour: e.target.value })
                                }
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                            >
                                {JOURS.map((j) => (
                                    <option key={j} value={j}>
                                        {j}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    Ouverture
                                </label>
                                <input
                                    type="time"
                                    value={form.heure_ouverture}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            heure_ouverture: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    Fermeture
                                </label>
                                <input
                                    type="time"
                                    value={form.heure_fermeture}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            heure_fermeture: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                        >
                            <Plus size={16} />
                            Ajouter
                        </button>
                    </form>
                </div>

                {/* Liste */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
                        </div>
                    ) : horaires.length === 0 ? (
                        <div className="p-12 text-center">
                            <Clock size={32} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-500 font-medium">
                                Aucun horaire défini pour le moment.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {horaires.map((h) => (
                                <li
                                    key={h.id}
                                    className="flex items-center gap-3 px-5 py-4"
                                >
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-800">
                                            {h.jour}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {h.heure_ouverture
                                                ? String(h.heure_ouverture).slice(0, 5)
                                                : "—"}{" "}
                                            –{" "}
                                            {h.heure_fermeture
                                                ? String(h.heure_fermeture).slice(0, 5)
                                                : "—"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => toggleActif(h)}
                                        className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full border transition-colors cursor-pointer ${
                                            h.actif
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                                        }`}
                                    >
                                        {h.actif ? (
                                            <CheckCircle2 size={13} />
                                        ) : (
                                            <XCircle size={13} />
                                        )}
                                        {h.actif ? "Ouvert" : "Fermé"}
                                    </button>
                                    <button
                                        onClick={() => supprimer(h)}
                                        className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                        aria-label={`Supprimer ${h.jour}`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
