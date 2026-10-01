import React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import BadgeNonLus from "../components/BadgeNonLus";
import BlocageAbonnement, {
    useAbonnementCabinet,
} from "../components/BlocageAbonnement";
import LogoPlateforme from "../components/LogoPlateforme";
import PhotoProfil from "../components/PhotoProfil";
import { usePhotoProfilSecretaire } from "../services/profilSecretaire";
import axios from "axios";
import {
    CalendarDays,
    Users,
    MessageCircle,
    User,
    Home,
    LogOut,
    ChevronRight,
    UserPlus,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

/* Menu identique à celui du dashboard secrétaire */
const NAV = [
    { to: "/secretaire/dashboard", label: "Accueil", icon: Home, end: true },
    { to: "/secretaire/rendez-vous", label: "Rendez-vous & Planning", icon: CalendarDays },
    { label: "Gestion Patients", icon: Users, header: true },
    { to: "/secretaire/patients/ajouter", label: "Ajouter patient", icon: UserPlus, sub: true },
    { to: "/secretaire/patients", label: "Liste patients", icon: Users, sub: true, end: true },
    { to: "/secretaire/horaires", label: "Horaires", icon: CalendarDays },
    { to: "/secretaire/messages", label: "Messagerie", icon: MessageCircle },
    { to: "/secretaire/profil", label: "Mon profil", icon: User },
];

export default function SecretaireLayout() {
    const navigate = useNavigate();

    /* =====================================================
       ABONNEMENT DU CABINET
       Abonnement expiré / non souscrit -> espace verrouillé,
       sauf la Messagerie (pour joindre le cabinet ou
       l'administration et régulariser la situation).
    ===================================================== */
    const { statut: statutAbo, dateFin, bloque } = useAbonnementCabinet();
    const { pathname } = useLocation();
    const surPageMessages = pathname.endsWith("/messages");

    const rawUser = localStorage.getItem("user") || sessionStorage.getItem("user") || "{}";
    let user = {};
    try {
        user = JSON.parse(rawUser);
    } catch {
        user = {};
    }
    const initial =
        user?.prenom?.charAt(0)?.toUpperCase() ||
        user?.name?.charAt(0)?.toUpperCase() ||
        "S";

    /* Photo de profil du secrétaire (session locale + rafraîchissement API) */
    const photoProfil = usePhotoProfilSecretaire();

    // Bannière d'accueil (même cadre que le dashboard secrétaire)
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
    const fullName = `${user?.prenom || ""} ${user?.nom || ""}`.trim() || "Secrétaire";
    const dateFr = now.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const logout = async () => {
        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            await axios.post(`${API_URL}/logout`, {}, {
                headers: { Authorization: `Bearer ${token}` },
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
        <div className="min-h-screen bg-[#f8fafc] flex">
            {/* SIDEBAR (desktop) */}
            <aside className="hidden lg:flex w-64 bg-white border-r border-[#E7E1D5] min-h-screen flex-col sticky top-0 h-screen shrink-0">
                {/* Logo (identique à la page de connexion) */}
                <div className="px-5 py-5 border-b border-[#EDE8DD]">
                    <LogoPlateforme />
                </div>

                {/* Navigation */}
                <nav className="px-3 flex-1 space-y-1 overflow-y-auto">
                    {NAV.map((item) => {
                        const Icon = item.icon;

                        // Groupe « Gestion Patients » (titre non cliquable)
                        if (item.header) {
                            return (
                                <div
                                    key={item.label}
                                    className="flex items-center gap-3 px-4 pt-4 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#A39A89]"
                                >
                                    <Icon size={15} />
                                    {item.label}
                                </div>
                            );
                        }

                        const estBloque =
                            bloque && item.to !== "/secretaire/messages";

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                aria-disabled={estBloque || undefined}
                                className={(state) =>
                                    `${desktopLinkClass(state)}${
                                        item.sub ? " !pl-9" : ""
                                    }${
                                        estBloque
                                            ? " opacity-40 pointer-events-none select-none"
                                            : ""
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-[#26415E]" />}
                                        <Icon size={19} className={isActive ? "text-[#26415E]" : "text-[#A39A89] group-hover:text-[#26415E]"} />
                            {item.to === "/secretaire/messages" && <BadgeNonLus />}
                            <span className="text-sm">{item.label}</span>
                                        {isActive && <ChevronRight size={15} className="ml-auto text-blue-400" />}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Photo du secrétaire (si elle existe) et Déconnexion, sur la même ligne */}
                <div className="p-3 border-t border-[#EDE8DD]">
                    <div className="flex items-center gap-3">
                        {photoProfil && <PhotoProfil photoUrl={photoProfil} />}

                        <button
                            onClick={logout}
                            className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#7A2E33] hover:bg-[#F8EFEF] transition-colors duration-200 group cursor-pointer"
                        >
                            <LogOut size={19} className="text-[#8C444A] group-hover:text-rose-500" />
                            <span className="text-sm font-medium">Déconnexion</span>
                        </button>
                    </div>
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
                        {photoProfil ? (
                            <PhotoProfil photoUrl={photoProfil} taille="w-9 h-9" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#26415E] to-[#26415E] text-white flex items-center justify-center font-bold text-sm">
                                {initial}
                            </div>
                        )}
                    </div>
                </div>

                {/* NAVIGATION MOBILE */}
                <div className="lg:hidden -mx-0 px-4 mb-6 overflow-x-auto flex gap-2 pb-1">
                    {NAV.map((item) => {
                        const Icon = item.icon;

                        // Groupe « Gestion Patients » (titre non cliquable)
                        if (item.header) {
                            return (
                                <div
                                    key={item.label}
                                    className="flex items-center gap-3 px-4 pt-4 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#A39A89]"
                                >
                                    <Icon size={15} />
                                    {item.label}
                                </div>
                            );
                        }

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                aria-disabled={
                                    (bloque && item.to !== "/secretaire/messages") ||
                                    undefined
                                }
                                className={(state) =>
                                    `${mobileLinkClass(state)}${
                                        item.sub ? " !pl-8" : ""
                                    }${
                                        bloque && item.to !== "/secretaire/messages"
                                            ? " opacity-40 pointer-events-none select-none"
                                            : ""
                                    }`
                                }
                            >
                                <Icon size={15} />
                                {item.to === "/secretaire/messages" && <BadgeNonLus />}
                                {item.label}
                            </NavLink>
                        );
                    })}
                </div>

                {/* Contenu de la page enfant */}
                <main className="flex-1 min-w-0">
                    {bloque && !surPageMessages ? (
                        <BlocageAbonnement
                            statut={statutAbo}
                            dateFin={dateFin}
                            espace="secretaire"
                        />
                    ) : (
                        <>
                            {/* BANNIÈRE D'ACCUEIL — même cadre que le dashboard */}
                            {!bloque && (
                                <section className="relative overflow-hidden rounded-lg bg-gradient-to-r from-[#6D28D9] via-[#5B21B6] to-[#4C1D95] p-6 sm:p-8 text-white shadow-lg shadow-violet-200/60 mt-4 md:mt-6 mx-4 md:mx-8 mb-6">
                                    <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-white/10" />
                                    <div className="absolute top-8 right-28 h-24 w-24 rounded-full bg-white/10" />
                                    <div className="absolute -bottom-16 right-56 h-36 w-36 rounded-full bg-white/10" />
                                    <div className="relative flex flex-wrap items-center justify-between gap-6">
                                        <div>
                                            <h1 className="mt-1 text-2xl sm:text-3xl font-bold">
                                                {greeting}, {fullName}
                                            </h1>
                                            <p className="mt-2 flex items-center gap-2 text-sm text-violet-100">
                                                <CalendarDays size={15} />
                                                {dateFr}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            <Outlet />
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
