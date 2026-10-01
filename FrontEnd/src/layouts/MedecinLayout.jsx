import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import BlocageAbonnement, {
    useAbonnementCabinet,
} from "../components/BlocageAbonnement";
import BadgeNonLus from "../components/BadgeNonLus";
import LogoPlateforme from "../components/LogoPlateforme";
import PhotoProfil from "../components/PhotoProfil";
import { usePhotoProfilMedecin } from "../services/profilMedecin";
import {
    CalendarDays,
    Users,
    User,
    Home,
    LogOut,
    ChevronRight,
    Bell,
    MessageCircle,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

/* Menu identique à celui du dashboard médecin */
const NAV = [
    { to: "/medecin/dashboard", label: "Accueil", icon: Home, end: true },
    { to: "/medecin/notifications", label: "Notifications", icon: Bell },
    { to: "/medecin/patients", label: "Mes patients", icon: Users },
    { to: "/medecin/rendez-vous", label: "Mes rendez-vous", icon: CalendarDays },
    { to: "/medecin/messages", label: "Messagerie", icon: MessageCircle },
    { to: "/medecin/profil", label: "Mon profil", icon: User },
];

export default function MedecinLayout() {
    const navigate = useNavigate();

    /* =====================================================
       ABONNEMENT DU CABINET
       Abonnement expiré / non souscrit -> tout l'espace est
       verrouillé (menus désactivés + écran d'information)
       afin de régulariser la situation.
    ===================================================== */
    const { statut: statutAbo, dateFin, bloque } = useAbonnementCabinet();


    /* Photo de profil (session locale + rafraîchissement API) */
    const photoProfil = usePhotoProfilMedecin();

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
        `w-full flex items-center gap-3.5 px-4 py-3 rounded-md text-left font-medium text-xs transition-all duration-200 group cursor-pointer ${
            isActive
                ? "bg-gradient-to-r from-[#14532D] to-[#059669] text-white shadow-md shadow-[#14532D]/20"
                : "text-[#8C8577] hover:bg-[#EEF2F6] hover:text-[#065F46]"
        }`;

    const mobileLinkClass = ({ isActive }) =>
        `flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
            isActive
                ? "bg-gradient-to-r from-[#14532D] to-[#059669] text-white border border-[#059669]/30"
                : "bg-white border border-[#E7E1D5] text-[#4A453D] hover:bg-[#EDE8DD]"
        }`;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* SIDEBAR (desktop) */}
            <aside className="hidden lg:flex w-72 bg-white border-r border-[#E7E1D5] min-h-screen flex-col sticky top-0 h-screen shrink-0">
                {/* Logo (identique à celui de la page de connexion) */}
                <div className="px-6 py-6 border-b border-[#EDE8DD]">
                    <LogoPlateforme />
                </div>

                {/* Navigation */}
                <nav className="px-3 flex-1 space-y-1 overflow-y-auto">
                    {NAV.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                aria-disabled={bloque || undefined}
                                className={(state) =>
                                    `${desktopLinkClass(state)}${
                                        bloque
                                            ? " opacity-40 pointer-events-none select-none"
                                            : ""
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon
                                            size={18}
                                            className={isActive ? "text-white" : "text-[#A39A89] group-hover:text-[#14532D] transition-colors"}
                                        />
                                        {item.to === "/medecin/messages" && (
                                            <BadgeNonLus />
                                        )}
                                        <span className="flex-1">{item.label}</span>
                                        {isActive && <ChevronRight size={15} className="text-white/80" />}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Photo du médecin (si elle existe) et Déconnexion, sur la même ligne */}
                <div className="p-3 border-t border-[#EDE8DD]">
                    <div className="flex items-center gap-3">
                        {photoProfil && (
                            <PhotoProfil photoUrl={photoProfil} />
                        )}

                        <button
                            onClick={logout}
                            className="flex-1 flex items-center gap-3 px-4 py-3 rounded-md text-[#7A2E33] hover:bg-[#F8EFEF] font-medium text-xs transition-all duration-200 group cursor-pointer"
                        >
                            <LogOut size={18} className="text-[#8C444A] group-hover:text-[#7A2E33] transition-colors" />
                            <span>Déconnexion</span>
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
                        {photoProfil && (
                            <PhotoProfil photoUrl={photoProfil} taille="w-9 h-9" />
                        )}
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
                                aria-disabled={bloque || undefined}
                                className={(state) =>
                                    `${mobileLinkClass(state)}${
                                        bloque
                                            ? " opacity-40 pointer-events-none select-none"
                                            : ""
                                    }`
                                }
                            >
                                <Icon size={15} />
                                {item.to === "/medecin/messages" && <BadgeNonLus />}
                                {item.label}
                            </NavLink>
                        );
                    })}
                </div>

                {/* Contenu de la page enfant */}
                <main className="flex-1 min-w-0">
                    {bloque ? (
                        <BlocageAbonnement
                            statut={statutAbo}
                            dateFin={dateFin}
                            espace="medecin"
                        />
                    ) : (
                        <Outlet />
                    )}
                </main>
            </div>
        </div>
    );
}
