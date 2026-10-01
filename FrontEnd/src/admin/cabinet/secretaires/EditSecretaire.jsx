import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import {
    ArrowLeft,
    UserRoundCog,
    User,
    Mail,
    Phone,
    Lock,
    Building2,
    Save,
    Loader2
} from "lucide-react";

function EditSecretaire() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        prenom: "",
        nom: "",
        email: "",
        telephone: "",
        password: "",
        confirmPassword: "",
        cabinet_id: "",
        actif: true
    });

    // =====================================================
    // CHARGER LA SECRETAIRE
    // =====================================================

    useEffect(() => {

        const fetchSecretaire = async () => {

            try {

                setLoading(true);
                setError("");

                const response = await fetch(
                    `http://127.0.0.1:8000/api/secretaires/${id}`,
                    {
                        headers: {
                            Accept: "application/json",
                            Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
                        }
                    }
                );

                const result = await response.json();

                if (!response.ok || !result.success) {

                    throw new Error(
                        result.message ||
                        "Cette secrétaire n'existe pas."
                    );
                }

                const secretaire = result.data;

                setFormData({
                    prenom: secretaire.prenom || "",
                    nom: secretaire.nom || "",
                    email: secretaire.email || "",
                    telephone: secretaire.telephone || "",
                    password: "",
                    confirmPassword: "",
                    cabinet_id: secretaire.cabinet_id || "",
                    actif: Boolean(secretaire.actif)
                });

            } catch (error) {

                console.error(error);

                setError(
                    error.message ||
                    "Impossible de charger cette secrétaire."
                );

            } finally {

                setLoading(false);

            }
        };

        if (id) {
            fetchSecretaire();
        }

    }, [id]);


    // =====================================================
    // CHANGEMENT INPUT
    // =====================================================

    const handleChange = (event) => {

        const {
            name,
            value,
            type,
            checked
        } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: type === "checkbox"
                ? checked
                : value
        }));
    };


    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (
            !formData.prenom.trim() ||
            !formData.nom.trim() ||
            !formData.email.trim()
        ) {

            setError(
                "Veuillez remplir tous les champs obligatoires."
            );

            return;
        }

        if (
            formData.password &&
            formData.password !== formData.confirmPassword
        ) {

            setError(
                "Les mots de passe ne correspondent pas."
            );

            return;
        }

        try {

            setSaving(true);

            const dataToSend = {
                prenom: formData.prenom,
                nom: formData.nom,
                email: formData.email,
                telephone: formData.telephone || null,
                cabinet_id: formData.cabinet_id
                    ? Number(formData.cabinet_id)
                    : null,
                actif: formData.actif
            };

            // Le mot de passe est envoyé uniquement
            // s'il a été renseigné.

            if (formData.password) {
                dataToSend.password = formData.password;
            }

            const response = await fetch(
                `http://127.0.0.1:8000/api/secretaires/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
                    },
                    body: JSON.stringify(dataToSend)
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {

                if (result.errors) {

                    const firstError =
                        Object.values(result.errors)[0];

                    if (Array.isArray(firstError)) {
                        throw new Error(firstError[0]);
                    }

                }

                throw new Error(
                    result.message ||
                    "Erreur lors de la modification."
                );
            }

            alert(
                "Secrétaire modifiée avec succès !"
            );

            navigate(
                "/admin/cabinet/secretaires"
            );

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Une erreur est survenue."
            );

        } finally {

            setSaving(false);

        }
    };


    // =====================================================
    // CHARGEMENT
    // =====================================================

    if (loading) {

        return (
            <div className="min-h-screen bg-slate-50">

                <div className="w-full">

                    <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-sm">

                        <div className="flex items-center justify-center gap-3 text-slate-500">

                            <Loader2
                                size={22}
                                className="animate-spin"
                            />

                            Chargement de la secrétaire...

                        </div>

                    </div>

                </div>

            </div>
        );
    }


    // =====================================================
    // ERREUR
    // =====================================================

    if (error && !formData.prenom && !formData.nom) {

        return (
            <div className="min-h-screen bg-slate-50">

                <div className="w-full">

                    <Link
                        to="/admin/cabinet/secretaires"
                        className="
                            inline-flex
                            items-center
                            gap-2
                            text-sm
                            text-slate-600
                            hover:text-blue-700
                            mb-6
                        "
                    >
                        <ArrowLeft size={18} />
                        Retour aux secrétaires
                    </Link>

                    <div className="bg-white rounded-2xl border border-red-200 p-8 shadow-sm">

                        <div className="flex items-center gap-3">

                            <div className="
                                w-12
                                h-12
                                rounded-xl
                                bg-red-100
                                text-red-600
                                flex
                                items-center
                                justify-center
                            ">
                                <UserRoundCog size={24} />
                            </div>

                            <div>

                                <h1 className="text-xl font-bold text-slate-900">
                                    Cette secrétaire n'existe pas
                                </h1>

                                <p className="text-sm text-slate-500 mt-1">
                                    Impossible de trouver la secrétaire #{id}.
                                </p>

                            </div>

                        </div>

                        <p className="mt-6 text-sm text-red-600">
                            {error}
                        </p>

                    </div>

                </div>

            </div>
        );
    }


    // =====================================================
    // FORMULAIRE
    // =====================================================

    return (
            <div className="min-h-screen bg-slate-50">

            <div className="max-w-4xl mx-auto">

                {/* BANNIÈRE */}
                <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                            <UserRoundCog size={26} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                                Modifier la secrétaire
                            </h1>
                            <p className="text-blue-100 text-sm mt-0.5">
                                Modifier les informations de la secrétaire #{id}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                            to="/admin/cabinet/secretaires"
                            className="
                                w-10
                                h-10
                                rounded-xl
                                bg-white
                                border
                                border-slate-200
                                flex
                                items-center
                                justify-center
                                text-slate-600
                                hover:bg-slate-100
                                transition
                            "
                        >
                            <ArrowLeft size={19} />
                        </Link>

                    </div>
                </div>



                {/* FORM */}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >

                    {/* INFORMATIONS PERSONNELLES */}

                    <div className="
                        bg-white
                        rounded-2xl
                        border
                        border-slate-200
                        shadow-sm
                        p-6
                    ">

                        <div className="flex items-center gap-3 mb-6">

                            <div className="
                                w-10
                                h-10
                                rounded-xl
                                bg-blue-100
                                text-blue-700
                                flex
                                items-center
                                justify-center
                            ">
                                <User size={19} />
                            </div>

                            <div>

                                <h2 className="font-bold text-slate-900">
                                    Informations personnelles
                                </h2>

                                <p className="text-xs text-slate-500 mt-1">
                                    Informations de la secrétaire
                                </p>

                            </div>

                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {/* PRENOM */}

                            <div>

                                <label className="
                                    block
                                    text-sm
                                    font-medium
                                    text-slate-700
                                    mb-2
                                ">
                                    Prénom *
                                </label>

                                <div className="relative">

                                    <User
                                        size={17}
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
                                        name="prenom"
                                        value={formData.prenom}
                                        onChange={handleChange}
                                        className="
                                            w-full
                                            h-11
                                            pl-10
                                            pr-4
                                            rounded-xl
                                            border
                                            border-slate-200
                                            outline-none
                                            focus:border-blue-500
                                            focus:ring-4
                                            focus:ring-blue-500/10
                                        "
                                    />

                                </div>

                            </div>


                            {/* NOM */}

                            <div>

                                <label className="
                                    block
                                    text-sm
                                    font-medium
                                    text-slate-700
                                    mb-2
                                ">
                                    Nom *
                                </label>

                                <input
                                    type="text"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleChange}
                                    className="
                                        w-full
                                        h-11
                                        px-4
                                        rounded-xl
                                        border
                                        border-slate-200
                                        outline-none
                                        focus:border-blue-500
                                        focus:ring-4
                                        focus:ring-blue-500/10
                                    "
                                />

                            </div>


                            {/* EMAIL */}

                            <div>

                                <label className="
                                    block
                                    text-sm
                                    font-medium
                                    text-slate-700
                                    mb-2
                                ">
                                    Email *
                                </label>

                                <div className="relative">

                                    <Mail
                                        size={17}
                                        className="
                                            absolute
                                            left-3
                                            top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                        "
                                    />

                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="
                                            w-full
                                            h-11
                                            pl-10
                                            pr-4
                                            rounded-xl
                                            border
                                            border-slate-200
                                            outline-none
                                            focus:border-blue-500
                                            focus:ring-4
                                            focus:ring-blue-500/10
                                        "
                                    />

                                </div>

                            </div>


                            {/* TELEPHONE */}

                            <div>

                                <label className="
                                    block
                                    text-sm
                                    font-medium
                                    text-slate-700
                                    mb-2
                                ">
                                    Téléphone
                                </label>

                                <div className="relative">

                                    <Phone
                                        size={17}
                                        className="
                                            absolute
                                            left-3
                                            top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                        "
                                    />

                                    <input
                                        type="tel"
                                        name="telephone"
                                        value={formData.telephone}
                                        onChange={handleChange}
                                        className="
                                            w-full
                                            h-11
                                            pl-10
                                            pr-4
                                            rounded-xl
                                            border
                                            border-slate-200
                                            outline-none
                                            focus:border-blue-500
                                            focus:ring-4
                                            focus:ring-blue-500/10
                                        "
                                    />

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* MOT DE PASSE */}

                    <div className="
                        bg-white
                        rounded-2xl
                        border
                        border-slate-200
                        shadow-sm
                        p-6
                    ">

                        <div className="flex items-center gap-3 mb-6">

                            <div className="
                                w-10
                                h-10
                                rounded-xl
                                bg-purple-100
                                text-purple-700
                                flex
                                items-center
                                justify-center
                            ">
                                <Lock size={19} />
                            </div>

                            <div>

                                <h2 className="font-bold text-slate-900">
                                    Mot de passe
                                </h2>

                                <p className="text-xs text-slate-500 mt-1">
                                    Laissez vide pour conserver le mot de passe actuel
                                </p>

                            </div>

                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            <div>

                                <label className="
                                    block
                                    text-sm
                                    font-medium
                                    text-slate-700
                                    mb-2
                                ">
                                    Nouveau mot de passe
                                </label>

                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="
                                        w-full
                                        h-11
                                        px-4
                                        rounded-xl
                                        border
                                        border-slate-200
                                        outline-none
                                        focus:border-blue-500
                                        focus:ring-4
                                        focus:ring-blue-500/10
                                    "
                                />

                            </div>


                            <div>

                                <label className="
                                    block
                                    text-sm
                                    font-medium
                                    text-slate-700
                                    mb-2
                                ">
                                    Confirmer le mot de passe
                                </label>

                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="
                                        w-full
                                        h-11
                                        px-4
                                        rounded-xl
                                        border
                                        border-slate-200
                                        outline-none
                                        focus:border-blue-500
                                        focus:ring-4
                                        focus:ring-blue-500/10
                                    "
                                />

                            </div>

                        </div>

                    </div>


                    {/* CABINET */}

                    <div className="
                        bg-white
                        rounded-2xl
                        border
                        border-slate-200
                        shadow-sm
                        p-6
                    ">

                        <div className="flex items-center gap-3 mb-6">

                            <div className="
                                w-10
                                h-10
                                rounded-xl
                                bg-emerald-100
                                text-emerald-700
                                flex
                                items-center
                                justify-center
                            ">
                                <Building2 size={19} />
                            </div>

                            <div>

                                <h2 className="font-bold text-slate-900">
                                    Cabinet
                                </h2>

                                <p className="text-xs text-slate-500 mt-1">
                                    Cabinet de rattachement
                                </p>

                            </div>

                        </div>


                        <label className="
                            block
                            text-sm
                            font-medium
                            text-slate-700
                            mb-2
                        ">
                            ID du cabinet
                        </label>

                        <input
                            type="number"
                            name="cabinet_id"
                            value={formData.cabinet_id}
                            onChange={handleChange}
                            placeholder="ID du cabinet"
                            className="
                                w-full
                                h-11
                                px-4
                                rounded-xl
                                border
                                border-slate-200
                                outline-none
                                focus:border-blue-500
                                focus:ring-4
                                focus:ring-blue-500/10
                            "
                        />

                    </div>


                    {/* STATUT */}

                    <div className="
                        bg-white
                        rounded-2xl
                        border
                        border-slate-200
                        shadow-sm
                        p-6
                    ">

                        <label className="
                            flex
                            items-center
                            justify-between
                            cursor-pointer
                        ">

                            <div>

                                <p className="font-semibold text-slate-800">
                                    Compte actif
                                </p>

                                <p className="text-xs text-slate-500 mt-1">
                                    Autoriser la secrétaire à utiliser son compte
                                </p>

                            </div>

                            <input
                                type="checkbox"
                                name="actif"
                                checked={formData.actif}
                                onChange={handleChange}
                                className="
                                    w-5
                                    h-5
                                    accent-blue-700
                                "
                            />

                        </label>

                    </div>


                    {/* ERREUR */}

                    {error && (

                        <div className="
                            p-4
                            rounded-xl
                            bg-red-50
                            border
                            border-red-200
                            text-sm
                            text-red-700
                        ">
                            {error}
                        </div>

                    )}


                    {/* ACTIONS */}

                    <div className="
                        flex
                        flex-col-reverse
                        sm:flex-row
                        sm:justify-end
                        gap-3
                        pb-8
                    ">

                        <Link
                            to="/admin/cabinet/secretaires"
                            className="
                                inline-flex
                                items-center
                                justify-center
                                px-6
                                h-11
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                                text-slate-700
                                font-semibold
                                text-sm
                                hover:bg-slate-50
                                transition
                            "
                        >
                            Annuler
                        </Link>


                        <button
                            type="submit"
                            disabled={saving}
                            className="
                                inline-flex
                                items-center
                                justify-center
                                gap-2
                                px-6
                                h-11
                                rounded-xl
                                bg-blue-700
                                text-white
                                font-semibold
                                text-sm
                                shadow-lg
                                shadow-blue-700/20
                                hover:bg-blue-800
                                disabled:opacity-60
                                disabled:cursor-not-allowed
                                transition
                            "
                        >

                            {saving ? (
                                <>
                                    <Loader2
                                        size={18}
                                        className="animate-spin"
                                    />
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Enregistrer les modifications
                                </>
                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default EditSecretaire;