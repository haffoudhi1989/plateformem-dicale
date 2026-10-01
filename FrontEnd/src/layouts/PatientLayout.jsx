import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import LogoPlateforme from "../components/LogoPlateforme";
import {
    CalendarDays,
    Pill,
    FlaskConical,
    User,
    Home,
    LogOut,
    ChevronRight,
    Stethoscope,
    Video,
    Bell,
    MessageCircle,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

/* Menu identique à celui du dashboard patient */
const NAV = [
    { to: "/patient/dashboard", label: "Accueil", icon: Home, end: true },
    { to: "/patient/notifications", label: "Notifications", icon: Bell },
    { to: "/patient/medecins", label: "Mes médecins", icon: Stethoscope },
    { to: "/patient/rendez-vous", label: "Mes rendez-vous", icon: CalendarDays },
    { to: "/patient/consultations-video", label: "Consultations vidéo", icon: Video },
    { to: "/patient/ordonnances", label: "Mes ordonnances", icon: Pill },
    { to: "/patient/analyses", label: "Mes analyses", icon: FlaskConical },
    { to: "/patient/messages", label: "Messagerie", icon: MessageCircle },
    { to: "/patient/profil", label: "Mon profil", icon: User },
];

export default function PatientLayout() {
    const navigate = useNavigate();

    const rawUser = localStorage.getItem("user") || sessionStorage.getItem("user") || "{}";
    let user = {};
    try {
        user = JSON.parse(rawUser);
    } catch {
        user = {};
    }

    /*
     * Nom du patient affiché dans la bannière de toutes les pages.
     *
     * Un compte patient n'a que « name » dans la session (pas de « prenom »
     * ni « nom ») : la bannière affichait donc « Patient » partout. On
     * complète avec la fiche patient (table patients, liée par e-mail),
     * récupérée via /profil, puis on met la session à jour pour que les
     * autres écrans (avatar mobile…) utilisent le même nom.
     */
    const [nomPatient, setNomPatient] = useState(() =>
        `${user?.prenom || ""} ${user?.nom || ""}`.trim() || user?.name || ""
    );

    // Bannière d'accueil (même cadre que les autres espaces)
    const nowB = new Date();
    const hourB = nowB.getHours();
    const greetingB = hourB < 12 ? "Bonjour" : hourB < 18 ? "Bon après-midi" : "Bonsoir";
    const fullNameB = nomPatient.trim() || "Patient";
    const dateB = nowB.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    const initial = (nomPatient.trim().charAt(0) || "P").toUpperCase();

    /* Nom complet du patient (fiche patients) pour la bannière et la session. */
    useEffect(() => {
        let actif = true;

        const chargerNomPatient = async () => {
            try {
                const token =
                    localStorage.getItem("token") || sessionStorage.getItem("token");

                if (!token) return;

                const { data } = await axios.get(`${API_URL}/profil`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                });

                const profil = data?.data || data || {};
                const complet = `${profil.prenom || ""} ${profil.nom || ""}`.trim();

                if (!actif || !complet) return;

                setNomPatient(complet);

                const session = {
                    ...user,
                    prenom: profil.prenom ?? null,
                    nom: profil.nom ?? null,
                    name: complet,
                };

                [localStorage, sessionStorage].forEach((stockage) => {
                    if (stockage.getItem("user")) {
                        stockage.setItem("user", JSON.stringify(session));
                    }
                });
            } catch {
                /* silencieux : on garde le nom de la session */
            }
        };

        chargerNomPatient();

        return () => {
            actif = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Masque le sous-titre « Espace patient » au-dessus des titres
    // (Analyses, Ordonnances, Profil — fichiers non modifiables par permissions)
    useEffect(() => {
        const t = setTimeout(() => {
            document.querySelectorAll("main p").forEach((el) => {
                if (el.textContent && el.textContent.trim() === "Espace patient") {
                    el.style.display = "none";
                }
            });
        }, 0);
        return () => clearTimeout(t);
    }, []);

    const logout = async () => {
        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            await axios.post(`${API_URL}/logout`, {}, {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            });
        } catch (error) {
            console.error(error);
        }
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("space");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("space");
        navigate("/login");
    };

    const desktopLinkClass = ({ isActive }) =>
        `relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors duration-200 group ${
            isActive
                ? "bg-[#EEF2F6] text-blue-700 font-semibold"
                : "text-[#4A453D] hover:bg-[#EDE8DD] hover:text-[#1C1B19]"
        }`;

    const mobileLinkClass = ({ isActive }) =>
        `flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
            isActive
                ? "bg-[#26415E] text-white shadow-[0_1px_3px_rgba(28,27,25,0.06)]"
                : "bg-white border border-[#E7E1D5] text-[#4A453D] hover:bg-[#EDE8DD]"
        }`;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Uniformisation des pages patient (même style que les autres espaces) */}
            <style>{`
                main .mx-auto.px-6.py-10 {
                    max-width: 80rem; /* max-w-7xl */
                    padding-left: 2rem;
                    padding-right: 2rem;
                }
                main h1 {
                    color: #1C1B19;
                }
                /* Thème patient : bleu -> rouge/rose (Analyses, Ordonnances…) */
                main .bg-sky-50 { background-color: #fff1f2; }
                main .bg-sky-500 { background-color: #f43f5e; }
                main .bg-sky-600 { background-color: #e11d48; }
                main .hover\\:bg-sky-700:hover { background-color: #be123c; }
                main .text-sky-700 { color: #be123c; }
                main .text-sky-600 { color: #e11d48; }
                main .text-sky-300 { color: #fda4af; }
                main .border-sky-100 { border-color: #ffe4e6; }
                main .border-sky-200 { border-color: #fecdd3; }
                main .border-sky-500 { border-color: #f43f5e; }
                main .hover\\:border-sky-200:hover { border-color: #fecdd3; }
                main .border-blue-100 { border-color: #ffe4e6; }
                main .border-blue-400 { border-color: #fb7185; }

                /* =====================================================
                   BARRE DE DÉFILEMENT DU MENU
                   -----------------------------------------------------
                   Même traitement que la barre de défilement du menu de
                   l'espace admin, aux couleurs du bandeau patient :
                     - bordeaux unique #881337 ;
                     - même liseré clair que border-white/20 ;
                     - angles légèrement arrondis (2px).
                   ===================================================== */

                .patient-sidebar-scroll::-webkit-scrollbar {
                    width: 10px;
                }

                .patient-sidebar-scroll::-webkit-scrollbar-track {
                    background: transparent;
                    border-radius: 2px;
                }

                .patient-sidebar-scroll::-webkit-scrollbar-thumb {
                    border-radius: 2px;
                    border: 1px solid rgba(255, 255, 255, 0.22);
                    background: #881337;
                    background-clip: padding-box;
                }

                .patient-sidebar-scroll::-webkit-scrollbar-thumb:hover {
                    background: #be123c;
                    background-clip: padding-box;
                }

                .patient-sidebar-scroll::-webkit-scrollbar-corner {
                    background: transparent;
                }

                /* Firefox (pas de prise en charge de ::-webkit-scrollbar) */
                @supports not selector(::-webkit-scrollbar) {
                    .patient-sidebar-scroll {
                        scrollbar-width: thin;
                        scrollbar-color: #881337 transparent;
                    }
                }
            `}</style>

            {/* SIDEBAR (desktop) */}
            <aside className="hidden lg:flex w-64 bg-white border-r border-[#E7E1D5] min-h-screen flex-col sticky top-0 h-screen shrink-0">
                {/* Logo (identique à la page de connexion) */}
                <div className="px-5 py-5 border-b border-[#EDE8DD]">
                    <LogoPlateforme />
                </div>

                {/* Navigation */}
                <nav className="px-3 flex-1 space-y-1 overflow-y-auto patient-sidebar-scroll">
                    {NAV.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={desktopLinkClass}
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-[#26415E]" />}
                                        <Icon size={19} className={isActive ? "text-[#26415E]" : "text-[#A39A89] group-hover:text-[#26415E]"} />
                                        <span className="text-sm">{item.label}</span>
                                        {isActive && <ChevronRight size={15} className="ml-auto text-blue-400" />}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-[#EDE8DD]">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#7A2E33] hover:bg-[#F8EFEF] transition-colors duration-200 group cursor-pointer"
                    >
                        <LogOut size={19} className="text-[#8C444A] group-hover:text-rose-500" />
                        <span className="text-sm font-medium">Déconnexion</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 min-w-0 flex flex-col">
                {/* BARRE MOBILE */}
                <div className="lg:hidden flex items-center justify-between px-1 mb-4 pt-4">
                    <LogoPlateforme variant="mobile" />
                    <div className="flex items-center gap-2">
                        <button
                            onClick={logout}
                            aria-label="Déconnexion"
                            className="w-9 h-9 flex items-center justify-center rounded-lg text-rose-500 hover:bg-[#F8EFEF] transition cursor-pointer"
                        >
                            <LogOut size={18} />
                        </button>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#26415E] to-[#26415E] text-white flex items-center justify-center font-bold text-sm">
                            {initial}
                        </div>
                    </div>
                </div>

                {/* NAVIGATION MOBILE */}
                <div className="lg:hidden px-4 mb-6 overflow-x-auto flex gap-2 pb-1">
                    {NAV.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={mobileLinkClass}
                            >
                                <Icon size={15} />
                                {item.label}
                            </NavLink>
                        );
                    })}
                </div>

                {/* Contenu de la page enfant */}
                <main className="flex-1 min-w-0">
                    {/* BANNIÈRE D'ACCUEIL */}
                    <section className="relative overflow-hidden rounded-lg bg-gradient-to-r from-rose-700 via-[#881337] to-[#881337] p-6 sm:p-8 text-white shadow-lg shadow-rose-200/60 mt-4 md:mt-6 mx-4 md:mx-8 mb-6">
                        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-white/10" />
                        <div className="absolute top-8 right-28 h-24 w-24 rounded-full bg-white/10" />
                        <div className="absolute -bottom-16 right-56 h-36 w-36 rounded-full bg-white/10" />
                        <div className="relative flex flex-wrap items-center justify-between gap-6">
                            <div>
                                <h1 className="mt-1 text-2xl sm:text-3xl font-bold">
                                    {greetingB}, {fullNameB}
                                </h1>
                                <p className="mt-2 flex items-center gap-2 text-sm text-rose-100">
                                    <CalendarDays size={15} />
                                    {dateB}
                                </p>
                            </div>
                        </div>
                    </section>

                    <Outlet />
                </main>
            </div>
        </div>
    );
}
