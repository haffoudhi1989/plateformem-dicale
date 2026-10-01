import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    ArrowLeft,
    UserPlus,
    User,
    Mail,
    Phone,
    Lock,
    Building2,
    Stethoscope,
    CalendarDays,
    Users,
    CreditCard,
    BarChart3,
    Save,
    ShieldCheck,
    Loader2,
    AlertCircle,
    CheckCircle2
} from "lucide-react";

function AddSecretaire() {

    const navigate = useNavigate();

    // =====================================================
    // CONFIGURATION API
    // =====================================================

    const API_URL = "http://127.0.0.1:8000/api";


    // =====================================================
    // ETATS CABINETS
    // =====================================================

    const [cabinets, setCabinets] = useState([]);

    const [loadingCabinets, setLoadingCabinets] =
        useState(true);

    const [cabinetId, setCabinetId] =
        useState("");


    // =====================================================
    // ETATS MEDECINS
    // =====================================================

    const [medecins, setMedecins] =
        useState([]);

    const [loadingMedecins, setLoadingMedecins] =
        useState(false);


    // =====================================================
    // ETATS GENERAUX
    // =====================================================

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // =====================================================
    // FORMULAIRE
    // =====================================================

    const [formData, setFormData] = useState({

        prenom: "",

        nom: "",

        email: "",

        telephone: "",

        password: "",

        confirmPassword: "",

        cabinet_id: "",

        medecins: [],

        permissions: {
            agenda: true,
            rendezVous: true,
            patients: true,
            disponibilites: false,
            paiements: false,
            statistiques: false
        }

    });


    // =====================================================
    // CHARGER LES CABINETS
    // =====================================================

    useEffect(() => {

        const fetchCabinets = async () => {

            try {

                setLoadingCabinets(true);

                setError("");

                const response = await fetch(
                    `${API_URL}/cabinets`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json", Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
                        }
                    }
                );

                const result =
                    await response.json();

                console.log(
                    "Cabinets reçus :",
                    result
                );

                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        "Impossible de charger les cabinets."
                    );

                }

                const liste =
                    result.data || [];

                setCabinets(liste);


                // Sélectionner automatiquement
                // le premier cabinet

                if (liste.length > 0) {

                    const premierCabinet =
                        liste[0].id;

                    setCabinetId(
                        premierCabinet
                    );

                    setFormData((current) => ({
                        ...current,
                        cabinet_id:
                            premierCabinet
                    }));

                }

            } catch (error) {

                console.error(
                    "Erreur chargement cabinets :",
                    error
                );

                setError(
                    error.message ||
                    "Impossible de charger les cabinets."
                );

            } finally {

                setLoadingCabinets(false);

            }

        };

        fetchCabinets();

    }, []);


    // =====================================================
    // CHARGER LES MEDECINS DU CABINET
    // =====================================================

    useEffect(() => {

        const fetchMedecins = async () => {

            if (!cabinetId) {

                setMedecins([]);

                setLoadingMedecins(false);

                return;
            }

            try {

                setLoadingMedecins(true);

                setError("");

                const response = await fetch(
                    `${API_URL}/cabinets/${cabinetId}/medecins`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json", Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
                        }
                    }
                );

                const result =
                    await response.json();

                console.log(
                    "Médecins reçus :",
                    result
                );

                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        "Impossible de charger les médecins."
                    );

                }

                setMedecins(
                    result.data || []
                );

            } catch (error) {

                console.error(
                    "Erreur chargement médecins :",
                    error
                );

                setMedecins([]);

                setError(
                    error.message ||
                    "Impossible de charger les médecins."
                );

            } finally {

                setLoadingMedecins(false);

            }

        };

        fetchMedecins();

    }, [cabinetId]);


    // =====================================================
    // CHANGEMENT INPUT
    // =====================================================

    const handleChange = (event) => {

        const {
            name,
            value
        } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value
        }));

    };


    // =====================================================
    // CHANGEMENT CABINET
    // =====================================================

    const handleCabinetChange = (event) => {

        const value =
            event.target.value;

        setCabinetId(value);

        setFormData((current) => ({
            ...current,

            cabinet_id: value,

            medecins: []
        }));

    };


    // =====================================================
    // CHANGEMENT MEDECIN
    // =====================================================

    const handleDoctorChange = (
        doctorId
    ) => {

        setFormData((current) => {

            const exists =
                current.medecins.includes(
                    doctorId
                );

            return {

                ...current,

                medecins: exists

                    ? current.medecins.filter(
                        (id) =>
                            id !== doctorId
                    )

                    : [
                        ...current.medecins,
                        doctorId
                    ]

            };

        });

    };


    // =====================================================
    // CHANGEMENT PERMISSION
    // =====================================================

    const handlePermissionChange = (
        permission
    ) => {

        setFormData((current) => ({

            ...current,

            permissions: {

                ...current.permissions,

                [permission]:
                    !current.permissions[
                        permission
                    ]

            }

        }));

    };


    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();

        setError("");

        setSuccess("");


        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!formData.cabinet_id) {

            setError(
                "Veuillez sélectionner un cabinet."
            );

            return;
        }


        if (
            !formData.prenom.trim() ||
            !formData.nom.trim() ||
            !formData.email.trim() ||
            !formData.password
        ) {

            setError(
                "Veuillez remplir tous les champs obligatoires."
            );

            return;
        }


        if (
            formData.password.length < 6
        ) {

            setError(
                "Le mot de passe doit contenir au moins 6 caractères."
            );

            return;
        }


        if (
            formData.password !==
            formData.confirmPassword
        ) {

            setError(
                "Les mots de passe ne correspondent pas."
            );

            return;
        }


        // -------------------------------------------------
        // MEDECINS
        // -------------------------------------------------

        if (
            formData.medecins.length === 0
        ) {

            const confirmer =
                window.confirm(
                    "Aucun médecin n'est associé à cette secrétaire. Continuer ?"
                );

            if (!confirmer) {
                return;
            }

        }


        try {

            setSaving(true);


            // -------------------------------------------------
            // DONNEES API
            // -------------------------------------------------

            const dataToSend = {

                cabinet_id:
                    Number(
                        formData.cabinet_id
                    ),

                prenom:
                    formData.prenom.trim(),

                nom:
                    formData.nom.trim(),

                email:
                    formData.email.trim(),

                telephone:
                    formData.telephone.trim() ||
                    null,

                password:
                    formData.password,

                actif: true

            };


            console.log(
                "Données secrétaire envoyées :",
                dataToSend
            );


            // -------------------------------------------------
            // CREATION SECRETAIRE
            // -------------------------------------------------

            const response =
                await fetch(
                    `${API_URL}/secretaires`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json", Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
                        },

                        body:
                            JSON.stringify(
                                dataToSend
                            )
                    }
                );


            const result =
                await response.json();


            console.log(
                "Réponse création secrétaire :",
                result
            );


            // -------------------------------------------------
            // ERREUR
            // -------------------------------------------------

            if (!response.ok) {

                if (result.errors) {

                    const messages =
                        Object.values(
                            result.errors
                        )
                            .flat()
                            .join(" ");

                    throw new Error(
                        messages
                    );

                }

                throw new Error(
                    result.message ||
                    "Erreur lors de la création de la secrétaire."
                );

            }


            // -------------------------------------------------
            // SECRETAIRE CREEE
            // -------------------------------------------------

            const secretaire =
                result.data;


            // -------------------------------------------------
            // ASSOCIATION MEDECINS
            // -------------------------------------------------

            if (
                secretaire &&
                secretaire.id &&
                formData.medecins.length > 0
            ) {

                const associationResponse =
                    await fetch(
                        `${API_URL}/secretaires/${secretaire.id}/medecins`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Accept:
                                    "application/json", Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
                            },

                            body:
                                JSON.stringify({
                                    medecins:
                                        formData.medecins
                                })
                        }
                    );


                const associationResult =
                    await associationResponse.json();


                console.log(
                    "Association médecins :",
                    associationResult
                );


                if (
                    !associationResponse.ok
                ) {

                    console.error(
                        "Erreur association médecins :",
                        associationResult
                    );

                }

            }


            // -------------------------------------------------
            // SUCCES
            // -------------------------------------------------

            setSuccess(
                "Secrétaire créée avec succès !"
            );


            // -------------------------------------------------
            // REDIRECTION
            // -------------------------------------------------

            setTimeout(() => {

                navigate(
                    "/admin/cabinet/secretaires"
                );

            }, 1000);


        } catch (error) {

            console.error(
                "Erreur création secrétaire :",
                error
            );

            setError(
                error.message ||
                "Une erreur est survenue lors de la création."
            );

        } finally {

            setSaving(false);

        }

    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div>

            <div>


                {/* =================================================
                    HEADER
                ================================================= */}

                                <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                            <UserPlus size={26} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                                Ajouter une secrétaire
                            </h1>
                            <p className="text-blue-100 text-sm mt-0.5">
                                Créer un compte secrétaire pour le cabinet
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                        to="/admin/cabinet/secretaires"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition border border-white/20 shadow-sm self-start md:self-auto cursor-pointer disabled:opacity-50"
                    >
                        <ArrowLeft size={14} />
                        Secrétaires
                    </Link>
                    </div>
                </div>


                {/* =================================================
                    MESSAGES
                ================================================= */}

                {error && (

                    <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">

                        <AlertCircle size={19} className="shrink-0 mt-0.5" />

                        <div>
                            <p className="font-semibold text-sm">Erreur</p>
                            <p className="text-sm mt-0.5">{error}</p>
                        </div>

                    </div>

                )}


                {success && (

                    <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">

                        <CheckCircle2 size={19} className="shrink-0 mt-0.5" />

                        <div>
                            <p className="font-semibold text-sm">Opération réussie</p>
                            <p className="text-sm mt-0.5">{success}</p>
                        </div>

                    </div>

                )}


                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >


                    {/* =================================================
                        INFORMATIONS PERSONNELLES
                    ================================================= */}

                    <div className="
                        bg-white
                        rounded-2xl
                        border
                        border-slate-200
                        shadow-sm
                        p-6
                    ">

                        <div className="
                            flex
                            items-center
                            gap-3
                            mb-6
                        ">

                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <User size={19} />
                            </div>

                            <div>

                                <h2 className="
                                    font-bold
                                    text-slate-900
                                ">
                                    Informations personnelles
                                </h2>

                                <p className="
                                    text-xs
                                    text-slate-500
                                    mt-1
                                ">
                                    Informations de la secrétaire
                                </p>

                            </div>

                        </div>


                        <div className="
                            grid
                            grid-cols-1
                            md:grid-cols-2
                            gap-5
                        ">


                            {/* PRENOM */}

                            <div>

                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Prénom *
                                </label>

                                <div className="relative">

                                    <User
                                        size={18}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                    />

                                    <input
                                        type="text"
                                        name="prenom"
                                        value={
                                            formData.prenom
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Ex : Sonia"
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />

                                </div>

                            </div>


                            {/* NOM */}

                            <div>

                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Nom *
                                </label>

                                <input
                                    type="text"
                                    name="nom"
                                    value={
                                        formData.nom
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Ex : Ben Ali"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />

                            </div>


                            {/* EMAIL */}

                            <div>

                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Email *
                                </label>

                                <div className="relative">

                                    <Mail
                                        size={18}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                    />

                                    <input
                                        type="email"
                                        name="email"
                                        value={
                                            formData.email
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="secretaire@example.com"
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />

                                </div>

                            </div>


                            {/* TELEPHONE */}

                            <div>

                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Téléphone
                                </label>

                                <div className="relative">

                                    <Phone
                                        size={18}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                    />

                                    <input
                                        type="tel"
                                        name="telephone"
                                        value={
                                            formData.telephone
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="22 345 678"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        COMPTE
                    ================================================= */}

                    <div className="
                        bg-white
                        rounded-2xl
                        border
                        border-slate-200
                        shadow-sm
                        p-6
                    ">

                        <div className="
                            flex
                            items-center
                            gap-3
                            mb-6
                        ">

                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Lock size={19} />
                            </div>

                            <div>

                                <h2 className="
                                    font-bold
                                    text-slate-900
                                ">
                                    Compte de connexion
                                </h2>

                                <p className="
                                    text-xs
                                    text-slate-500
                                    mt-1
                                ">
                                    Identifiants de connexion
                                </p>

                            </div>

                        </div>


                        <div className="
                            grid
                            grid-cols-1
                            md:grid-cols-2
                            gap-5
                        ">

                            <div>

                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Mot de passe *
                                </label>

                                <input
                                    type="password"
                                    name="password"
                                    value={
                                        formData.password
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />

                            </div>


                            <div>

                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Confirmer le mot de passe *
                                </label>

                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={
                                        formData.confirmPassword
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        CABINET
                    ================================================= */}

                    <div className="
                        bg-white
                        rounded-2xl
                        border
                        border-slate-200
                        shadow-sm
                        p-6
                    ">

                        <div className="
                            flex
                            items-center
                            gap-3
                            mb-6
                        ">

                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Building2 size={19} />
                            </div>

                            <div>

                                <h2 className="
                                    font-bold
                                    text-slate-900
                                ">
                                    Cabinet
                                </h2>

                                <p className="
                                    text-xs
                                    text-slate-500
                                    mt-1
                                ">
                                    Cabinet auquel la secrétaire est rattachée
                                </p>

                            </div>

                        </div>


                        {/* SELECT CABINET */}

                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Sélectionner le cabinet *
                        </label>


                        <div className="relative">

                            <Building2
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            />

                            <select
                                value={
                                    formData.cabinet_id
                                }
                                onChange={
                                    handleCabinetChange
                                }
                                required
                                disabled={
                                    loadingCabinets
                                }
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100 disabled:cursor-not-allowed"
                            >

                                <option value="">
                                    {loadingCabinets
                                        ? "Chargement des cabinets..."
                                        : "Sélectionner un cabinet"}
                                </option>


                                {cabinets.map(
                                    (cabinet) => (

                                        <option
                                            key={
                                                cabinet.id
                                            }
                                            value={
                                                cabinet.id
                                            }
                                        >
                                            {cabinet.nom ||
                                                cabinet.name ||
                                                cabinet.libelle ||
                                                `Cabinet #${cabinet.id}`}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        {!loadingCabinets &&
                            cabinets.length === 0 && (

                                <div className="
                                    mt-3
                                    p-4
                                    rounded-xl
                                    bg-red-50
                                    border
                                    border-red-200
                                ">

                                    <p className="
                                        text-sm
                                        font-semibold
                                        text-red-700
                                    ">
                                        Aucun cabinet disponible
                                    </p>

                                    <p className="
                                        text-xs
                                        text-red-600
                                        mt-1
                                    ">
                                        Vérifiez que l'API /api/cabinets retourne bien les cabinets.
                                    </p>

                                </div>

                            )}

                    </div>


                    {/* =================================================
                        MEDECINS
                    ================================================= */}

                    <div className="
                        bg-white
                        rounded-2xl
                        border
                        border-slate-200
                        shadow-sm
                        p-6
                    ">

                        <div className="
                            flex
                            items-center
                            gap-3
                            mb-6
                        ">

                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Stethoscope size={19} />
                            </div>

                            <div>

                                <h2 className="
                                    font-bold
                                    text-slate-900
                                ">
                                    Médecins associés
                                </h2>

                                <p className="
                                    text-xs
                                    text-slate-500
                                    mt-1
                                ">
                                    Sélectionnez les médecins accessibles par cette secrétaire
                                </p>

                            </div>

                        </div>


                        {!cabinetId ? (

                            <div className="
                                p-6
                                rounded-xl
                                bg-slate-50
                                border
                                border-slate-200
                                text-center
                            ">

                                <Building2
                                    size={35}
                                    className="
                                        mx-auto
                                        text-slate-300
                                    "
                                />

                                <p className="
                                    mt-3
                                    font-semibold
                                    text-slate-700
                                ">
                                    Sélectionnez un cabinet
                                </p>

                            </div>

                        ) : loadingMedecins ? (

                            <div className="
                                flex
                                items-center
                                justify-center
                                gap-3
                                py-10
                                text-sm
                                text-slate-500
                            ">

                                <Loader2
                                    size={20}
                                    className="animate-spin"
                                />

                                Chargement des médecins...

                            </div>

                        ) : medecins.length > 0 ? (

                            <div className="
                                grid
                                grid-cols-1
                                md:grid-cols-2
                                gap-3
                            ">

                                {medecins.map(
                                    (medecin) => {

                                        const nomMedecin =
                                            medecin.prenom &&
                                            medecin.nom

                                                ? `Dr. ${medecin.prenom} ${medecin.nom}`

                                                : medecin.nom ||
                                                  medecin.name ||
                                                  `Médecin #${medecin.id}`;


                                        return (

                                            <label
                                                key={
                                                    medecin.id
                                                }
                                                className={`
                                                    flex
                                                    items-center
                                                    gap-3
                                                    p-4
                                                    rounded-xl
                                                    border
                                                    cursor-pointer
                                                    transition

                                                    ${
                                                        formData.medecins.includes(
                                                            medecin.id
                                                        )
                                                            ? "border-blue-300 bg-blue-50"
                                                            : "border-slate-200 hover:bg-slate-50"
                                                    }
                                                `}
                                            >

                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        formData.medecins.includes(
                                                            medecin.id
                                                        )
                                                    }
                                                    onChange={() =>
                                                        handleDoctorChange(
                                                            medecin.id
                                                        )
                                                    }
                                                    className="
                                                        w-4
                                                        h-4
                                                        accent-blue-600
                                                    "
                                                />

                                                <Stethoscope
                                                    size={17}
                                                    className="
                                                        text-blue-600
                                                    "
                                                />

                                                <div>

                                                    <p className="
                                                        text-sm
                                                        font-semibold
                                                        text-slate-700
                                                    ">
                                                        {
                                                            nomMedecin
                                                        }
                                                    </p>


                                                    {medecin.specialite && (

                                                        <p className="
                                                            text-xs
                                                            text-slate-400
                                                            mt-1
                                                        ">

                                                            {
                                                                medecin.specialite.nom ||
                                                                medecin.specialite.name
                                                            }

                                                        </p>

                                                    )}

                                                </div>

                                            </label>

                                        );

                                    }
                                )}

                            </div>

                        ) : (

                            <div className="
                                p-6
                                rounded-xl
                                bg-slate-50
                                border
                                border-slate-200
                                text-center
                            ">

                                <Stethoscope
                                    size={35}
                                    className="
                                        mx-auto
                                        text-slate-300
                                    "
                                />

                                <p className="
                                    mt-3
                                    font-semibold
                                    text-slate-700
                                ">
                                    Aucun médecin trouvé
                                </p>

                                <p className="
                                    text-sm
                                    text-slate-400
                                    mt-1
                                ">
                                    Aucun médecin n'est associé à ce cabinet.
                                </p>

                            </div>

                        )}

                    </div>


                    {/* =================================================
                        PERMISSIONS
                    ================================================= */}

                    <div className="
                        bg-white
                        rounded-2xl
                        border
                        border-slate-200
                        shadow-sm
                        p-6
                    ">

                        <div className="
                            flex
                            items-center
                            gap-3
                            mb-6
                        ">

                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <ShieldCheck size={19} />
                            </div>

                            <div>

                                <h2 className="
                                    font-bold
                                    text-slate-900
                                ">
                                    Permissions
                                </h2>

                                <p className="
                                    text-xs
                                    text-slate-500
                                    mt-1
                                ">
                                    Définissez les fonctionnalités accessibles
                                </p>

                            </div>

                        </div>


                        <div className="
                            grid
                            grid-cols-1
                            md:grid-cols-2
                            gap-4
                        ">

                            <Permission
                                icon={
                                    <CalendarDays size={19} />
                                }
                                title="Voir l'agenda"
                                description="Consulter les rendez-vous des médecins associés"
                                checked={
                                    formData.permissions.agenda
                                }
                                onChange={() =>
                                    handlePermissionChange(
                                        "agenda"
                                    )
                                }
                            />


                            <Permission
                                icon={
                                    <CalendarDays size={19} />
                                }
                                title="Gérer les rendez-vous"
                                description="Créer, modifier et annuler des rendez-vous"
                                checked={
                                    formData.permissions.rendezVous
                                }
                                onChange={() =>
                                    handlePermissionChange(
                                        "rendezVous"
                                    )
                                }
                            />


                            <Permission
                                icon={
                                    <Users size={19} />
                                }
                                title="Gérer les patients"
                                description="Créer et modifier les informations administratives"
                                checked={
                                    formData.permissions.patients
                                }
                                onChange={() =>
                                    handlePermissionChange(
                                        "patients"
                                    )
                                }
                            />


                            <Permission
                                icon={
                                    <CalendarDays size={19} />
                                }
                                title="Gérer les disponibilités"
                                description="Modifier les horaires et disponibilités"
                                checked={
                                    formData.permissions.disponibilites
                                }
                                onChange={() =>
                                    handlePermissionChange(
                                        "disponibilites"
                                    )
                                }
                            />


                            <Permission
                                icon={
                                    <CreditCard size={19} />
                                }
                                title="Gérer les paiements"
                                description="Consulter et enregistrer les paiements"
                                checked={
                                    formData.permissions.paiements
                                }
                                onChange={() =>
                                    handlePermissionChange(
                                        "paiements"
                                    )
                                }
                            />


                            <Permission
                                icon={
                                    <BarChart3 size={19} />
                                }
                                title="Voir les statistiques"
                                description="Accéder aux statistiques du cabinet"
                                checked={
                                    formData.permissions.statistiques
                                }
                                onChange={() =>
                                    handlePermissionChange(
                                        "statistiques"
                                    )
                                }
                            />

                        </div>

                    </div>


                    {/* =================================================
                        ACTIONS
                    ================================================= */}

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">

                        <Link
                            to="/admin/cabinet/secretaires"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Annuler
                        </Link>


                        <button
                            type="submit"
                            disabled={
                                saving ||
                                loadingCabinets ||
                                loadingMedecins ||
                                !formData.cabinet_id
                            }
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >

                            {saving ? (

                                <>

                                    <Loader2
                                        size={18}
                                        className="animate-spin"
                                    />

                                    Création...

                                </>

                            ) : (

                                <>

                                    <Save size={18} />

                                    Créer la secrétaire

                                </>

                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );
}


// =====================================================
// COMPOSANT PERMISSION
// =====================================================

function Permission({
    icon,
    title,
    description,
    checked,
    onChange
}) {

    return (

        <label
            className={`
                flex
                items-start
                gap-4
                p-4
                rounded-xl
                border
                cursor-pointer
                transition

                ${
                    checked
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                }
            `}
        >

            <div
                className={`
                    w-10
                    h-10
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    shrink-0

                    ${
                        checked
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-500"
                    }
                `}
            >
                {icon}
            </div>


            <div className="flex-1">

                <div className="
                    flex
                    items-center
                    justify-between
                    gap-3
                ">

                    <p className="
                        font-semibold
                        text-sm
                        text-slate-800
                    ">
                        {title}
                    </p>

                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={onChange}
                        className="
                            w-4
                            h-4
                            accent-blue-600
                            shrink-0
                        "
                    />

                </div>


                <p className="
                    text-xs
                    text-slate-500
                    mt-1
                    leading-relaxed
                ">
                    {description}
                </p>

            </div>

        </label>

    );
}


export default AddSecretaire;