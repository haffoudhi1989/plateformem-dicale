import React, { useEffect, useState } from "react";
import {
    NavLink,
    useLocation,
    useNavigate
} from "react-router-dom";
import {
    Building2,
    CalendarDays,
    CreditCard,
    HeartPulse,
    Layers,
    LogOut,
    Settings,
    UserCog,
    ChevronDown,
    Menu,
    X,
    Mail
} from "lucide-react";

const API = "http://127.0.0.1:8000";

function Sidebar() {

    const navigate = useNavigate();
    const location = useLocation();

    const [openMenu, setOpenMenu] = useState(null);
    const [openSub, setOpenSub] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // =====================================================
    // MENU PRINCIPAL
    // =====================================================

    const menuItems = [

        // -------------------------------------------------
        // GESTION CABINETS
        // -------------------------------------------------

        {
            title: "Gestion Cabinets",
            icon: Building2,
            children: [
                {
                    title: "Créer Cabinet",
                    path: "/admin/cabinet"
                },
                {
                    title: "Liste Cabinets",
                    path: "/admin/cabinet/liste"
                },
            ]
        },

        // -------------------------------------------------
        // GESTION RDV
        // -------------------------------------------------

        {
            title: "Gestion Rendez-Vous",
            path: "/admin/rdv",
            icon: CalendarDays
        },

        // -------------------------------------------------
        // GESTION PAIEMENT
        // -------------------------------------------------

        {
            title: "Gestion Paiement",
            path: "/admin/payments",
            icon: CreditCard
        },

        // -------------------------------------------------
        // MESSAGES
        // -------------------------------------------------

        {
            title: "Messages",
            path: "/admin/messages",
            icon: Mail
        },

        // -------------------------------------------------
        // GESTION SPECIALITES
        // -------------------------------------------------

        {
            title: "Gestion Spécialités",
            icon: Layers,
            children: [
                {
                    title: "Liste Spécialités",
                    path: "/admin/specialities"
                },
                {
                    title: "Ajouter Spécialité",
                    path: "/admin/specialities/add"
                }
            ]
        },

        // -------------------------------------------------
        // UTILISATEURS & ROLES
        // -------------------------------------------------

        {
            title: "Utilisateurs & Rôles",
            icon: UserCog,
            children: [
                {
                    title: "Liste utilisateurs",
                    path: "/admin/users"
                },
                {
                    title: "Ajouter utilisateur",
                    path: "/admin/useradd"
                },
            ]
        },

        // -------------------------------------------------
        // PARAMETRES (dernière entrée du menu)
        // -------------------------------------------------

        {
            title: "Paramètres",
            path: "/admin/parametres",
            icon: Settings
        }
    ];

    // =====================================================
    // HELPERS DE CHEMIN
    // =====================================================

    const isPathActive = (path) =>
        location.pathname === path ||
        location.pathname.startsWith(path + "/");

    const isParentActive = (item) => {

        if (!item.children) {
            return false;
        }

        return item.children.some(
            (child) =>
                (child.path && isPathActive(child.path)) ||
                (child.children &&
                    child.children.some((sub) =>
                        isPathActive(sub.path)
                    ))
        );
    };

    // =====================================================
    // PROFIL ADMIN (nom + photo de la carte profil)
    // =====================================================
    // Données lues depuis le stockage local (« user » écrit à la
    // connexion puis après enregistrement dans Paramètres), avec
    // repli sur le libellé « Admin » et l'avatar par défaut.

    const lireProfilAdmin = () => {

        try {

            const brut =
                localStorage.getItem("user") ||
                sessionStorage.getItem("user");

            return brut ? JSON.parse(brut) : null;

        } catch {

            return null;

        }
    };

    const [adminProfile, setAdminProfile] = useState(lireProfilAdmin);

    useEffect(() => {

        const rafraichirProfil = () => setAdminProfile(lireProfilAdmin());

        window.addEventListener(
            "admin-profile-updated",
            rafraichirProfil
        );

        return () =>
            window.removeEventListener(
                "admin-profile-updated",
                rafraichirProfil
            );

    }, []);

    const adminNom = adminProfile?.name || "Admin";

    // Chemin relatif prioritaire, l'URL est reconstruite sur l'API
    // (indépendant de APP_URL / asset() côté back-end).
    const adminPhoto = adminProfile?.photo
        ? `${API}/storage/${adminProfile.photo}`
        : adminProfile?.photo_url || "/admin.png";

    // =====================================================
    // DECONNEXION
    // =====================================================

    const handleLogout = () => {

        const confirmed = window.confirm(
            "Voulez-vous vraiment vous déconnecter ?"
        );

        if (!confirmed) {
            return;
        }

        localStorage.removeItem("token");
        localStorage.removeItem("admin");

        setSidebarOpen(false);

        navigate("/login");
    };

    // =====================================================
    // OUVERTURE AUTOMATIQUE DU SOUS-MENU
    // =====================================================

    useEffect(() => {

        const activeMenuIndex = menuItems.findIndex((item) =>
            isParentActive(item)
        );

        if (activeMenuIndex !== -1) {
            setOpenMenu(activeMenuIndex);

            const item = menuItems[activeMenuIndex];

            const activeSubIndex = item.children.findIndex(
                (child) =>
                    child.children &&
                    child.children.some((sub) =>
                        isPathActive(sub.path)
                    )
            );

            if (activeSubIndex !== -1) {
                setOpenSub(`${activeMenuIndex}-${activeSubIndex}`);
            }
        }

    }, [location.pathname]);

    // =====================================================
    // TOGGLE MENU / SOUS-MENU
    // =====================================================

    const toggleMenu = (index) => {

        setOpenMenu(
            openMenu === index
                ? null
                : index
        );

        setOpenSub(null);
    };

    const toggleSub = (menuIndex, childIndex) => {

        const key = `${menuIndex}-${childIndex}`;

        setOpenSub(
            openSub === key
                ? null
                : key
        );
    };

    // =====================================================
    // FERMER SIDEBAR MOBILE
    // =====================================================

    const closeMobileSidebar = () => {
        setSidebarOpen(false);
    };

    // =====================================================
    // ESCAPE
    // =====================================================

    useEffect(() => {

        const handleEscape = (event) => {

            if (event.key === "Escape") {
                setSidebarOpen(false);
            }
        };

        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };

    }, []);

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <>

            {/* Police sans-serif alignée sur celle du tableau de bord
                admin (« font-sans » de Tailwind, identique aux titres du
                dashboard) : la marque et les libellés de la barre
                latérale n'utilisent plus de police serif. Fond légèrement
                teinté bleu plutôt que blanc pur ; les éléments actifs
                sont ici des pastilles pleines dans le bleu de la marque. */}
            <style>{`
                /* =====================================================
                   BARRE DE DÉFILEMENT DU MENU
                   -----------------------------------------------------
                    Reprend le style de la barre située en haut de
                    chaque page admin :
                      - couleur bleu nuit unique #26415E ;
                      - même liseré clair que border-white/20 ;
                      - angles légèrement arrondis (2px) : la barre reste
                        un rectangle, sans redevenir une pilule (la limite
                        est 5px pour une barre de 10px de large).

                   IMPORTANT (Chrome 121+) : dès que scrollbar-color /
                   scrollbar-width sont définies, Chrome ignore les
                   pseudo-éléments ::-webkit-scrollbar. Ces deux
                   propriétés sont donc réservées à Firefox via
                   @supports, sinon toute la mise en forme ci-dessous
                   n'a aucun effet dans Chrome / Edge.
                   ===================================================== */

                .sidebar-scroll::-webkit-scrollbar {
                    width: 10px;
                }

                .sidebar-scroll::-webkit-scrollbar-track {
                    background: transparent;
                    border-radius: 2px;
                }

                .sidebar-scroll::-webkit-scrollbar-thumb {
                    border-radius: 2px;
                    border: 1px solid rgba(255, 255, 255, 0.22);
                    background: #26415E;
                    background-clip: padding-box;
                }

                .sidebar-scroll::-webkit-scrollbar-thumb:hover {
                    background: #3A5570;
                    background-clip: padding-box;
                }

                .sidebar-scroll::-webkit-scrollbar-corner {
                    background: transparent;
                }

                /* Firefox (pas de prise en charge de ::-webkit-scrollbar) */
                @supports not selector(::-webkit-scrollbar) {
                    .sidebar-scroll {
                        scrollbar-width: thin;
                        scrollbar-color: #26415E transparent;
                    }
                }
            `}</style>

            {/* =================================================
                BOUTON MOBILE
            ================================================= */}

            <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="
                    lg:hidden
                    fixed
                    top-4
                    left-4
                    z-[60]
                    w-11
                    h-11
                    rounded-full
                    bg-[#1D3149]
                    text-white
                    shadow-[0_2px_8px_rgba(29,49,73,0.35)]
                    flex
                    items-center
                    justify-center
                    hover:bg-[#26415E]
                    active:scale-95
                    transition-all
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[#26415E]
                    focus-visible:ring-offset-2
                "
                aria-label="Ouvrir le menu"
            >
                <Menu size={22} />
            </button>

            {/* =================================================
                OVERLAY MOBILE
            ================================================= */}

            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Fermer le menu"
                    className="
                        lg:hidden
                        fixed
                        inset-0
                        bg-[#1D3149]/50
                        z-40
                        backdrop-blur-sm
                        cursor-default
                    "
                    onClick={closeMobileSidebar}
                />
            )}

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside
                aria-label="Menu principal"
                className={`
                    fixed
                    left-0
                    top-0
                    h-screen
                    w-64

                    bg-[#F5F8FB]
                    border-r
                    border-[#DEE7EF]

                    flex
                    flex-col

                    px-3
                    py-4
                    z-50

                    transform
                    transition-transform
                    duration-300
                    ease-in-out

                    ${
                        sidebarOpen
                            ? "translate-x-0"
                            : "-translate-x-full"
                    }

                    lg:translate-x-0
                `}
            >

                {/* =================================================
                    HEADER / LOGO
                ================================================= */}

                {/* Alignement vertical : le libellé « Espace Administrateur »
                    reste sur la même ligne que le titre de page des bannières
                    admin (« Gestion du cabinet », etc.) : ligne du titre à
                    50px => centre optique ~65px.
                    Avec le logo (pastille 40px) : 16 (py-4 aside) + 17 (pt)
                    + 1 (centrage de la colonne texte) + 20 (mot-symbole)
                    + 4 (mt-1) + ~7 => centre optique ~65px. */}
                <div className="shrink-0 mb-4 pb-5 pt-[17px] border-b border-[#DEE7EF]">

                    {/* Mobile : logo à gauche + bouton de fermeture à droite.
                        Desktop (lg) : bouton masqué => bloc de marque centré. */}
                    <div className="flex items-center justify-between lg:justify-center">

                        {/* Logo de la plateforme — reprise de celui de la page de
                            connexion (pastille bleue + mot-symbole bicolore),
                            redimensionné pour la barre latérale. */}
                        <div className="flex items-center gap-2.5">

                            <div
                                className="
                                    flex
                                    h-10
                                    w-10
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-[13px]
                                    bg-[#1769E8]
                                    shadow-[0_6px_16px_rgba(23,105,232,0.22)]
                                "
                            >
                                <HeartPulse
                                    size={22}
                                    className="text-white"
                                    strokeWidth={2.2}
                                />
                            </div>

                            <div className="leading-tight lg:text-center">

                                <div className="font-sans text-xl font-bold leading-none tracking-tight text-[#12213D]">
                                    Med<span className="text-[#1769E8]">Plateform</span>
                                </div>

                                <p className="mt-1 text-[11px] font-medium tracking-wide text-[#6E88A3] uppercase">
                                    Espace Administrateur
                                </p>

                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={closeMobileSidebar}
                            className="
                                lg:hidden
                                w-9
                                h-9
                                rounded-full
                                flex
                                items-center
                                justify-center
                                text-[#6E88A3]
                                hover:bg-[#E7EEF5]
                                hover:text-[#1D3149]
                                transition
                                focus-visible:outline-none
                                focus-visible:ring-2
                                focus-visible:ring-[#26415E]
                            "
                            aria-label="Fermer le menu"
                        >
                            <X size={20} />
                        </button>

                    </div>

                </div>

                {/* =================================================
                    MENU
                ================================================= */}

                <nav
                    className="
                        sidebar-scroll

                        flex-1
                        min-h-0
                        space-y-1.5
                        overflow-y-auto
                        overflow-x-hidden

                        -mr-3
                        pr-3
                    "
                >

                    {menuItems.map((item, index) => {

                        const Icon = item.icon;
                        const parentActive = isParentActive(item);

                        return (
                            <div
                                key={item.title}
                                className="w-full"
                            >

                                {item.children ? (

                                    <>

                                        {/* MENU PARENT */}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleMenu(index)
                                            }
                                            aria-expanded={openMenu === index}
                                            className={`
                                                group
                                                w-full
                                                min-h-11
                                                flex
                                                items-center
                                                justify-between
                                                px-3.5
                                                rounded-md
                                                transition-all
                                                duration-200
                                                focus-visible:outline-none
                                                focus-visible:ring-2
                                                focus-visible:ring-[#26415E]

                                                ${
                                                        parentActive
                                                            ? "bg-[#1D3149] text-white shadow-[0_2px_6px_rgba(29,49,73,0.25)]"
                                                            : openMenu === index
                                                                ? "bg-[#E7EEF5] text-[#1D3149]"
                                                                : "text-[#3E4C5E] hover:bg-[#E7EEF5]"
                                                }
                                            `}
                                        >

                                            <span
                                                className="
                                                    flex
                                                    items-center
                                                    gap-3
                                                "
                                            >

                                                <span
                                                    className={`
                                                        w-8
                                                        h-8
                                                        rounded-md
                                                        flex
                                                        items-center
                                                        justify-center
                                                        transition

                                                        ${
                                                            parentActive
                                                                ? "bg-white/15 text-white"
                                                                : openMenu === index
                                                                    ? "text-[#1D3149]"
                                                                    : "text-[#6E88A3] group-hover:text-[#1D3149]"
                                                        }
                                                    `}
                                                >
                                                    <Icon size={18} />
                                                </span>

                                                <span
                                                    className="
                                                        font-sans
                                                        text-sm
                                                        font-semibold
                                                        tracking-tight
                                                        whitespace-nowrap
                                                    "
                                                >
                                                    {item.title}
                                                </span>

                                            </span>

                                            <ChevronDown
                                                size={16}
                                                className={`
                                                    transition-transform
                                                    duration-200

                                                    ${
                                                        openMenu === index
                                                            ? "rotate-180"
                                                            : ""
                                                    }

                                                    ${
                                                        parentActive
                                                            ? "text-white/70"
                                                            : "text-[#A9BBCB]"
                                                    }
                                                `}
                                            />

                                        </button>

                                        {/* SOUS-MENU */}

                                        {openMenu === index && (

                                            <div
                                                className="
                                                    ml-7
                                                    mt-1
                                                    mb-1
                                                    space-y-0.5
                                                    border-l
                                                    border-[#DEE7EF]
                                                    pl-3
                                                "
                                            >

                                                {item.children.map(
                                                    (child, childIndex) => {

                                                        const subKey = `${index}-${childIndex}`;

                                                        return child.children ? (

                                                        <div
                                                            key={
                                                                child.title
                                                            }
                                                            className="w-full"
                                                        >

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    toggleSub(index, childIndex)
                                                                }
                                                                aria-expanded={openSub === subKey}
                                                                className={`
                                                                    group
                                                                    w-full
                                                                    flex
                                                                    items-center
                                                                    justify-between
                                                                    min-h-9
                                                                    px-3
                                                                    rounded-md
                                                                    text-[13px]
                                                                    font-medium
                                                                    transition-all
                                                                    duration-200
                                                                    focus-visible:outline-none
                                                                    focus-visible:ring-2
                                                                    focus-visible:ring-[#26415E]

                                                                    ${
                                                                        openSub ===
                                                                        subKey
                                                                            ? "text-[#1D3149] bg-[#E7EEF5]"
                                                                            : "text-[#6E88A3] hover:text-[#1D3149]"
                                                                    }
                                                                `}
                                                            >

                                                                <span className="font-sans flex items-center gap-2 whitespace-nowrap">
                                                                    <ChevronDown
                                                                        size={13}
                                                                        className={`
                                                                            transition-transform
                                                                            duration-200

                                                                            ${
                                                                                openSub ===
                                                                                subKey
                                                                                    ? "rotate-180"
                                                                                    : "-rotate-90"
                                                                            }
                                                                        `}
                                                                    />
                                                                    {child.title}
                                                                </span>

                                                            </button>

                                                            {openSub ===
                                                                subKey && (

                                                                <div
                                                                    className="
                                                                        ml-3
                                                                        mt-0.5
                                                                        mb-1
                                                                        space-y-0.5
                                                                        border-l
                                                                        border-[#DEE7EF]
                                                                        pl-2.5
                                                                    "
                                                                >

                                                                    {child.children.map(
                                                                        (sub) => (
                                                                            <NavLink
                                                                                key={
                                                                                    sub.path
                                                                                }
                                                                                to={
                                                                                    sub.path
                                                                                }
                                                                                onClick={
                                                                                    closeMobileSidebar
                                                                                }
                                                                                aria-current={
                                                                                    isPathActive(sub.path)
                                                                                        ? "page"
                                                                                        : undefined
                                                                                }
                                                                                className={({
                                                                                    isActive
                                                                                }) => `
                                                                                    font-sans
                                                                                    flex
                                                                                    items-center
                                                                                    min-h-8
                                                                                    px-3
                                                                                    rounded-md
                                                                                    text-[12.5px]
                                                                                    whitespace-nowrap
                                                                                    transition-all
                                                                                    duration-200
                                                                                    focus-visible:outline-none
                                                                                    focus-visible:ring-2
                                                                                    focus-visible:ring-[#26415E]

                                                                                    ${
                                                                                        isActive
                                                                                            ? "bg-[#1D3149] text-white font-semibold"
                                                                                            : "text-[#8296AC] hover:bg-[#E7EEF5] hover:text-[#1D3149]"
                                                                                    }
                                                                                `}
                                                                            >
                                                                                {sub.title}
                                                                            </NavLink>
                                                                        )
                                                                    )}

                                                                </div>

                                                            )}

                                                        </div>

                                                    ) : (

                                                        <NavLink
                                                            key={
                                                                child.path
                                                            }
                                                            to={
                                                                child.path
                                                            }
                                                            onClick={
                                                                closeMobileSidebar
                                                            }
                                                            aria-current={
                                                                isPathActive(child.path)
                                                                    ? "page"
                                                                    : undefined
                                                            }
                                                            className={({
                                                                isActive
                                                            }) => `
                                                                font-sans
                                                                flex
                                                                items-center
                                                                min-h-9
                                                                px-3
                                                                rounded-md
                                                                text-[13px]
                                                                whitespace-nowrap
                                                                transition-all
                                                                duration-200
                                                                focus-visible:outline-none
                                                                focus-visible:ring-2
                                                                focus-visible:ring-[#26415E]

                                                                ${
                                                                    isActive
                                                                        ? "bg-[#1D3149] text-white font-semibold"
                                                                        : "text-[#8296AC] hover:bg-[#E7EEF5] hover:text-[#1D3149]"
                                                                }
                                                            `}
                                                        >
                                                            {child.title}
                                                        </NavLink>

                                                    );
                                                    }
                                                )}

                                            </div>

                                        )}

                                    </>

                                ) : (

                                    <NavLink
                                        to={item.path}
                                        onClick={closeMobileSidebar}
                                        aria-current={
                                            isPathActive(item.path)
                                                ? "page"
                                                : undefined
                                        }
                                        className={({ isActive }) => `
                                            group
                                            w-full
                                            min-h-11
                                            flex
                                            items-center
                                            gap-3
                                            px-3.5
                                            rounded-md
                                            transition-all
                                            duration-200
                                            focus-visible:outline-none
                                            focus-visible:ring-2
                                            focus-visible:ring-[#26415E]

                                            ${
                                                isActive
                                                    ? "bg-[#1D3149] text-white shadow-[0_2px_6px_rgba(29,49,73,0.25)]"
                                                    : "text-[#3E4C5E] hover:bg-[#E7EEF5]"
                                            }
                                        `}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <span
                                                    className={`
                                                        w-8
                                                        h-8
                                                        rounded-md
                                                        flex
                                                        items-center
                                                        justify-center
                                                        transition

                                                        ${
                                                            isActive
                                                                ? "bg-white/15 text-white"
                                                                : "text-[#6E88A3] group-hover:text-[#1D3149]"
                                                        }
                                                    `}
                                                >
                                                    <Icon size={18} />
                                                </span>

                                                <span
                                                    className="
                                                        font-sans
                                                        text-sm
                                                        font-semibold
                                                        tracking-tight
                                                        whitespace-nowrap
                                                    "
                                                >
                                                    {item.title}
                                                </span>
                                            </>
                                        )}
                                    </NavLink>

                                )}

                            </div>
                        );
                    })}

                </nav>

                {/* =================================================
                    PROFIL ADMIN
                ================================================= */}

                <div
                    className="
                        shrink-0
                        mt-3
                        rounded-2xl
                        p-3
                        bg-white
                        border
                        border-[#DEE7EF]
                        shadow-[0_1px_3px_rgba(29,49,73,0.06)]
                    "
                >

                    <div className="flex items-center gap-3">

                        <div
                            className="
                                w-10
                                h-10
                                rounded-full
                                overflow-hidden
                                shrink-0
                                bg-[#E7EEF5]
                                ring-1
                                ring-[#DEE7EF]
                            "
                        >
                            <img
                                src={adminPhoto}
                                alt={adminNom}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = "/admin.png";
                                }}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="
                                flex-1
                                flex
                                items-center
                                gap-3
                                px-4
                                py-3
                                rounded-xl
                                text-xs
                                font-medium
                                text-[#7A2E33]
                                hover:bg-[#F8EFEF]
                                transition-all
                                duration-200
                                group
                                cursor-pointer
                                focus-visible:outline-none
                                focus-visible:ring-2
                                focus-visible:ring-[#26415E]
                            "
                        >

                            <LogOut
                                size={18}
                                className="text-[#8C444A] group-hover:text-[#7A2E33] transition-colors"
                            />

                            <span>
                                Déconnexion
                            </span>

                        </button>

                    </div>

                </div>

            </aside>
        </>
    );
}

export default Sidebar;
