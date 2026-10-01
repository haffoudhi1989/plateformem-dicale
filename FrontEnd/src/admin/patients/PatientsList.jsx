import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
    Users,
    UserPlus,
    Eye,
    Pencil,
    Trash2,
    Phone,
    Mail,
    ArrowRight
} from "lucide-react";

function PatientsList() {

    const navigate = useNavigate();

    // =====================================================
    // CONFIGURATION API
    // =====================================================

    // CRA : la variable est exposée via process.env.REACT_APP_*.
    const API_BASE =
        process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

    const API = `${API_BASE}/patients`;

    // Racine du serveur : sert les fichiers /storage (photos)
    const API_ROOT = API.replace(/\/api\/.*$/, "");

    // =====================================================
    // ETATS
    // =====================================================

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =====================================================
    // CHARGER LES PATIENTS
    // =====================================================

    const getPatients = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await axios.get(API, {
                headers: {
                    Accept: "application/json",
                },
            });

            let data = response.data;

            if (Array.isArray(data)) {

                // réponse directe

            } else if (Array.isArray(data?.data)) {

                data = data.data;

            } else if (Array.isArray(data?.patients)) {

                data = data.patients;

            } else {

                data = [];

            }

            setPatients(data);

        } catch (error) {

            console.error(
                "Erreur API patients :",
                error.response?.data || error
            );

            setPatients([]);

            setError(
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                "Impossible de charger les patients."
            );

        } finally {

            setLoading(false);

        }

    };

    // =====================================================
    // CHARGEMENT INITIAL
    // =====================================================

    useEffect(() => {

        getPatients();

    }, []);

    // =====================================================
    // VOIR
    // =====================================================

    const handleView = (patient) => {

        navigate(`/admin/patients/${patient.id}`);

    };

    // =====================================================
    // MODIFIER
    // =====================================================

    const handleEdit = (patient) => {

        navigate(`/admin/patients/edit/${patient.id}`);

    };

    // =====================================================
    // SUPPRIMER
    // =====================================================

    const handleDelete = async (id) => {

        const confirmation = window.confirm(
            "Voulez-vous vraiment supprimer ce patient ?"
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

            alert("Patient supprimé avec succès.");

            getPatients();

        } catch (error) {

            console.error(
                "Erreur suppression patient :",
                error.response?.data || error
            );

            alert(
                error.response?.data?.message ||
                "Erreur lors de la suppression du patient."
            );

        }

    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="
                min-h-[400px]
                flex
                items-center
                justify-center
                bg-gray-50
            ">

                <div className="text-center">

                    <div className="
                        w-12
                        h-12
                        border-4
                        border-blue-100
                        border-t-blue-700
                        rounded-full
                        animate-spin
                        mx-auto
                    " />

                    <p className="
                        mt-4
                        text-sm
                        text-gray-500
                    ">
                        Chargement des patients...
                    </p>

                </div>

            </div>

        );

    }

    // =====================================================
    // AFFICHAGE
    // =====================================================

    return (

        <div className="
            min-h-full
            bg-gray-50
        ">

            {/* =================================================
                EN-TÊTE
            ================================================= */}

                        <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <Users size={26} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                            Patients
                        </h1>
                        <p className="text-blue-100 text-sm mt-0.5">
                            Consultez et gérez les patients enregistrés.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                <button
                    type="button"
                    onClick={() => navigate("/admin/patients/add")}
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
                    Ajouter un patient
                </button>
                </div>
            </div>


            {/* =================================================
                ERREUR
            ================================================= */}

            {error && (

                <div className="

                    mb-5
                    rounded-2xl
                    border
                    border-red-200
                    bg-red-50
                    px-5
                    py-4
                ">

                    <p className="
                        text-sm
                        font-semibold
                        text-red-700
                    ">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={getPatients}
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
                            transition
                        "
                    >
                        Réessayer
                    </button>

                </div>

            )}


            {/* =================================================
                CONTENU
            ================================================= */}

            <div className="

            ">

                {/* =================================================
                    STATISTIQUE
                ================================================= */}

                <div className="
                    mb-5
                    bg-white
                    rounded-2xl
                    border
                    border-gray-200
                    shadow-sm
                    px-5
                    py-4
                ">

                    <div className="
                        flex
                        items-center
                        gap-3
                    ">

                        <div className="
                            w-11
                            h-11
                            rounded-xl
                            bg-blue-700
                            text-white
                            flex
                            items-center
                            justify-center
                            shadow-sm
                        ">

                            <Users size={21} />

                        </div>

                        <div>

                            <p className="
                                text-xs
                                uppercase
                                tracking-wide
                                font-semibold
                                text-gray-500
                            ">
                                Total patients
                            </p>

                            <p className="
                                text-xl
                                font-bold
                                text-gray-900
                                mt-0.5
                            ">
                                {patients.length}
                            </p>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    TABLEAU
                ================================================= */}

                <div className="
                    bg-white
                    rounded-2xl
                    border
                    border-gray-200
                    shadow-sm
                    overflow-hidden
                ">

                    {/* HEADER TABLEAU */}

                    <div className="
                        px-5
                        md:px-7
                        py-5
                        border-b
                        border-gray-200
                        bg-gradient-to-r
                        from-blue-50
                        to-white
                    ">

                        <div className="
                            flex
                            items-center
                            justify-between
                            gap-4
                        ">

                            <div className="
                                flex
                                items-center
                                gap-3
                            ">

                                <div className="
                                    w-11
                                    h-11
                                    rounded-xl
                                    bg-blue-700
                                    text-white
                                    flex
                                    items-center
                                    justify-center
                                    shadow-sm
                                ">

                                    <Users size={21} />

                                </div>

                                <div>

                                    <h2 className="
                                        text-base
                                        md:text-lg
                                        font-bold
                                        text-gray-900
                                    ">
                                        Informations des patients
                                    </h2>

                                    <p className="
                                        text-xs
                                        md:text-sm
                                        text-gray-500
                                        mt-0.5
                                    ">
                                        Liste des patients enregistrés
                                    </p>

                                </div>

                            </div>


                            <span className="
                                hidden
                                sm:inline-flex
                                items-center
                                px-3
                                py-1.5
                                rounded-full
                                bg-blue-100
                                text-blue-700
                                text-xs
                                font-semibold
                            ">
                                {patients.length} patient
                                {patients.length !== 1 ? "s" : ""}
                            </span>

                        </div>

                    </div>


                    {/* TABLE */}

                    <div className="overflow-x-auto">

                        <table className="
                            w-full
                            min-w-[850px]
                        ">

                            {/* THEAD */}

                            <thead className="
                                bg-gray-50
                                border-b
                                border-gray-200
                            ">

                                <tr>

                                    <th className="
                                        px-5
                                        py-4
                                        text-left
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-gray-600
                                    ">
                                        Nom
                                    </th>

                                    <th className="
                                        px-5
                                        py-4
                                        text-left
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-gray-600
                                    ">
                                        Prénom
                                    </th>

                                    <th className="
                                        px-5
                                        py-4
                                        text-left
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-gray-600
                                    ">
                                        Téléphone
                                    </th>

                                    <th className="
                                        px-5
                                        py-4
                                        text-left
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-gray-600
                                    ">
                                        Email
                                    </th>

                                    <th className="
                                        px-5
                                        py-4
                                        text-center
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-gray-600
                                    ">
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            {/* TBODY */}

                            <tbody>

                                {patients.length > 0 ? (

                                    patients.map((patient) => (

                                        <tr
                                            key={patient.id}
                                            className="
                                                border-b
                                                border-gray-100
                                                last:border-b-0
                                                hover:bg-blue-50/40
                                                transition
                                            "
                                        >

                                            {/* NOM */}

                                            <td className="
                                                px-5
                                                py-4
                                            ">

                                                <div className="
                                                    flex
                                                    items-center
                                                    gap-3
                                                ">

                                                    <div className="
                                                        w-10
                                                        h-10
                                                        rounded-full
                                                        relative
                                                        overflow-hidden
                                                        bg-blue-50
                                                        text-blue-700
                                                        flex
                                                        items-center
                                                        justify-center
                                                        font-bold
                                                        text-sm
                                                        shrink-0
                                                    ">

                                                        {/* Initiale : visible tant que la photo n'est pas chargée */}
                                                        <span>
                                                            {(
                                                                patient.prenom?.charAt(0) ||
                                                                patient.nom?.charAt(0) ||
                                                                "P"
                                                            ).toUpperCase()}
                                                        </span>

                                                        {patient.photo && (
                                                            <img
                                                                src={`${API_ROOT}/storage/${patient.photo}`}
                                                                alt={`${patient.prenom || ""} ${patient.nom || ""}`}
                                                                className="absolute inset-0 w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = "none";
                                                                }}
                                                            />
                                                        )}

                                                    </div>

                                                    <span className="
                                                        text-sm
                                                        font-semibold
                                                        text-gray-800
                                                    ">
                                                        {patient.nom || "-"}
                                                    </span>

                                                </div>

                                            </td>


                                            {/* PRENOM */}

                                            <td className="
                                                px-5
                                                py-4
                                            ">

                                                <span className="
                                                    text-sm
                                                    text-gray-700
                                                ">
                                                    {patient.prenom || "-"}
                                                </span>

                                            </td>


                                            {/* TELEPHONE */}

                                            <td className="
                                                px-5
                                                py-4
                                            ">

                                                <div className="
                                                    flex
                                                    items-center
                                                    gap-2
                                                ">

                                                    <div className="
                                                        w-8
                                                        h-8
                                                        rounded-lg
                                                        bg-blue-50
                                                        text-blue-700
                                                        flex
                                                        items-center
                                                        justify-center
                                                        shrink-0
                                                    ">

                                                        <Phone size={15} />

                                                    </div>

                                                    <span className="
                                                        text-sm
                                                        text-gray-700
                                                    ">
                                                        {patient.telephone || "-"}
                                                    </span>

                                                </div>

                                            </td>


                                            {/* EMAIL */}

                                            <td className="
                                                px-5
                                                py-4
                                            ">

                                                <div className="
                                                    flex
                                                    items-center
                                                    gap-2
                                                ">

                                                    <div className="
                                                        w-8
                                                        h-8
                                                        rounded-lg
                                                        bg-blue-50
                                                        text-blue-700
                                                        flex
                                                        items-center
                                                        justify-center
                                                        shrink-0
                                                    ">

                                                        <Mail size={15} />

                                                    </div>

                                                    <span className="
                                                        text-sm
                                                        text-gray-600
                                                    ">
                                                        {patient.email || "-"}
                                                    </span>

                                                </div>

                                            </td>


                                            {/* ACTIONS */}

                                            <td className="
                                                px-5
                                                py-4
                                            ">

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
                                                            handleView(patient)
                                                        }
                                                        title="Voir"
                                                        aria-label="Voir"
                                                        className="
                                                            w-9
                                                            h-9
                                                            rounded-lg
                                                            bg-blue-50
                                                            text-blue-700
                                                            flex
                                                            items-center
                                                            justify-center
                                                            hover:bg-blue-100
                                                            transition
                                                        "
                                                    >

                                                        <Eye size={17} />

                                                    </button>


                                                    {/* MODIFIER */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(patient)
                                                        }
                                                        title="Modifier"
                                                        aria-label="Modifier"
                                                        className="
                                                            w-9
                                                            h-9
                                                            rounded-lg
                                                            bg-blue-600
                                                            text-white
                                                            flex
                                                            items-center
                                                            justify-center
                                                            hover:bg-blue-700
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
                                                                patient.id
                                                            )
                                                        }
                                                        title="Supprimer"
                                                        aria-label="Supprimer"
                                                        className="
                                                            w-9
                                                            h-9
                                                            rounded-lg
                                                            bg-red-50
                                                            text-red-600
                                                            flex
                                                            items-center
                                                            justify-center
                                                            hover:bg-red-100
                                                            transition
                                                        "
                                                    >

                                                        <Trash2 size={17} />

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    ))

                                ) : (

                                    <tr>

                                        <td
                                            colSpan="5"
                                            className="
                                                px-6
                                                py-14
                                                text-center
                                            "
                                        >

                                            <div className="
                                                w-14
                                                h-14
                                                mx-auto
                                                rounded-2xl
                                                bg-blue-50
                                                text-blue-600
                                                flex
                                                items-center
                                                justify-center
                                            ">

                                                <Users size={25} />

                                            </div>

                                            <p className="
                                                mt-4
                                                font-semibold
                                                text-gray-700
                                            ">
                                                Aucun patient trouvé
                                            </p>

                                            <p className="
                                                mt-1
                                                text-sm
                                                text-gray-400
                                            ">
                                                Aucun patient n'est actuellement enregistré.
                                            </p>

                                            <button
                                                type="button"
                                                onClick={getPatients}
                                                className="
                                                    mt-4
                                                    inline-flex
                                                    items-center
                                                    gap-2
                                                    px-4
                                                    py-2.5
                                                    rounded-xl
                                                    bg-blue-700
                                                    hover:bg-blue-800
                                                    text-white
                                                    text-sm
                                                    font-semibold
                                                    transition
                                                "
                                            >

                                                Actualiser

                                                <ArrowRight size={16} />

                                            </button>

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

export default PatientsList;