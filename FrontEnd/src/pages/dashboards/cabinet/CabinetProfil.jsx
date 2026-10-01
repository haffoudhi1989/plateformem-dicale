import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Building2,
    MapPin,
    Phone,
    Mail,
    AlertCircle,
    CheckCircle2,
    CreditCard,
    Loader2,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

export default function CabinetProfil() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        nom: "",
        adresse: "",
        telephone: "",
        email: "",
        description: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

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
            .get(`${API_URL}/cabinets/${cabinetId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            })
            .then((res) => {
                const c = res.data?.data;
                if (c) {
                    setForm({
                        nom: c.nom || "",
                        adresse: c.adresse || "",
                        telephone: c.telephone || "",
                        email: c.email || "",
                        description: c.description || "",
                    });
                }
            })
            .catch((err) => {
                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login");
                } else {
                    setError(
                        err.response?.data?.message ||
                            "Impossible de charger le profil du cabinet."
                    );
                }
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        setSaving(true);

        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        try {
            await axios.put(`${API_URL}/cabinet/profil`, form, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });
            setMessage("Profil du cabinet mis à jour avec succès.");
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
            } else {
                setError(
                    err.response?.data?.message ||
                        "Impossible d'enregistrer les modifications."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all";

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-700 shadow-lg p-3 md:p-4 mb-4 flex items-center gap-3">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <Building2 size={24} className="text-white" />
                </div>
                <div className="min-w-0">
                    <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider">Espace Cabinet · Profil</p>
                    <h1 className="text-lg md:text-xl font-bold text-white mt-0.5 truncate">Profil & abonnement</h1>
                    <p className="text-orange-100/80 text-sm mt-0.5">Informations du cabinet et plan d'abonnement</p>
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

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Formulaire */}
                <form
                    onSubmit={handleSubmit}
                    className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5"
                >
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Nom du cabinet *
                        </label>
                        <input
                            name="nom"
                            value={form.nom}
                            onChange={handleChange}
                            required
                            className={inputClass}
                            placeholder="Cabinet médical"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            <span className="inline-flex items-center gap-1.5">
                                <MapPin size={13} /> Adresse
                            </span>
                        </label>
                        <input
                            name="adresse"
                            value={form.adresse}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="12 rue des Médecins, 75001 Paris"
                        />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                <span className="inline-flex items-center gap-1.5">
                                    <Phone size={13} /> Téléphone
                                </span>
                            </label>
                            <input
                                name="telephone"
                                value={form.telephone}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="01 23 45 67 89"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                <span className="inline-flex items-center gap-1.5">
                                    <Mail size={13} /> E-mail
                                </span>
                            </label>
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="contact@cabinet.fr"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            className={`${inputClass} resize-none`}
                            placeholder="Présentation du cabinet, spécialités, services…"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm rounded-xl shadow-md shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Enregistrement…
                            </>
                        ) : (
                            "Enregistrer les modifications"
                        )}
                    </button>
                </form>

                {/* Abonnement */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
                    <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <CreditCard size={18} className="text-amber-500" />
                        Abonnement
                    </h2>

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4">
                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                            Plan actuel
                        </p>
                        <p className="text-xl font-bold text-slate-900 mt-1">
                            Plan Pro
                        </p>
                        <span className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Actif
                        </span>
                    </div>

                    <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2">
                            <CheckCircle2 size={15} className="text-emerald-500" />
                            Gestion du médecin et des secrétaires
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle2 size={15} className="text-emerald-500" />
                            Agenda et rendez-vous illimités
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle2 size={15} className="text-emerald-500" />
                            Statistiques et rapports
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle2 size={15} className="text-emerald-500" />
                            Notifications e-mail / SMS
                        </li>
                    </ul>

                    <p className="mt-4 text-xs text-slate-400 leading-relaxed">
                        La gestion des abonnements (plans, facturation,
                        renouvellement) sera disponible dans une prochaine
                        version de la plateforme.
                    </p>
                </div>
            </div>
        </div>
    );
}
