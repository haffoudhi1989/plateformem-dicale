import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    UserRoundCog,
    Plus,
    Search,
    Eye,
    Pencil,
    Trash2,
    CheckCircle2,
    XCircle,
    Phone,
    Mail,
    CalendarDays,
    Loader2
} from "lucide-react";

function SecretairesList() {

    // =====================================================
    // CONFIGURATION API
    // =====================================================

    // CRA : la variable est exposée via process.env.REACT_APP_*.
    const API_URL =
        process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";


    // =====================================================
    // ETATS
    // =====================================================

    const [secretaires, setSecretaires] = useState([]);
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const [error, setError] = useState("");


    // =====================================================
    // CHARGER LES SECRETaires
    // =====================================================

    useEffect(() => {
        fetchSecretaires();
    }, []);


    const fetchSecretaires = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/secretaires`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json", Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
                    }
                }
            );

            const result = await response.json();

            console.log(
                "Réponse secrétaires :",
                result
            );


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "Impossible de récupérer les secrétaires."
                );
            }


            /*
             * Le backend doit retourner :
             *
             * {
             *     success: true,
             *     data: [...]
             * }
             */

            setSecretaires(
                Array.isArray(result.data)
                    ? result.data
                    : []
            );


        } catch (err) {

            console.error(
                "Erreur chargement secrétaires :",
                err
            );

            setError(
                err.message ||
                "Impossible de charger les secrétaires."
            );

        } finally {

            setLoading(false);

        }
    };


    // =====================================================
    // RECHERCHE
    // =====================================================

    const filteredSecretaires =
        secretaires.filter((secretaire) => {

            const text = `
                ${secretaire.nom || ""}
                ${secretaire.prenom || ""}
                ${secretaire.email || ""}
                ${secretaire.telephone || ""}
                ${secretaire.cabinet?.nom || ""}
                ${secretaire.cabinet?.name || ""}
            `.toLowerCase();

            return text.includes(
                search.toLowerCase()
            );

        });


    // =====================================================
    // SUPPRESSION
    // =====================================================

    const handleDelete = async (id) => {

        const confirmer = window.confirm(
            "Voulez-vous vraiment supprimer cette secrétaire ?"
        );

        if (!confirmer) {
            return;
        }


        try {

            setDeletingId(id);
            setError("");


            const response = await fetch(
                `${API_URL}/secretaires/${id}`,
                {
                    method: "DELETE",

                    headers: {
                        Accept: "application/json", Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
                    }
                }
            );


            const result =
                await response.json();


            console.log(
                "Réponse suppression :",
                result
            );


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "Erreur lors de la suppression."
                );
            }


            /*
             * Suppression locale
             * sans recharger la page.
             */

            setSecretaires((current) =>
                current.filter(
                    (secretaire) =>
                        secretaire.id !== id
                )
            );


        } catch (err) {

            console.error(
                "Erreur suppression secrétaire :",
                err
            );

            setError(
                err.message ||
                "Impossible de supprimer la secrétaire."
            );

        } finally {

            setDeletingId(null);

        }
    };


    // =====================================================
    // STATUT
    // =====================================================

    const getStatusStyle = (actif) => {

        const isActive =
            actif === true ||
            actif === 1 ||
            actif === "1";


        if (isActive) {

            return {

                container:
                    "bg-emerald-50 text-emerald-700 border border-emerald-200",

                icon: (
                    <CheckCircle2 size={14} />
                ),

                text: "Actif"
            };
        }


        return {

            container:
                "bg-red-50 text-red-700 border border-red-200",

            icon: (
                <XCircle size={14} />
            ),

            text: "Inactif"
        };
    };


    // =====================================================
    // VERIFIER STATUT
    // =====================================================

    const isActive = (actif) => {

        return (
            actif === true ||
            actif === 1 ||
            actif === "1"
        );
    };


    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }


        const value =
            new Date(date);


        if (
            Number.isNaN(
                value.getTime()
            )
        ) {

            return date;
        }


        return value.toLocaleDateString(
            "fr-FR"
        );
    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="
            min-h-screen
            bg-slate-50
        ">

            <div>


                {/* =================================================
                    HEADER
                ================================================= */}

                                <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                            <UserRoundCog size={26} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                                Secrétaires
                            </h1>
                            <p className="text-blue-100 text-sm mt-0.5">
                                Gestion des secrétaires du cabinet
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                        to="/admin/cabinet/secretaires/add"
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
                            shadow-md
                            transition
                        "
                    >
                        <Plus size={18} />
                        Ajouter une secrétaire
                    </Link>
                    </div>
                </div>


                {/* =================================================
                    ERREUR
                ================================================= */}

                {error && (

                    <div className="
                        mb-6
                        rounded-xl
                        border
                        border-red-200
                        bg-red-50
                        px-4
                        py-3
                        text-sm
                        text-red-700
                    ">

                        {error}

                    </div>

                )}


                {/* =================================================
                    STATISTIQUES
                ================================================= */}

                <div className="
                    grid
                    grid-cols-1
                    sm:grid-cols-2
                    lg:grid-cols-3
                    gap-4
                    mb-6
                ">


                    {/* TOTAL */}

                    <div className="
                        bg-white
                        rounded-2xl
                        border
                        border-slate-200
                        p-5
                        shadow-sm
                    ">

                        <p className="
                            text-sm
                            text-slate-500
                        ">
                            Total secrétaires
                        </p>


                        <p className="
                            text-3xl
                            font-bold
                            text-slate-900
                            mt-2
                        ">
                            {secretaires.length}
                        </p>

                    </div>


                    {/* ACTIVES */}

                    <div className="
                        bg-white
                        rounded-2xl
                        border
                        border-slate-200
                        p-5
                        shadow-sm
                    ">

                        <p className="
                            text-sm
                            text-slate-500
                        ">
                            Secrétaires actives
                        </p>


                        <p className="
                            text-3xl
                            font-bold
                            text-emerald-600
                            mt-2
                        ">

                            {
                                secretaires.filter(
                                    (item) =>
                                        isActive(
                                            item.actif
                                        )
                                ).length
                            }

                        </p>

                    </div>


                    {/* INACTIVES */}

                    <div className="
                        bg-white
                        rounded-2xl
                        border
                        border-slate-200
                        p-5
                        shadow-sm
                    ">

                        <p className="
                            text-sm
                            text-slate-500
                        ">
                            Secrétaires inactives
                        </p>


                        <p className="
                            text-3xl
                            font-bold
                            text-red-500
                            mt-2
                        ">

                            {
                                secretaires.filter(
                                    (item) =>
                                        !isActive(
                                            item.actif
                                        )
                                ).length
                            }

                        </p>

                    </div>

                </div>


                {/* =================================================
                    RECHERCHE
                ================================================= */}

                <div className="
                    bg-white
                    rounded-2xl
                    border
                    border-slate-200
                    p-4
                    mb-6
                    shadow-sm
                ">

                    <div className="
                        relative
                        max-w-md
                    ">

                        <Search
                            size={19}
                            className="
                                absolute
                                left-3
                                top-1/2
                                -translate-y-1/2
                                text-slate-400
                            "
                        />


                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            placeholder="Rechercher une secrétaire..."
                            className="
                                w-full
                                h-11
                                pl-10
                                pr-4
                                rounded-xl
                                border
                                border-slate-200
                                bg-slate-50
                                text-sm
                                outline-none
                                focus:border-blue-500
                                focus:ring-4
                                focus:ring-blue-500/10
                            "
                        />

                    </div>

                </div>


                {/* =================================================
                    TABLEAU
                ================================================= */}

                <div className="
                    bg-white
                    rounded-2xl
                    border
                    border-slate-200
                    shadow-sm
                    overflow-hidden
                ">

                    <div className="overflow-x-auto">

                        <table className="
                            w-full
                            min-w-[1000px]
                        ">


                            {/* =================================================
                                HEAD
                            ================================================= */}

                            <thead className="
                                bg-slate-50
                                border-b
                                border-slate-200
                            ">

                                <tr>

                                    <th className="
                                        text-left
                                        px-6
                                        py-4
                                        text-xs
                                        font-semibold
                                        text-slate-500
                                        uppercase
                                    ">
                                        Secrétaire
                                    </th>


                                    <th className="
                                        text-left
                                        px-6
                                        py-4
                                        text-xs
                                        font-semibold
                                        text-slate-500
                                        uppercase
                                    ">
                                        Contact
                                    </th>


                                    <th className="
                                        text-left
                                        px-6
                                        py-4
                                        text-xs
                                        font-semibold
                                        text-slate-500
                                        uppercase
                                    ">
                                        Cabinet
                                    </th>


                                    <th className="
                                        text-left
                                        px-6
                                        py-4
                                        text-xs
                                        font-semibold
                                        text-slate-500
                                        uppercase
                                    ">
                                        Statut
                                    </th>


                                    <th className="
                                        text-left
                                        px-6
                                        py-4
                                        text-xs
                                        font-semibold
                                        text-slate-500
                                        uppercase
                                    ">
                                        Création
                                    </th>


                                    <th className="
                                        text-right
                                        px-6
                                        py-4
                                        text-xs
                                        font-semibold
                                        text-slate-500
                                        uppercase
                                    ">
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            {/* =================================================
                                BODY
                            ================================================= */}

                            <tbody className="
                                divide-y
                                divide-slate-100
                            ">


                                {/* LOADING */}

                                {loading && (

                                    <tr>

                                        <td
                                            colSpan="6"
                                            className="
                                                px-6
                                                py-16
                                                text-center
                                            "
                                        >

                                            <div className="
                                                flex
                                                flex-col
                                                items-center
                                                justify-center
                                            ">

                                                <Loader2
                                                    size={32}
                                                    className="
                                                        animate-spin
                                                        text-blue-600
                                                    "
                                                />


                                                <p className="
                                                    mt-3
                                                    text-sm
                                                    text-slate-500
                                                ">
                                                    Chargement des secrétaires...
                                                </p>

                                            </div>

                                        </td>

                                    </tr>

                                )}


                                {/* DONNEES */}

                                {!loading &&
                                    filteredSecretaires.length > 0 &&
                                    filteredSecretaires.map(
                                        (secretaire) => {

                                            const status =
                                                getStatusStyle(
                                                    secretaire.actif
                                                );


                                            const prenom =
                                                secretaire.prenom ||
                                                "";


                                            const nom =
                                                secretaire.nom ||
                                                "";


                                            const cabinet =
                                                secretaire.cabinet?.nom ||
                                                secretaire.cabinet?.name ||
                                                "Aucun cabinet";


                                            return (

                                                <tr
                                                    key={
                                                        secretaire.id
                                                    }
                                                    className="
                                                        hover:bg-slate-50
                                                        transition
                                                    "
                                                >


                                                    {/* =================================================
                                                        SECRETARY
                                                    ================================================= */}

                                                    <td className="
                                                        px-6
                                                        py-5
                                                    ">

                                                        <div className="
                                                            flex
                                                            items-center
                                                            gap-3
                                                        ">


                                                            <div className="
                                                                w-11
                                                                h-11
                                                                rounded-full
                                                                bg-blue-100
                                                                text-blue-700
                                                                flex
                                                                items-center
                                                                justify-center
                                                                font-bold
                                                                uppercase
                                                            ">

                                                                {prenom.charAt(0)}
                                                                {nom.charAt(0)}

                                                            </div>


                                                            <div>

                                                                <p className="
                                                                    font-semibold
                                                                    text-slate-900
                                                                ">

                                                                    {prenom}{" "}
                                                                    {nom}

                                                                </p>


                                                                <p className="
                                                                    text-xs
                                                                    text-slate-500
                                                                    mt-1
                                                                ">

                                                                    ID :{" "}
                                                                    {
                                                                        secretaire.id
                                                                    }

                                                                </p>

                                                            </div>

                                                        </div>

                                                    </td>


                                                    {/* =================================================
                                                        CONTACT
                                                    ================================================= */}

                                                    <td className="
                                                        px-6
                                                        py-5
                                                    ">

                                                        <div className="
                                                            space-y-1
                                                        ">


                                                            <div className="
                                                                flex
                                                                items-center
                                                                gap-2
                                                                text-sm
                                                                text-slate-600
                                                            ">

                                                                <Mail
                                                                    size={14}
                                                                />

                                                                <span>
                                                                    {
                                                                        secretaire.email ||
                                                                        "-"
                                                                    }
                                                                </span>

                                                            </div>


                                                            <div className="
                                                                flex
                                                                items-center
                                                                gap-2
                                                                text-sm
                                                                text-slate-600
                                                            ">

                                                                <Phone
                                                                    size={14}
                                                                />

                                                                <span>
                                                                    {
                                                                        secretaire.telephone ||
                                                                        "-"
                                                                    }
                                                                </span>

                                                            </div>

                                                        </div>

                                                    </td>


                                                    {/* =================================================
                                                        CABINET
                                                    ================================================= */}

                                                    <td className="
                                                        px-6
                                                        py-5
                                                    ">

                                                        <span className="
                                                            text-sm
                                                            font-medium
                                                            text-slate-700
                                                        ">

                                                            {cabinet}

                                                        </span>

                                                    </td>


                                                    {/* =================================================
                                                        STATUT
                                                    ================================================= */}

                                                    <td className="
                                                        px-6
                                                        py-5
                                                    ">

                                                        <span
                                                            className={`
                                                                inline-flex
                                                                items-center
                                                                gap-1.5
                                                                px-3
                                                                py-1.5
                                                                rounded-full
                                                                text-xs
                                                                font-semibold
                                                                ${status.container}
                                                            `}
                                                        >

                                                            {status.icon}

                                                            {status.text}

                                                        </span>

                                                    </td>


                                                    {/* =================================================
                                                        DATE
                                                    ================================================= */}

                                                    <td className="
                                                        px-6
                                                        py-5
                                                    ">

                                                        <div className="
                                                            flex
                                                            items-center
                                                            gap-2
                                                            text-sm
                                                            text-slate-600
                                                        ">

                                                            <CalendarDays
                                                                size={15}
                                                            />

                                                            {
                                                                formatDate(
                                                                    secretaire.created_at
                                                                )
                                                            }

                                                        </div>

                                                    </td>


                                                    {/* =================================================
                                                        ACTIONS
                                                    ================================================= */}

                                                    <td className="
                                                        px-6
                                                        py-5
                                                    ">

                                                        <div className="
                                                            flex
                                                            items-center
                                                            justify-end
                                                            gap-2
                                                        ">


                                                            {/* VOIR */}

                                                            <Link
                                                                to={`/admin/cabinet/secretaires/${secretaire.id}`}
                                                                className="
                                                                    w-9
                                                                    h-9
                                                                    rounded-lg
                                                                    bg-slate-100
                                                                    text-slate-600
                                                                    flex
                                                                    items-center
                                                                    justify-center
                                                                    hover:bg-blue-100
                                                                    hover:text-blue-700
                                                                    transition
                                                                "
                                                                title="Voir"
                                                            >

                                                                <Eye
                                                                    size={17}
                                                                />

                                                            </Link>


                                                            {/* MODIFIER */}

                                                            <Link
                                                                to={`/admin/cabinet/secretaires/edit/${secretaire.id}`}
                                                                className="
                                                                    w-9
                                                                    h-9
                                                                    rounded-lg
                                                                    bg-slate-100
                                                                    text-slate-600
                                                                    flex
                                                                    items-center
                                                                    justify-center
                                                                    hover:bg-amber-100
                                                                    hover:text-amber-700
                                                                    transition
                                                                "
                                                                title="Modifier"
                                                            >

                                                                <Pencil
                                                                    size={17}
                                                                />

                                                            </Link>


                                                            {/* SUPPRIMER */}

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    deletingId ===
                                                                    secretaire.id
                                                                }
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        secretaire.id
                                                                    )
                                                                }
                                                                className="
                                                                    w-9
                                                                    h-9
                                                                    rounded-lg
                                                                    bg-slate-100
                                                                    text-slate-600
                                                                    flex
                                                                    items-center
                                                                    justify-center
                                                                    hover:bg-red-100
                                                                    hover:text-red-700
                                                                    disabled:opacity-50
                                                                    disabled:cursor-not-allowed
                                                                    transition
                                                                "
                                                                title="Supprimer"
                                                            >

                                                                {deletingId ===
                                                                secretaire.id ? (

                                                                    <Loader2
                                                                        size={17}
                                                                        className="animate-spin"
                                                                    />

                                                                ) : (

                                                                    <Trash2
                                                                        size={17}
                                                                    />

                                                                )}

                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            );

                                        }
                                    )}


                                {/* =================================================
                                    AUCUN RESULTAT
                                ================================================= */}

                                {!loading &&
                                    filteredSecretaires.length === 0 && (

                                        <tr>

                                            <td
                                                colSpan="6"
                                                className="
                                                    px-6
                                                    py-16
                                                    text-center
                                                "
                                            >

                                                <div className="
                                                    flex
                                                    flex-col
                                                    items-center
                                                ">

                                                    <UserRoundCog
                                                        size={42}
                                                        className="
                                                            text-slate-300
                                                        "
                                                    />


                                                    <p className="
                                                        mt-4
                                                        font-semibold
                                                        text-slate-700
                                                    ">
                                                        Aucune secrétaire trouvée
                                                    </p>


                                                    <p className="
                                                        text-sm
                                                        text-slate-400
                                                        mt-1
                                                    ">
                                                        {
                                                            search
                                                                ? "Aucun résultat pour cette recherche."
                                                                : "Ajoutez votre première secrétaire."
                                                        }
                                                    </p>


                                                    {!search && (

                                                        <Link
                                                            to="/admin/cabinet/secretaires/add"
                                                            className="
                                                                mt-5
                                                                inline-flex
                                                                items-center
                                                                gap-2
                                                                px-4
                                                                py-2
                                                                rounded-xl
                                                                bg-blue-700
                                                                text-white
                                                                text-sm
                                                                font-semibold
                                                                hover:bg-blue-800
                                                                transition
                                                            "
                                                        >

                                                            <Plus
                                                                size={17}
                                                            />

                                                            Ajouter une secrétaire

                                                        </Link>

                                                    )}

                                                </div>

                                            </td>

                                        </tr>

                                    )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default SecretairesList;