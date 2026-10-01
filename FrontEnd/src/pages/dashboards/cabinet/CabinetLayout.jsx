import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    Building2,
    LayoutDashboard,
    Stethoscope,
    Users,
    CalendarDays,
    Clock,
    CreditCard,
    MessageSquare,
    Settings,
    LogOut,
    Menu,
    X,
} from "lucide-react";

const NAV = [
    {
        to: "/cabinet/dashboard",
        label: "Vue d'ensemble",
        icon: LayoutDashboard,
        end: true,
    },
    {
        to: "/cabinet/medecins",
        label: "Médecin",
        icon: Stethoscope,
    },
    {
        to: "/cabinet/patients",
        label: "Patients",
        icon: Users,
    },
    {
        to: "/cabinet/secretaires",
        label: "Secrétaires",
        icon: Users,
    },
    {
        to: "/cabinet/rendez-vous",
        label: "Rendez-vous",
        icon: CalendarDays,
    },
    {
        to: "/cabinet/horaires",
        label: "Horaires",
        icon: Clock,
    },
    {
        to: "/cabinet/abonnement",
        label: "Abonnement",
        icon: CreditCard,
    },
   
    {
        to: "/cabinet/profil",
        label: "Profil",
        icon: Settings,
    },
    {
        to: "/cabinet/parametres",
        label: "Paramètres",
        icon: Settings,
    },
];

export default function CabinetLayout() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const raw =
            localStorage.getItem("user") ||
            sessionStorage.getItem("user");

        try {
            setUser(raw ? JSON.parse(raw) : null);
        } catch {
            setUser(null);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("space");

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("space");

        navigate("/login");
    };

    const cabinetName =
        user?.cabinet ||
        user?.cabinet_name ||
        user?.nom_cabinet ||
        user?.name ||
        "Espace Cabinet";

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            isActive
                ? "bg-amber-500/10 text-amber-700 border border-amber-500/20 shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`;

    return (
        <div className="min-h-screen bg-slate-50 flex">

            {/* ================================================= */}
            {/* SIDEBAR DESKTOP */}
            {/* ================================================= */}

            <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 bg-white border-r border-slate-200 z-30">

                {/* En-tête */}
                <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">

                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                        <Building2 size={20} />
                    </div>

                    <div className="min-w-0">
                        <p className="font-bold text-slate-900 leading-tight truncate">
                            {cabinetName}
                        </p>

                        <p className="text-[11px] text-slate-400 font-medium">
                            Espace cabinet
                        </p>
                    </div>

                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

                    {NAV.map(
                        ({
                            to,
                            label,
                            icon: Icon,
                            end,
                        }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                className={linkClass}
                            >
                                <Icon
                                    size={18}
                                    className="shrink-0"
                                />

                                <span>
                                    {label}
                                </span>
                            </NavLink>
                        )
                    )}

                </nav>

                {/* Déconnexion */}
                <div className="px-3 py-4 border-t border-slate-100">

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                        <LogOut size={18} />

                        <span>
                            Déconnexion
                        </span>
                    </button>

                </div>

            </aside>

            {/* ================================================= */}
            {/* TOPBAR MOBILE */}
            {/* ================================================= */}

            <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">

                <div className="flex items-center gap-2.5 min-w-0">

                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0">
                        <Building2 size={18} />
                    </div>

                    <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">
                            {cabinetName}
                        </p>

                        <p className="text-[10px] text-slate-400">
                            Espace cabinet
                        </p>
                    </div>

                </div>

                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                    aria-label="Menu"
                >
                    {open ? (
                        <X size={20} />
                    ) : (
                        <Menu size={20} />
                    )}
                </button>

            </div>

            {/* ================================================= */}
            {/* MENU MOBILE */}
            {/* ================================================= */}

            {open && (
                <div className="md:hidden fixed inset-0 z-20">

                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-slate-900/40"
                        onClick={() => setOpen(false)}
                    />

                    {/* Menu */}
                    <aside className="absolute left-0 top-[57px] bottom-0 w-72 bg-white border-r border-slate-200 shadow-xl flex flex-col">

                        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

                            {NAV.map(
                                ({
                                    to,
                                    label,
                                    icon: Icon,
                                    end,
                                }) => (
                                    <NavLink
                                        key={to}
                                        to={to}
                                        end={end}
                                        onClick={() =>
                                            setOpen(false)
                                        }
                                        className={linkClass}
                                    >
                                        <Icon
                                            size={18}
                                            className="shrink-0"
                                        />

                                        <span>
                                            {label}
                                        </span>
                                    </NavLink>
                                )
                            )}

                        </nav>

                        {/* Déconnexion mobile */}
                        <div className="px-3 py-4 border-t border-slate-100">

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                                <LogOut size={18} />

                                <span>
                                    Déconnexion
                                </span>
                            </button>

                        </div>

                    </aside>

                </div>
            )}

            {/* ================================================= */}
            {/* CONTENU */}
            {/* ================================================= */}

            <div className="flex-1 md:ml-64 pt-[57px] md:pt-0">

                <main className="p-4 md:p-6 lg:p-8">
                    <Outlet />
                </main>

            </div>

        </div>
    );
}