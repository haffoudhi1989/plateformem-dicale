import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    Stethoscope,
    UserPlus,
    Eye,
    Pencil,
    Trash2,
    Search,
    Phone,
    Mail,
    Users,
} from "lucide-react";

function Doctors() {
    const navigate = useNavigate();

    // =====================================================
    // CONFIGURATION API
    // =====================================================

    // CRA : la variable est exposée via process.env.REACT_APP_*.
    const API_BASE =
        process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

    const API = `${API_BASE}/medecins`;

    // Racine du serveur : sert les fichiers /storage (photos)
    const API_ROOT = API.replace(/\/api\/.*$/, "");

    // =====================================================
    // ETATS
    // =====================================================

    const [medecins, setMedecins] = useState([]);
    const [specialites, setSpecialites] = useState([]);
    const [selectedSpecialite, setSelectedSpecialite] = useState("Toutes");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =====================================================
    // CHARGER LES MEDECINS
    // =====================================================

    const getMedecins = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(API, {
                headers: {
                    Accept: "application/json",
                },
            });

            let data = [];

            if (Array.isArray(response.data)) {
                data = response.data;
            } else if (Array.isArray(response.data?.data)) {
                data = response.data.data;
            }

            setMedecins(data);
        } catch (error) {
            console.error(
                "Erreur API médecins :",
                error.response?.data || error
            );

            setMedecins([]);

            setError(
                error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    "Impossible de charger les médecins."
            );
        } finally {
            setLoading(false);
        }
    };

    const getSpecialites = async () => {
        try {
            const response = await axios.get("http://localhost:8000/api/specialites");
            let data = response.data;
            if (data.data) data = data.data;
            if (Array.isArray(data)) setSpecialites(data);
        } catch (e) {
            console.error("Erreur chargement spécialités:", e);
        }
    };

    useEffect(() => {
        getMedecins();
        getSpecialites();
    }, []);

    // =====================================================
    // VOIR
    // =====================================================

    const handleView = (medecin) => {
        navigate(`/admin/doctors/${medecin.id}`);
    };

    // =====================================================
    // MODIFIER
    // =====================================================

    const handleEdit = (medecin) => {
        navigate(`/admin/doctors/edit/${medecin.id}`);
    };

    // =====================================================
    // SUPPRIMER
    // =====================================================

    const handleDelete = async (id) => {
        const confirmation = window.confirm(
            "Voulez-vous vraiment supprimer ce médecin ?"
        );

        if (!confirmation) {
            return;
        }

        try {
            await axios.delete(`${API}/${id}`, {
                headers: {
                    Accept: "application/json",
                },
            });

            setMedecins((prev) =>
                prev.filter((medecin) => medecin.id !== id)
            );

            alert("Médecin supprimé avec succès.");
        } catch (error) {
            console.error(
                "Erreur suppression médecin :",
                error.response?.data || error
            );

            alert(
                error.response?.data?.message ||
                    "Erreur lors de la suppression du médecin."
            );
        }
    };

    // =====================================================
    // SPECIALITE
    // =====================================================

    const getSpecialite = (medecin) => {
        if (!medecin) return "Non définie";

        const specialite = medecin.specialite;

        if (typeof specialite === "object" && specialite !== null) {
            return (
                specialite.nom ||
                specialite.name ||
                specialite.libelle ||
                "Non définie"
            );
        }

        if (typeof specialite === "string" && specialite.trim() !== "") {
            return specialite;
        }

        if (medecin.specialite_nom) {
            return medecin.specialite_nom;
        }

        return "Non définie";
    };

    // =====================================================
    // RECHERCHE ET FILTRE
    // =====================================================

    const medecinsFiltres = medecins.filter((medecin) => {
        const specNom = getSpecialite(medecin);

        // Filtre par sélecteur de spécialité
        if (selectedSpecialite !== "Toutes") {
            if (specNom.toLowerCase() !== selectedSpecialite.toLowerCase()) {
                return false;
            }
        }

        // Filtre par recherche textuelle
        const texte = `
            ${medecin.nom || ""}
            ${medecin.prenom || ""}
            ${specNom}
            ${medecin.telephone || ""}
            ${medecin.email || ""}
        `.toLowerCase();

        return texte.includes(search.toLowerCase());
    });

    // =====================================================
    // CHARGEMENT
    // =====================================================

    if (loading) {
        return (
            <div className="min-h-[500px] flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-700 rounded-full animate-spin mx-auto" />

                    <p className="mt-5 text-sm font-semibold text-slate-700">
                        Chargement des médecins...
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        Récupération des données
                    </p>
                </div>
            </div>
        );
    }

    // =====================================================
    // INTERFACE
    // =====================================================

    return (
        <div className="min-h-full bg-slate-50 space-y-6">

            {/* =================================================
                EN-TÊTE
            ================================================= */}

                        <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <Stethoscope
                            size={26}
                            className="text-white"
                        />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                            Médecins
                        </h1>
                        <p className="text-blue-100 text-sm mt-0.5">
                            Consultez et gérez les médecins enregistrés.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                <button
                    type="button"
                    onClick={() =>
                        navigate("/admin/doctors/add")
                    }
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
                    <UserPlus size={18} />
                    Ajouter médecin
                </button>
                </div>
            </div>

            {/* =================================================
                ERREUR
            ================================================= */}

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

                    <p className="text-sm font-bold text-red-800">
                        Erreur de connexion à l'API
                    </p>

                    <p className="text-sm text-red-600 mt-1">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={getMedecins}
                        className="
                            mt-3
                            px-4
                            py-2
                            rounded-lg
                            bg-red-600
                            hover:bg-red-700
                            text-white
                            text-sm
                            font-semibold
                        "
                    >
                        Réessayer
                    </button>

                </div>
            )}

            {/* =================================================
                STATISTIQUE
            ================================================= */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="
                    bg-white
                    border
                    border-slate-200
                    rounded-2xl
                    p-5
                    shadow-sm
                    flex
                    items-center
                    gap-4
                ">

                    <div className="
                        w-12
                        h-12
                        rounded-xl
                        bg-blue-50
                        text-blue-700
                        flex
                        items-center
                        justify-center
                    ">
                        <Users size={23} />
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">
                            Médecins enregistrés
                        </p>

                        <p className="text-2xl font-bold text-slate-900">
                            {medecins.length}
                        </p>
                    </div>

                </div>

                <div className="
                    bg-white
                    border
                    border-slate-200
                    rounded-2xl
                    p-5
                    shadow-sm
                    flex
                    items-center
                    gap-4
                ">

                    <div className="
                        w-12
                        h-12
                        rounded-xl
                        bg-emerald-50
                        text-emerald-600
                        flex
                        items-center
                        justify-center
                    ">
                        <Stethoscope size={23} />
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">
                            Résultats affichés
                        </p>

                        <p className="text-2xl font-bold text-slate-900">
                            {medecinsFiltres.length}
                        </p>
                    </div>

                </div>

            </div>

            {/* =================================================
                RECHERCHE ET FILTRE PAR SPÉCIALITÉ
            ================================================= */}

            <div className="
                bg-white
                border
                border-slate-200
                rounded-2xl
                p-4
                shadow-sm
                flex
                flex-col
                md:flex-row
                gap-4
            ">

                <div className="relative flex-1">

                    <Search
                        size={19}
                        className="
                            absolute
                            left-4
                            top-1/2
                            -translate-y-1/2
                            text-slate-400
                        "
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Rechercher par nom, prénom, téléphone, email..."
                        className="
                            w-full
                            pl-11
                            pr-4
                            py-3
                            rounded-xl
                            border
                            border-slate-200
                            bg-slate-50
                            text-sm
                            outline-none
                            focus:bg-white
                            focus:border-blue-500
                            focus:ring-2
                            focus:ring-blue-100
                            transition
                        "
                    />

                </div>

                <select
                    value={selectedSpecialite}
                    onChange={(e) => setSelectedSpecialite(e.target.value)}
                    className="
                        bg-slate-50
                        border
                        border-slate-200
                        px-4
                        py-3
                        rounded-xl
                        text-sm
                        font-semibold
                        text-slate-700
                        outline-none
                        focus:bg-white
                        focus:border-blue-500
                        focus:ring-2
                        focus:ring-blue-100
                        transition
                        cursor-pointer
                    "
                >
                    <option value="Toutes">Toutes les spécialités</option>

                    {specialites.map((spec) => (
                        <option key={spec.id || spec.nom} value={spec.nom}>
                            {spec.nom}
                        </option>
                    ))}

                    {Array.from(
                        new Set(
                            medecins
                                .map((m) => getSpecialite(m))
                                .filter(
                                    (s) =>
                                        s &&
                                        s !== "Non définie" &&
                                        !specialites.some((sp) => sp.nom === s)
                                )
                        )
                    ).map((specName) => (
                        <option key={specName} value={specName}>
                            {specName}
                        </option>
                    ))}
                </select>

            </div>

            {/* =================================================
                TABLEAU
            ================================================= */}

            <div className="
                bg-white
                border
                border-slate-200
                rounded-3xl
                shadow-sm
                overflow-hidden
            ">

                {/* HEADER TABLEAU */}

                <div className="
                    px-6
                    py-5
                    border-b
                    border-slate-100
                    flex
                    flex-col
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                    gap-3
                ">

                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            Liste des médecins
                        </h2>

                        <p className="text-xs text-slate-400 mt-1">
                            Gestion des professionnels de santé
                        </p>
                    </div>

                    <span className="
                        inline-flex
                        items-center
                        justify-center
                        px-3
                        py-1.5
                        rounded-full
                        bg-blue-50
                        text-blue-700
                        text-xs
                        font-semibold
                    ">
                        {medecinsFiltres.length} médecin
                        {medecinsFiltres.length !== 1
                            ? "s"
                            : ""}
                    </span>

                </div>

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[950px]">

                        <thead className="bg-slate-50">

                            <tr>

                                <th className="
                                    px-6
                                    py-4
                                    text-left
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    text-slate-500
                                ">
                                    Médecin
                                </th>

                                <th className="
                                    px-6
                                    py-4
                                    text-left
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    text-slate-500
                                ">
                                    Spécialité
                                </th>

                                <th className="
                                    px-6
                                    py-4
                                    text-left
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    text-slate-500
                                ">
                                    Téléphone
                                </th>

                                <th className="
                                    px-6
                                    py-4
                                    text-left
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    text-slate-500
                                ">
                                    Email
                                </th>

                                <th className="
                                    px-6
                                    py-4
                                    text-center
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    text-slate-500
                                ">
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-slate-100">

                            {medecinsFiltres.length > 0 ? (

                                medecinsFiltres.map((medecin) => {

                                    const nomComplet = `
                                        ${medecin.prenom || ""}
                                        ${medecin.nom || ""}
                                    `.trim();

                                    const specialite =
                                        getSpecialite(medecin);

                                    const initiale =
                                        (
                                            medecin.prenom?.charAt(0) ||
                                            medecin.nom?.charAt(0) ||
                                            "M"
                                        ).toUpperCase();

                                    return (
                                        <tr
                                            key={medecin.id}
                                            className="
                                                hover:bg-blue-50/40
                                                transition-colors
                                                group
                                            "
                                        >

                                            {/* MEDECIN */}

                                            <td className="px-6 py-5">

                                                <div className="flex items-center gap-3">

                                                    <div className="
                                                        w-11
                                                        h-11
                                                        rounded-xl
                                                        relative
                                                        overflow-hidden
                                                        bg-gradient-to-br
                                                        from-blue-600
                                                        to-blue-800
                                                        text-white
                                                        flex
                                                        items-center
                                                        justify-center
                                                        font-bold
                                                        shadow-sm
                                                        shrink-0
                                                    ">
                                                        {/* Initiale : visible tant que la photo n'est pas chargée */}
                                                        <span>{initiale}</span>

                                                        {medecin.photo && (
                                                            <img
                                                                src={`${API_ROOT}/storage/${medecin.photo}`}
                                                                alt={nomComplet}
                                                                className="absolute inset-0 w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = "none";
                                                                }}
                                                            />
                                                        )}
                                                    </div>

                                                    <div>

                                                        <p className="
                                                            text-sm
                                                            font-bold
                                                            text-slate-800
                                                        ">
                                                            {nomComplet || "-"}
                                                        </p>

                                                        <p className="
                                                            text-xs
                                                            text-slate-400
                                                            mt-0.5
                                                        ">
                                                            Médecin
                                                        </p>

                                                    </div>

                                                </div>

                                            </td>

                                            {/* SPECIALITE */}

                                            <td className="px-6 py-5">

                                                <span className="
                                                    inline-flex
                                                    px-3
                                                    py-1.5
                                                    rounded-lg
                                                    bg-blue-50
                                                    text-blue-700
                                                    text-xs
                                                    font-semibold
                                                ">
                                                    {specialite}
                                                </span>

                                            </td>

                                            {/* TELEPHONE */}

                                            <td className="px-6 py-5">

                                                <div className="flex items-center gap-2">

                                                    <Phone
                                                        size={15}
                                                        className="text-slate-400"
                                                    />

                                                    <span className="
                                                        text-sm
                                                        text-slate-600
                                                    ">
                                                        {medecin.telephone || "-"}
                                                    </span>

                                                </div>

                                            </td>

                                            {/* EMAIL */}

                                            <td className="px-6 py-5">

                                                <div className="flex items-center gap-2">

                                                    <Mail
                                                        size={15}
                                                        className="text-slate-400"
                                                    />

                                                    <span className="
                                                        text-sm
                                                        text-slate-600
                                                    ">
                                                        {medecin.email || "-"}
                                                    </span>

                                                </div>

                                            </td>

                                            {/* ACTIONS */}

                                            <td className="px-6 py-5">

                                                <div className="
                                                    flex
                                                    items-center
                                                    justify-center
                                                    gap-2
                                                ">

                                                    {/* VOIR */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleView(medecin)
                                                        }
                                                        title="Voir"
                                                        className="
                                                            w-9
                                                            h-9
                                                            rounded-lg
                                                            flex
                                                            items-center
                                                            justify-center
                                                            bg-blue-50
                                                            text-blue-600
                                                            hover:bg-blue-600
                                                            hover:text-white
                                                            transition
                                                        "
                                                    >
                                                        <Eye size={17} />
                                                    </button>

                                                    {/* MODIFIER */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(medecin)
                                                        }
                                                        title="Modifier"
                                                        className="
                                                            w-9
                                                            h-9
                                                            rounded-lg
                                                            flex
                                                            items-center
                                                            justify-center
                                                            bg-amber-50
                                                            text-amber-600
                                                            hover:bg-amber-500
                                                            hover:text-white
                                                            transition
                                                        "
                                                    >
                                                        <Pencil size={17} />
                                                    </button>

                                                    {/* SUPPRIMER */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                medecin.id
                                                            )
                                                        }
                                                        title="Supprimer"
                                                        className="
                                                            w-9
                                                            h-9
                                                            rounded-lg
                                                            flex
                                                            items-center
                                                            justify-center
                                                            bg-red-50
                                                            text-red-600
                                                            hover:bg-red-600
                                                            hover:text-white
                                                            transition
                                                        "
                                                    >
                                                        <Trash2 size={17} />
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>
                                    );
                                })

                            ) : (

                                <tr>

                                    <td
                                        colSpan="5"
                                        className="px-6 py-16 text-center"
                                    >

                                        <div className="
                                            w-16
                                            h-16
                                            mx-auto
                                            rounded-2xl
                                            bg-slate-50
                                            flex
                                            items-center
                                            justify-center
                                        ">
                                            <Stethoscope
                                                size={28}
                                                className="text-slate-400"
                                            />
                                        </div>

                                        <p className="
                                            mt-4
                                            font-semibold
                                            text-slate-700
                                        ">
                                            Aucun médecin trouvé
                                        </p>

                                        <p className="
                                            mt-1
                                            text-sm
                                            text-slate-400
                                        ">
                                            {search
                                                ? "Aucun résultat pour votre recherche."
                                                : "Aucun médecin n'est actuellement enregistré."
                                            }
                                        </p>

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}

export default Doctors;