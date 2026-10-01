import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Building2,
    MapPin,
    Phone,
    Mail,
    Stethoscope,
    ClipboardList,
    Users,
    CalendarDays,
    Info,
    AlertCircle,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

export default function CabinetApropos() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");

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
            })
            .catch((err) => {
                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login");
                } else {
                    setError(
                        err.response?.data?.message ||
                            "Impossible de charger la présentation du cabinet."
                    );
                }
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    const cabinet = data?.cabinet;
    const stats = data?.stats;

    const specialites = useMemo(() => {
        const noms = (cabinet?.medecins || [])
            .map((medecin) => medecin.specialite?.nom)
            .filter(Boolean);

        return [...new Set(noms)];
    }, [cabinet]);

    const coordonnees = [
        { icon: MapPin, label: "Adresse", value: cabinet?.adresse },
        { icon: Phone, label: "Téléphone", value: cabinet?.telephone },
        { icon: Mail, label: "Email", value: cabinet?.email },
    ];

    const effectifs = [
        { icon: Stethoscope, label: "Médecin", value: stats?.medecins ?? 0 },
        { icon: ClipboardList, label: "Secrétaires", value: stats?.secretaires ?? 0 },
        { icon: Users, label: "Patients", value: stats?.patients ?? 0 },
    ];

    const features = [
        {
            icon: CalendarDays,
            title: "Agenda & rendez-vous",
            description:
                "Prise et suivi des rendez-vous en temps réel, gestion des disponibilités et petits rappels tout doux.",
        },
        {
            icon: Users,
            title: "Dossiers & patients",
            description:
                "Accès sécurisé à l'historique médical, aux ordonnances et aux infos de contact, bien rangés.",
        },
    ];

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

    return (
        <div>
            {/* ===================== Cadre d'en-tête ===================== */}
            <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-700 shadow-lg p-3 md:p-4 mb-4 flex items-center gap-3">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <Building2 size={24} className="text-white" />
                </div>
                <div className="min-w-0">
                    <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider">Espace Cabinet · À propos</p>
                    <h1 className="text-lg md:text-xl font-bold text-white mt-0.5 truncate">{cabinet?.nom || "Cabinet médical"}</h1>
                    <p className="text-orange-100/80 text-sm mt-0.5">
                        {cabinet?.description ||
                            "Vue d'ensemble de votre établissement"}
                    </p>
                </div>
            </div>

            {/* ===================== Le cabinet en bref ===================== */}
            <section className="bg-white rounded-md border border-[#E7E1D5] p-6 shadow-[0_1px_3px_rgba(28,27,25,0.06)] mb-5">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-[#EEF2F6] rounded-xl flex items-center justify-center">
                        <Building2 size={20} className="text-[#92400E]" />
                    </div>
                    <div>
                        <h2 className="font-bold text-[#1C1B19]">
                            Le cabinet en bref
                        </h2>
                        <p className="text-sm text-[#A39A89]">
                            Coordonnées et effectifs
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {coordonnees.map(({ icon: Icon, label, value }) => (
                        <div
                            key={label}
                            className="flex items-start gap-3 rounded-md border border-[#E7E1D5] bg-[#F6F3EE] p-4"
                        >
                            <div className="w-9 h-9 bg-[#EEF2F6] rounded-xl flex items-center justify-center shrink-0">
                                <Icon size={17} className="text-[#92400E]" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#A39A89]">
                                    {label}
                                </p>
                                <p className="mt-0.5 text-sm font-semibold text-[#2A2825] break-words">
                                    {value || "Non renseigné"}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-5 pt-5 border-t border-[#EDE8DD] grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {effectifs.map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#EEF2F6] rounded-xl flex items-center justify-center shrink-0">
                                <Icon size={18} className="text-[#92400E]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[#92400E] tabular-nums leading-none">
                                    {value}
                                </p>
                                <p className="mt-1 text-xs text-[#A39A89]">
                                    {label}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ===================== Spécialités ===================== */}
            {specialites.length > 0 && (
                <section className="bg-white rounded-md border border-[#E7E1D5] p-6 shadow-[0_1px_3px_rgba(28,27,25,0.06)] mb-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-[#EEF2F6] rounded-xl flex items-center justify-center">
                            <Stethoscope size={20} className="text-[#92400E]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-[#1C1B19]">
                                Spécialités
                            </h2>
                            <p className="text-sm text-[#A39A89]">
                                {specialites.length} spécialité
                                {specialites.length > 1 ? "s" : ""} représentée
                                {specialites.length > 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {specialites.map((specialite) => (
                            <span
                                key={specialite}
                                className="rounded-full border border-[#DDE5EC] bg-[#EEF2F6] px-3 py-1.5 text-xs font-semibold text-[#92400E]"
                            >
                                {specialite}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {/* ===================== Mission ===================== */}
            <section className="bg-white rounded-md border border-[#E7E1D5] p-6 shadow-[0_1px_3px_rgba(28,27,25,0.06)] mb-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[#EEF2F6] rounded-xl flex items-center justify-center">
                        <Info size={20} className="text-[#92400E]" />
                    </div>
                    <div>
                        <h2 className="font-bold text-[#1C1B19]">
                            Notre mission
                        </h2>
                        <p className="text-sm text-[#A39A89]">
                            Simplifier le quotidien des soignants et de leurs patients
                        </p>
                    </div>
                </div>

                <p className="max-w-3xl text-sm text-[#8C8577] leading-relaxed">
                    MedPlatform centralise la gestion des cabinets médicaux, la
                    planification des rendez-vous et le suivi des dossiers patients
                    dans une interface unique, fluide et rassurante.
                </p>
            </section>

            {/* ===================== Fonctionnalités ===================== */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                {features.map(({ icon: Icon, title, description }) => (
                    <div
                        key={title}
                        className="bg-white rounded-md border border-[#E7E1D5] p-6 shadow-[0_1px_3px_rgba(28,27,25,0.06)]"
                    >
                        <div className="w-12 h-12 bg-[#EEF2F6] rounded-xl flex items-center justify-center mb-4">
                            <Icon size={22} className="text-[#92400E]" />
                        </div>
                        <h3 className="font-bold text-[#1C1B19] mb-1.5">
                            {title}
                        </h3>
                        <p className="text-sm text-[#A39A89] leading-relaxed">
                            {description}
                        </p>
                    </div>
                ))}
            </section>
        </div>
    );
}
