import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  UserRound,
  Users,
  CalendarDays,
  ClipboardList,
  Settings,
  CreditCard,
  Info,
  MessageCircle,
  LogOut,
  ChevronRight,
  Lock,
} from "lucide-react";
import LogoPlateforme from "../components/LogoPlateforme";

const API_URL = "http://127.0.0.1:8000/api";

function CabinetLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [abo, setAbo] = useState(null);
  const [aboLoaded, setAboLoaded] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    if (!token) return;

    axios
      .get(`${API_URL}/cabinet/abonnement`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      .then((res) => {
        if (res.data?.success === false) {
          setAbo(null);
        } else {
          setAbo(res.data?.data || null);
        }
      })
      .catch(() => setAbo(null))
      .finally(() => setAboLoaded(true));
  }, []);

  const statutAbonnement = abo?.statut || "aucun";
  const abonnementActif = statutAbonnement === "actif";

  // Abonnement expiré / non souscrit -> tout l'espace est verrouillé,
  // seule la page Abonnement reste accessible pour renouveler.
  const bloque = aboLoaded && !abonnementActif;
  const surPageAbonnement = pathname.endsWith("/abonnement");

  const formatDate = (d) => {
    if (!d) return "";
    const p = String(d).split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
  };

  const menu = [
    {
      label: "Dashboard",
      path: "/cabinet/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Médecins",
      path: "/cabinet/medecins",
      icon: UserRound,
    },
    {
      label: "Patients",
      path: "/cabinet/patients",
      icon: Users,
    },
    {
      label: "Rendez-vous",
      path: "/cabinet/rendez-vous",
      icon: CalendarDays,
    },
    {
      label: "Secrétaires",
      path: "/cabinet/secretaires",
      icon: ClipboardList,
    },
    {
      label: "Abonnement",
      path: "/cabinet/abonnement",
      icon: CreditCard,
    },
    {
      label: "Paramètres",
      path: "/cabinet/parametres",
      icon: Settings,
    },
    {
      label: "À propos",
      path: "/cabinet/apropos",
      icon: Info,
    },
    {
      label: "Contact",
      path: "/cabinet/contact",
      icon: MessageCircle,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("space");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("space");
    sessionStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F6F3EE] flex">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="w-64 bg-white border-r border-[#E7E1D5] flex flex-col sticky top-0 h-screen">

        {/* LOGO (identique à la page de connexion) */}

        <div className="px-5 py-5 border-b border-[#EDE8DD]">
          <LogoPlateforme />
        </div>

        {/* MENU */}

        <nav className="px-3 flex-1 space-y-1 overflow-y-auto">

          {menu.map((item) => {
            const Icon = item.icon;
            const estBloque =
              bloque && item.path !== "/cabinet/abonnement";

            return (
              <NavLink
                key={item.path}
                to={item.path}
                aria-disabled={estBloque || undefined}
                className={({ isActive }) =>
                  `
                  relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors duration-200 group
                  ${
                    estBloque
                      ? "opacity-40 pointer-events-none select-none"
                      : isActive
                        ? "bg-orange-50 text-orange-700 font-semibold"
                        : "text-[#4A453D] hover:bg-[#EDE8DD] hover:text-[#1C1B19]"
                  }
                  `
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-orange-600" />
                    )}

                    <Icon
                      size={19}
                      className={
                        isActive
                          ? "text-orange-600"
                          : "text-[#A39A89] group-hover:text-orange-600"
                      }
                    />

                    <span className="text-sm">{item.label}</span>

                    {isActive && (
                      <ChevronRight size={15} className="ml-auto text-orange-400" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

        </nav>

        {/* DECONNEXION */}

        <div className="p-3 border-t border-[#EDE8DD]">

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#7A2E33] hover:bg-[#F8EFEF] transition-colors duration-200 group"
          >
            <LogOut size={19} className="text-[#8C444A] group-hover:text-rose-500" />
            <span className="text-sm font-medium">Déconnexion</span>
          </button>

        </div>

      </aside>

      {/* =========================
          CONTENU
      ========================= */}

      <div className="flex-1 min-w-0">

        {/* PAGE */}

        <main className="p-4 sm:p-6 lg:p-8">
          {bloque && !surPageAbonnement ? (
            <div className="max-w-xl mx-auto mt-10 rounded-xl bg-white border border-[#E7E1D5] p-8 text-center shadow-[0_1px_3px_rgba(28,27,25,0.06)]">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <Lock size={26} />
              </div>
              <h1 className="text-xl font-bold text-[#1C1B19]">
                {statutAbonnement === "expire"
                  ? "Abonnement expiré"
                  : "Aucun abonnement actif"}
              </h1>
              <p className="text-sm text-[#8C8577] mt-2 leading-6">
                {statutAbonnement === "expire"
                  ? `Votre abonnement a expiré le ${formatDate(abo?.date_fin)}. Les menus sont désactivés tant que l'abonnement n'est pas renouvelé.`
                  : "Vous devez souscrire un abonnement pour utiliser l'espace cabinet. Les menus restent désactivés jusqu'à l'activation."}
              </p>
              <button
                type="button"
                onClick={() => navigate("/cabinet/abonnement")}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-orange-600 hover:bg-orange-700 px-6 py-3 font-semibold text-white transition-colors"
              >
                <CreditCard size={17} />
                {statutAbonnement === "expire"
                  ? "Renouveler l'abonnement"
                  : "Ajouter un abonnement"}
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>

      </div>

    </div>
  );
}

export default CabinetLayout;
