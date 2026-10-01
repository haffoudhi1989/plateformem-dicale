import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    CalendarDays,
    Users,
    CreditCard,
    MessageCircle,
    Info,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const AUTO_REFRESH_INTERVAL = 30000;
const PER_PAGE = 10;

// =====================================================
// TOKEN
// =====================================================

const getToken = () => {
    return (
        localStorage.getItem("token") ||
        sessionStorage.getItem("token")
    );
};

// =====================================================
// HEADERS
// =====================================================

const getHeaders = () => {
    const token = getToken();

    return {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token
            ? {
                  Authorization: `Bearer ${token}`
              }
            : {})
    };
};

// =====================================================
// EXTRAIRE LE CONTENU DE DATA
// =====================================================

const parseNotificationData = (data) => {
    if (!data) {
        return {};
    }

    if (typeof data === "object") {
        return data;
    }

    if (typeof data === "string") {
        try {
            return JSON.parse(data);
        } catch {
            return {
                message: data
            };
        }
    }

    return {};
};

// =====================================================
// COMPOSANT
// =====================================================

function Notifications() {
    const [notifications, setNotifications] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");

    const [currentPage, setCurrentPage] = useState(1);

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: PER_PAGE
    });

    // =================================================
    // SESSION EXPIRÉE
    // =================================================

    const handleUnauthorized = useCallback(() => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");

        setError(
            "Session expirée. Veuillez vous reconnecter."
        );
    }, []);

    // =================================================
    // CHARGER LES NOTIFICATIONS
    // =================================================

    const fetchNotifications = useCallback(
        async ({
            page = 1,
            showLoading = true
        } = {}) => {
            try {
                const token = getToken();

                if (!token) {
                    setError(
                        "Session expirée. Veuillez vous reconnecter."
                    );

                    setLoading(false);
                    setRefreshing(false);

                    return;
                }

                if (showLoading) {
                    setLoading(true);
                } else {
                    setRefreshing(true);
                }

                setError("");

                const response = await fetch(
                    `${API_URL}/admin/notifications?page=${page}&per_page=${PER_PAGE}`,
                    {
                        method: "GET",
                        headers: getHeaders()
                    }
                );

                if (response.status === 401) {
                    handleUnauthorized();
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        "Erreur API notifications"
                    );
                }

                const result = await response.json();

                console.log(
                    "Notifications API :",
                    result
                );

                // =================================================
                // LARAVEL PAGINATE()
                // =================================================

                let list = [];

                if (Array.isArray(result)) {
                    list = result;
                } else if (
                    Array.isArray(result.data)
                ) {
                    list = result.data;
                } else if (
                    Array.isArray(
                        result.notifications
                    )
                ) {
                    list = result.notifications;
                }

                setNotifications(list);

                setPagination({
                    current_page:
                        result.current_page ??
                        page,

                    last_page:
                        result.last_page ??
                        1,

                    total:
                        result.total ??
                        list.length,

                    per_page:
                        result.per_page ??
                        PER_PAGE
                });

                setCurrentPage(
                    result.current_page ?? page
                );

            } catch (err) {
                console.error(
                    "Erreur notifications :",
                    err
                );

                setError(
                    "Impossible de charger les notifications."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [handleUnauthorized]
    );

    // =================================================
    // PREMIER CHARGEMENT
    // =================================================

    useEffect(() => {
        fetchNotifications({
            page: 1,
            showLoading: true
        });
    }, [fetchNotifications]);

    // =================================================
    // RAFRAÎCHISSEMENT AUTOMATIQUE
    // =================================================

    useEffect(() => {
        const interval = setInterval(() => {
            fetchNotifications({
                page: currentPage,
                showLoading: false
            });
        }, AUTO_REFRESH_INTERVAL);

        return () => {
            clearInterval(interval);
        };
    }, [
        fetchNotifications,
        currentPage
    ]);

    // =================================================
    // ACTUALISER MANUELLEMENT
    // =================================================

    const handleRefresh = () => {
        fetchNotifications({
            page: currentPage,
            showLoading: false
        });
    };

    // =================================================
    // CHANGER DE PAGE
    // =================================================

    const goToPage = (page) => {
        if (
            page < 1 ||
            page > pagination.last_page ||
            page === currentPage
        ) {
            return;
        }

        fetchNotifications({
            page,
            showLoading: true
        });
    };

    // =================================================
    // MARQUER COMME LUE
    // =================================================

    const markAsRead = async (id) => {
        try {
            const response = await fetch(
                `${API_URL}/admin/notifications/${id}/read`,
                {
                    method: "PUT",
                    headers: getHeaders()
                }
            );

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error();
            }

            setNotifications((prev) =>
                prev.map((notification) =>
                    notification.id === id
                        ? {
                              ...notification,
                              read_at:
                                  new Date().toISOString()
                          }
                        : notification
                )
            );

        } catch (err) {
            console.error(
                "Erreur lecture notification :",
                err
            );

            setError(
                "Impossible de marquer la notification comme lue."
            );
        }
    };

    // =================================================
    // TOUT MARQUER COMME LU
    // =================================================

    const markAllAsRead = async () => {
        try {
            const response = await fetch(
                `${API_URL}/admin/notifications/read-all`,
                {
                    method: "PUT",
                    headers: getHeaders()
                }
            );

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error();
            }

            const now =
                new Date().toISOString();

            setNotifications((prev) =>
                prev.map((notification) => ({
                    ...notification,
                    read_at:
                        notification.read_at ||
                        now
                }))
            );

        } catch (err) {
            console.error(
                "Erreur read-all :",
                err
            );

            setError(
                "Impossible de marquer toutes les notifications comme lues."
            );
        }
    };

    // =================================================
    // SUPPRIMER
    // =================================================

    const deleteNotification = async (id) => {
        const confirmation = window.confirm(
            "Voulez-vous vraiment supprimer cette notification ?"
        );

        if (!confirmation) {
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/admin/notifications/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders()
                }
            );

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error();
            }

            const remaining =
                notifications.filter(
                    (notification) =>
                        notification.id !== id
                );

            setNotifications(remaining);

            setPagination((prev) => ({
                ...prev,
                total: Math.max(
                    0,
                    prev.total - 1
                )
            }));

            // Si la page devient vide
            if (
                remaining.length === 0 &&
                currentPage > 1
            ) {
                fetchNotifications({
                    page: currentPage - 1,
                    showLoading: true
                });
            }

        } catch (err) {
            console.error(
                "Erreur suppression :",
                err
            );

            setError(
                "Impossible de supprimer la notification."
            );
        }
    };

    // =================================================
    // ICÔNE
    // =================================================

    const getIcon = (type) => {
        switch (type) {
            case "rendez_vous":
                return (
                    <CalendarDays size={22} />
                );

            case "patient":
                return (
                    <Users size={22} />
                );

            case "paiement":
                return (
                    <CreditCard size={22} />
                );

            case "message":
                return (
                    <MessageCircle size={22} />
                );

            default:
                return <Info size={22} />;
        }
    };

    // =================================================
    // STYLE ICÔNE
    // =================================================

    const getIconStyle = (type) => {
        switch (type) {
            case "rendez_vous":
                return "bg-blue-100 text-blue-600";

            case "patient":
                return "bg-green-100 text-green-600";

            case "paiement":
                return "bg-purple-100 text-purple-600";

            case "message":
                return "bg-orange-100 text-orange-600";

            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    // =================================================
    // NON LUES
    // =================================================

    const unreadCount = useMemo(() => {
        return notifications.filter(
            (notification) =>
                !notification.read_at
        ).length;
    }, [notifications]);

    // =================================================
    // NUMÉROS DE PAGES
    // =================================================

    const pages = useMemo(() => {
        const total =
            pagination.last_page;

        if (total <= 1) {
            return [];
        }

        const result = [];

        const start = Math.max(
            1,
            currentPage - 2
        );

        const end = Math.min(
            total,
            currentPage + 2
        );

        for (
            let page = start;
            page <= end;
            page++
        ) {
            result.push(page);
        }

        return result;
    }, [
        currentPage,
        pagination.last_page
    ]);

    // =================================================
    // CHARGEMENT
    // =================================================

    if (loading) {
        return (
            <div className="
                flex
                items-center
                justify-center
                min-h-[400px]
            ">
                <div className="
                    flex
                    flex-col
                    items-center
                    gap-3
                ">
                    <RefreshCw
                        size={30}
                        className="
                            text-blue-600
                            animate-spin
                        "
                    />

                    <p className="text-gray-500">
                        Chargement des notifications...
                    </p>
                </div>
            </div>
        );
    }

    // =================================================
    // AFFICHAGE
    // =================================================

    return (
        <div className="space-y-6">

            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

                        <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <Bell size={26} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                            Notifications
                        </h1>
                        <p className="text-blue-100 text-sm mt-0.5">
                            Toutes vos notifications
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        bg-white/10
                        border
                        border-white/20
                        text-white
                        hover:bg-white/20
                        disabled:opacity-50
                        px-5
                        py-3
                        rounded-xl
                        font-semibold
                        text-sm
                    "
                >
                    <RefreshCw
                        size={18}
                        className={
                            refreshing
                                ? "animate-spin"
                                : ""
                        }
                    />

                    Actualiser
                </button>

                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={markAllAsRead}
                        className="
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            bg-white
                            text-blue-800
                            hover:bg-blue-50
                            px-5
                            py-3
                            rounded-xl
                            font-semibold
                            text-sm
                        "
                    >
                        <CheckCheck size={18} />

                        Tout marquer comme lu
                    </button>
                )}
                </div>
            </div>

            {/* ================================================= */}
            {/* STATISTIQUES */}
            {/* ================================================= */}

            <div className="
                grid
                grid-cols-1
                sm:grid-cols-2
                gap-4
            ">

                <div className="
                    bg-white
                    rounded-xl
                    shadow-sm
                    border
                    p-5
                ">

                    <p className="
                        text-sm
                        text-gray-500
                    ">
                        Total
                    </p>

                    <p className="
                        text-2xl
                        font-bold
                        text-gray-800
                        mt-1
                    ">
                        {pagination.total}
                    </p>

                </div>

                <div className="
                    bg-white
                    rounded-xl
                    shadow-sm
                    border
                    p-5
                ">

                    <p className="
                        text-sm
                        text-gray-500
                    ">
                        Non lues
                    </p>

                    <p className="
                        text-2xl
                        font-bold
                        text-red-600
                        mt-1
                    ">
                        {unreadCount}
                    </p>

                </div>

            </div>

            {/* ================================================= */}
            {/* ERREUR */}
            {/* ================================================= */}

            {error && (
                <div className="
                    bg-red-50
                    border
                    border-red-200
                    text-red-700
                    rounded-xl
                    p-4
                ">
                    {error}
                </div>
            )}

            {/* ================================================= */}
            {/* NOTIFICATIONS */}
            {/* ================================================= */}

            <div className="
                bg-white
                rounded-xl
                shadow-sm
                border
                overflow-hidden
            ">

                {notifications.length === 0 ? (

                    <div className="
                        py-16
                        text-center
                        text-gray-500
                    ">

                        <Bell
                            size={48}
                            className="
                                mx-auto
                                mb-4
                                text-gray-300
                            "
                        />

                        <p className="
                            text-lg
                            font-medium
                        ">
                            Aucune notification
                        </p>

                        <p className="
                            text-sm
                            mt-1
                        ">
                            Vous êtes à jour.
                        </p>

                    </div>

                ) : (

                    <div className="divide-y">

                        {notifications.map(
                            (notification) => {

                                const data =
                                    parseNotificationData(
                                        notification.data
                                    );

                                const title =
                                    data.title ||
                                    data.titre ||
                                    data.subject ||
                                    getTypeLabel(
                                        notification.type
                                    );

                                const message =
                                    data.message ||
                                    data.description ||
                                    data.content ||
                                    data.text ||
                                    "Nouvelle notification";

                                const isRead =
                                    !!notification.read_at;

                                return (
                                    <div
                                        key={
                                            notification.id
                                        }
                                        className={`
                                            p-5
                                            flex
                                            flex-col
                                            sm:flex-row
                                            gap-4
                                            sm:items-center
                                            justify-between
                                            ${
                                                isRead
                                                    ? "bg-white"
                                                    : "bg-blue-50"
                                            }
                                        `}
                                    >

                                        {/* CONTENU */}

                                        <div className="
                                            flex
                                            gap-4
                                            min-w-0
                                        ">

                                            <div className={`
                                                w-11
                                                h-11
                                                rounded-full
                                                flex
                                                items-center
                                                justify-center
                                                shrink-0
                                                ${getIconStyle(
                                                    notification.type
                                                )}
                                            `}>
                                                {getIcon(
                                                    notification.type
                                                )}
                                            </div>

                                            <div className="min-w-0">

                                                <div className="
                                                    flex
                                                    items-center
                                                    gap-2
                                                    flex-wrap
                                                ">

                                                    <h3 className="
                                                        font-semibold
                                                        text-gray-800
                                                    ">
                                                        {title}
                                                    </h3>

                                                    {!isRead && (
                                                        <span className="
                                                            px-2
                                                            py-1
                                                            text-xs
                                                            rounded-full
                                                            bg-blue-600
                                                            text-white
                                                        ">
                                                            Nouveau
                                                        </span>
                                                    )}

                                                </div>

                                                <p className="
                                                    text-gray-600
                                                    text-sm
                                                    mt-1
                                                ">
                                                    {message}
                                                </p>

                                                {/* INFORMATIONS DATA */}

                                                <div className="
                                                    flex
                                                    flex-wrap
                                                    gap-3
                                                    mt-2
                                                ">

                                                    {data.patient_id && (
                                                        <span className="
                                                            text-xs
                                                            bg-gray-100
                                                            text-gray-600
                                                            px-2
                                                            py-1
                                                            rounded
                                                        ">
                                                            Patient #{data.patient_id}
                                                        </span>
                                                    )}

                                                    {data.user_id && (
                                                        <span className="
                                                            text-xs
                                                            bg-gray-100
                                                            text-gray-600
                                                            px-2
                                                            py-1
                                                            rounded
                                                        ">
                                                            Utilisateur #{data.user_id}
                                                        </span>
                                                    )}

                                                    {data.date && (
                                                        <span className="
                                                            text-xs
                                                            bg-gray-100
                                                            text-gray-600
                                                            px-2
                                                            py-1
                                                            rounded
                                                        ">
                                                            {data.date}
                                                        </span>
                                                    )}

                                                </div>

                                                <p className="
                                                    text-xs
                                                    text-gray-400
                                                    mt-2
                                                ">
                                                    {notification.created_at
                                                        ? new Date(
                                                              notification.created_at
                                                          ).toLocaleString(
                                                              "fr-FR"
                                                          )
                                                        : ""}
                                                </p>

                                            </div>

                                        </div>

                                        {/* ACTIONS */}

                                        <div className="
                                            flex
                                            items-center
                                            gap-2
                                            sm:shrink-0
                                        ">

                                            {!isRead && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        markAsRead(
                                                            notification.id
                                                        )
                                                    }
                                                    title="Marquer comme lue"
                                                    className="
                                                        p-2
                                                        rounded-lg
                                                        text-green-600
                                                        hover:bg-green-100
                                                    "
                                                >
                                                    <Check
                                                        size={19}
                                                    />
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    deleteNotification(
                                                        notification.id
                                                    )
                                                }
                                                title="Supprimer"
                                                className="
                                                    p-2
                                                    rounded-lg
                                                    text-red-600
                                                    hover:bg-red-100
                                                "
                                            >
                                                <Trash2
                                                    size={19}
                                                />
                                            </button>

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

            </div>

            {/* ================================================= */}
            {/* PAGINATION */}
            {/* ================================================= */}

            {pagination.last_page > 1 && (
                <div className="
                    bg-white
                    rounded-xl
                    shadow-sm
                    border
                    p-4
                    flex
                    flex-col
                    sm:flex-row
                    items-center
                    justify-between
                    gap-4
                ">

                    <p className="
                        text-sm
                        text-gray-500
                    ">
                        Page{" "}
                        <strong>
                            {pagination.current_page}
                        </strong>{" "}
                        sur{" "}
                        <strong>
                            {pagination.last_page}
                        </strong>
                    </p>

                    <div className="
                        flex
                        items-center
                        gap-1
                    ">

                        <button
                            type="button"
                            disabled={
                                currentPage === 1
                            }
                            onClick={() =>
                                goToPage(
                                    currentPage - 1
                                )
                            }
                            className="
                                p-2
                                border
                                rounded-lg
                                disabled:opacity-40
                            "
                        >
                            <ChevronLeft size={18} />
                        </button>

                        {pages.map((page) => (
                            <button
                                key={page}
                                type="button"
                                onClick={() =>
                                    goToPage(page)
                                }
                                className={`
                                    min-w-[38px]
                                    h-[38px]
                                    rounded-lg
                                    ${
                                        page === currentPage
                                            ? "bg-blue-600 text-white"
                                            : "border text-gray-600 hover:bg-gray-100"
                                    }
                                `}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            type="button"
                            disabled={
                                currentPage ===
                                pagination.last_page
                            }
                            onClick={() =>
                                goToPage(
                                    currentPage + 1
                                )
                            }
                            className="
                                p-2
                                border
                                rounded-lg
                                disabled:opacity-40
                            "
                        >
                            <ChevronRight size={18} />
                        </button>

                    </div>

                </div>
            )}

            <div className="
                text-center
                text-xs
                text-gray-400
            ">
                Actualisation automatique toutes les 30 secondes
            </div>

        </div>
    );
}

// =====================================================
// LABEL TYPE
// =====================================================

function getTypeLabel(type) {
    switch (type) {
        case "rendez_vous":
            return "Nouveau rendez-vous";

        case "patient":
            return "Nouveau patient";

        case "paiement":
            return "Nouveau paiement";

        case "message":
            return "Nouveau message";

        default:
            return "Notification";
    }
}

export default Notifications;