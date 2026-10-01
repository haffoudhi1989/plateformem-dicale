import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, Calendar, Mail, MapPin, Phone, RefreshCw, UserRound, Heart, Droplets, AlertTriangle, FileText, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

export default function PatientProfil() {
    const navigate = useNavigate();
    const [profil, setProfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadProfil = async () => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            setLoading(true);
            setError("");
            const response = await axios.get(`${API_URL}/profil`, {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            });
            setProfil(response.data?.data || response.data);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                navigate("/login");
                return;
            }
            setError(err.response?.data?.message || "Impossible de charger votre profil.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfil();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "Non renseigné";
        const date = new Date(dateString);
        return date.toLocaleDateString("fr-FR");
    };

    const initiales = () => {
        const prenom = profil?.prenom || "";
        const nom = profil?.nom || "";
        return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() || "P";
    };

    const personalDetails = [
        { label: "E-mail", value: profil?.email, icon: Mail },
        { label: "Téléphone", value: profil?.telephone, icon: Phone },
        { label: "Adresse", value: profil?.adresse, icon: MapPin },
        { label: "Date de naissance", value: profil?.date_naissance ? formatDate(profil.date_naissance) : null, icon: Calendar },
        { label: "Sexe", value: profil?.sexe, icon: User },
    ];

    const medicalDetails = [
        { label: "Groupe sanguin", value: profil?.groupe_sanguin, icon: Droplets },
        { label: "Allergies", value: profil?.allergies, icon: AlertTriangle },
        { label: "Maladies chroniques", value: profil?.maladies_chroniques, icon: Heart },
        { label: "Antécédents", value: profil?.antecedents, icon: FileText },
    ];

    return (
        <div className="bg-slate-50">
            <div className="max-w-4xl mx-auto px-6 py-10">
                {/* HEADER */}
                <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div>
                        <p className="text-sm text-slate-500">Espace patient</p>
                        <h1 className="text-2xl font-bold text-slate-900 mt-1">Mon profil</h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={loadProfil}
                            aria-label="Actualiser"
                            className="inline-flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                        >
                            <RefreshCw size={16} />
                        </button>
                        <button
                            onClick={() => navigate("/patient/dashboard")}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                        >
                            <ArrowLeft size={16} />
                            Dashboard
                        </button>
                    </div>
                </header>

                {loading && (
                    <div className="flex h-40 items-center justify-center">
                        <div className="text-center">
                            <div className="w-10 h-10 border-[3px] border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-sm text-slate-500">Chargement de votre profil...</p>
                        </div>
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
                        {error}
                    </div>
                )}

                {!loading && !error && profil && (
                    <div className="space-y-6">
                        {/* CARTE IDENTITÉ */}
                        <section className="flex items-center gap-5 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                            {profil.photo ? (
                                <img
                                    src={`http://127.0.0.1:8000/storage/${profil.photo}`}
                                    alt="Photo de profil"
                                    className="h-20 w-20 rounded-full object-cover shadow-md border-2 border-blue-100"
                                />
                            ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-600 to-indigo-600 text-2xl font-bold text-white shadow-md">
                                    {initiales()}
                                </div>
                            )}
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{profil.prenom} {profil.nom}</h2>
                                <p className="mt-1 text-sm text-slate-500 font-medium">Patient</p>
                            </div>
                        </section>

                        {/* INFORMATIONS PERSONNELLES */}
                        <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                            <h2 className="mb-4 text-lg font-bold text-slate-900">Informations personnelles</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                {personalDetails.map(({ label, value, icon: Icon }) => (
                                    <div key={label} className="flex gap-4 rounded-xl bg-slate-50 p-5 border border-slate-200 hover:border-rose-200 hover:bg-rose-50/50 transition duration-200">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm text-rose-600">
                                            <Icon size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                                            <p className="font-semibold text-slate-800 truncate">{value || "Non renseigné"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* INFORMATIONS MÉDICALES */}
                        <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                            <h2 className="mb-4 text-lg font-bold text-slate-900">Informations médicales</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                {medicalDetails.map(({ label, value, icon: Icon }) => (
                                    <div key={label} className="flex gap-4 rounded-xl bg-slate-50 p-5 border border-slate-200 hover:border-rose-200 hover:bg-rose-50/50 transition duration-200">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm text-rose-600">
                                            <Icon size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                                            <p className="font-semibold text-slate-800">{value || "Non renseigné"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                       
                    </div>
                )}
            </div>
        </div>
    );
}
