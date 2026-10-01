import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Save,
    ArrowLeft,
    UserRound,
    CalendarDays,
    Phone,
    Mail,
    MapPin,
    HeartPulse,
    Camera,
    Trash2,
    Loader2
} from "lucide-react";

import {
    getPatient,
    updatePatient
} from "../../services/patientService";

function EditPatient() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        nom: "",
        prenom: "",
        date_naissance: "",
        sexe: "",
        telephone: "",
        email: "",
        adresse: "",
        groupe_sanguin: "",
        allergies: "",
        maladies_chroniques: "",
        antecedents: ""
    });

    // =====================================================
    // PHOTO DU PATIENT
    // =====================================================

    const API_ROOT = "http://127.0.0.1:8000";

    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [supprimerPhoto, setSupprimerPhoto] = useState(false);

    const inputPhotoRef = useRef(null);

    const handlePhoto = (e) => {

        const fichier = e.target.files?.[0];

        if (!fichier) return;

        if (
            !["image/jpeg", "image/png", "image/webp"].includes(
                fichier.type
            )
        ) {
            setError("Format non pris en charge (JPG, PNG ou WebP).");
            e.target.value = "";
            return;
        }

        if (fichier.size > 4 * 1024 * 1024) {
            setError("La photo ne doit pas dépasser 4 Mo.");
            e.target.value = "";
            return;
        }

        setError("");
        setPhoto(fichier);
        setPhotoPreview(URL.createObjectURL(fichier));
        setSupprimerPhoto(false);
    };

    const retirerPhoto = () => {

        setPhoto(null);
        setPhotoPreview(null);
        setSupprimerPhoto(true);

        if (inputPhotoRef.current) {
            inputPhotoRef.current.value = "";
        }
    };

    // =====================================================
    // FORMATER LA DATE POUR INPUT type="date"
    // =====================================================

    const formatDateForInput = (date) => {
        if (!date) return "";

        // Si Laravel retourne déjà YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
        }

        // Si Laravel retourne une date ISO
        if (date.includes("T")) {
            return date.split("T")[0];
        }

        // Tentative de conversion
        const parsedDate = new Date(date);

        if (!isNaN(parsedDate.getTime())) {
            const year = parsedDate.getFullYear();
            const month = String(
                parsedDate.getMonth() + 1
            ).padStart(2, "0");
            const day = String(
                parsedDate.getDate()
            ).padStart(2, "0");

            return `${year}-${month}-${day}`;
        }

        return "";
    };

    // =====================================================
    // CHARGER PATIENT
    // =====================================================

    useEffect(() => {
        const loadPatient = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await getPatient(id);

                console.log("Réponse patient :", response.data);

                /*
                 * Laravel peut retourner :
                 *
                 * {
                 *   data: {...}
                 * }
                 *
                 * ou
                 *
                 * {
                 *   patient: {...}
                 * }
                 *
                 * ou directement :
                 *
                 * {...}
                 */

                const responseData = response?.data;

                const patient =
                    responseData?.patient ||
                    responseData?.data ||
                    responseData;

                console.log("Patient récupéré :", patient);

                if (!patient || !patient.id) {
                    setError("Patient introuvable.");
                    return;
                }

                // IMPORTANT :
                // On construit manuellement formData
                // afin d'éviter les champs undefined.

                setFormData({
                    nom: patient.nom ?? "",
                    prenom: patient.prenom ?? "",

                    date_naissance: formatDateForInput(
                        patient.date_naissance
                    ),

                    sexe: patient.sexe ?? "",
                    telephone: patient.telephone ?? "",
                    email: patient.email ?? "",
                    adresse: patient.adresse ?? "",
                    groupe_sanguin:
                        patient.groupe_sanguin ?? "",
                    allergies: patient.allergies ?? "",
                    maladies_chroniques:
                        patient.maladies_chroniques ?? "",
                    antecedents:
                        patient.antecedents ?? ""
                });

                // Photo existante
                setPhotoPreview(
                    patient.photo
                        ? `${API_ROOT}/storage/${patient.photo}`
                        : null
                );

                setSupprimerPhoto(false);
                setPhoto(null);

            } catch (err) {
                console.error(
                    "Erreur chargement patient :",
                    err
                );

                console.error(
                    "Réponse serveur :",
                    err.response?.data
                );

                setError(
                    err.response?.data?.message ||
                    "Impossible de charger le patient."
                );
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadPatient();
        }
    }, [id]);

    // =====================================================
    // MODIFIER UN CHAMP
    // =====================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // =====================================================
    // ENREGISTRER
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!formData.nom.trim()) {
            setError("Veuillez saisir le nom.");
            return;
        }

        if (!formData.prenom.trim()) {
            setError("Veuillez saisir le prénom.");
            return;
        }

        try {
            setSaving(true);

            const data = new FormData();

            data.append(
                "nom",
                formData.nom.trim()
            );

            data.append(
                "prenom",
                formData.prenom.trim()
            );

            data.append(
                "date_naissance",
                formData.date_naissance || ""
            );

            data.append(
                "sexe",
                formData.sexe || ""
            );

            data.append(
                "telephone",
                formData.telephone || ""
            );

            data.append(
                "email",
                formData.email || ""
            );

            data.append(
                "adresse",
                formData.adresse || ""
            );

            data.append(
                "groupe_sanguin",
                formData.groupe_sanguin || ""
            );

            data.append(
                "allergies",
                formData.allergies || ""
            );

            data.append(
                "maladies_chroniques",
                formData.maladies_chroniques || ""
            );

            data.append(
                "antecedents",
                formData.antecedents || ""
            );

            // Photo : nouvelle image envoyée ou suppression explicite
            if (photo) {
                data.append("photo", photo);
            }

            if (supprimerPhoto) {
                data.append("remove_photo", "1");
            }

            // Laravel reçoit le PUT via POST multipart
            data.append("_method", "PUT");

            console.log(
                "Données envoyées :",
                formData
            );

            await updatePatient(id, data);

            alert(
                "Patient modifié avec succès."
            );

            navigate("/admin/patients");

        } catch (err) {
            console.error(
                "Erreur modification patient :",
                err
            );

            console.error(
                "Réponse serveur :",
                err.response?.data
            );

            if (
                err.response?.data?.errors
            ) {
                console.log(
                    "Erreurs validation :",
                    err.response.data.errors
                );
            }

            setError(
                err.response?.data?.message ||
                "Impossible d'enregistrer les modifications."
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
            <div className="min-h-full bg-gray-50 p-6">
                <div className="w-full">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">

                        <Loader2
                            size={40}
                            className="mx-auto text-blue-700 animate-spin"
                        />

                        <p className="mt-4 text-gray-600 font-medium">
                            Chargement du patient...
                        </p>

                    </div>
                </div>
            </div>
        );
    }

    // =====================================================
    // AFFICHAGE
    // =====================================================

    return (
        <div className="min-h-full bg-gray-50">

            {/* BANNIÈRE */}
            <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <UserRound size={26} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                            Modifier le patient
                        </h1>
                        <p className="text-blue-100 text-sm mt-0.5">
                            Modifiez les informations du patient.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() =>
                            navigate("/admin/patients")
                        }
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-blue-50 hover:text-blue-700 transition"
                    >
                        <ArrowLeft size={18} />
                        Retour
                    </button>
                </div>
            </div>


            {/* =====================================================
                ERREUR
            ===================================================== */}

            {error && (
                <div className="w-full mb-5">
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                </div>
            )}

            {/* =====================================================
                FORMULAIRE
            ===================================================== */}

            <div className="w-full">

                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >

                    {/* HEADER FORM */}

                    <div className="px-5 md:px-7 py-5 bg-gradient-to-r from-[#26415E] to-[#3A5570]">

                        <div className="flex items-center gap-3">

                            <div className="w-11 h-11 rounded-xl bg-blue-700 text-white flex items-center justify-center">
                                <UserRound size={22} />
                            </div>

                            <div>

                                <h2 className="text-lg font-bold text-gray-900">
                                    Informations du patient
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Modifiez les informations ci-dessous.
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* CONTENU */}

                    <div className="p-5 md:p-7">

                        {/* =====================================================
                            INFORMATIONS PERSONNELLES
                        ===================================================== */}

                        <div className="flex items-center gap-3 mb-6">

                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                                <UserRound size={20} />
                            </div>

                            <div>

                                <h3 className="text-lg font-bold text-gray-900">
                                    Informations personnelles
                                </h3>

                                <p className="text-sm text-gray-500">
                                    Informations générales du patient.
                                </p>

                            </div>

                        </div>

                        {/* =====================================================
                            PHOTO DU PATIENT
                        ===================================================== */}

                        <div className="flex items-center gap-5 mb-6">

                            <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center">

                                {photoPreview ? (

                                    <img
                                        src={photoPreview}
                                        alt="Photo du patient"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                        }}
                                    />

                                ) : (

                                    <UserRound
                                        size={30}
                                        className="text-slate-300"
                                    />

                                )}

                            </div>

                            <div className="space-y-2">

                                <label className="block text-sm font-semibold text-slate-700">
                                    Photo du patient
                                </label>

                                <div className="flex flex-wrap items-center gap-3">

                                    <input
                                        ref={inputPhotoRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handlePhoto}
                                        className="hidden"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            inputPhotoRef.current?.click()
                                        }
                                        className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition cursor-pointer"
                                    >
                                        <Camera size={17} />
                                        {photoPreview
                                            ? "Changer la photo"
                                            : "Choisir une photo"}
                                    </button>

                                    {photoPreview && (

                                        <button
                                            type="button"
                                            onClick={retirerPhoto}
                                            className="inline-flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition cursor-pointer"
                                        >
                                            <Trash2 size={17} />
                                            Supprimer
                                        </button>

                                    )}

                                </div>

                                <p className="text-xs text-slate-400">
                                    JPG, PNG ou WebP — 4 Mo maximum.
                                </p>

                            </div>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {/* NOM */}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nom
                                </label>

                                <input
                                    type="text"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleChange}
                                    placeholder="Nom"
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                                />
                            </div>

                            {/* PRENOM */}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Prénom
                                </label>

                                <input
                                    type="text"
                                    name="prenom"
                                    value={formData.prenom}
                                    onChange={handleChange}
                                    placeholder="Prénom"
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                                />
                            </div>

                            {/* DATE */}

                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">

                                    <CalendarDays
                                        size={16}
                                        className="text-blue-600"
                                    />

                                    Date de naissance

                                </label>

                                <input
                                    type="date"
                                    name="date_naissance"
                                    value={formData.date_naissance}
                                    onChange={handleChange}
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                                />
                            </div>

                            {/* SEXE */}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Sexe
                                </label>

                                <select
                                    name="sexe"
                                    value={formData.sexe}
                                    onChange={handleChange}
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                                >
                                    <option value="">
                                        -- Sélectionner --
                                    </option>

                                    <option value="homme">
                                        Homme
                                    </option>

                                    <option value="femme">
                                        Femme
                                    </option>

                                    <option value="Homme">
                                        Homme
                                    </option>

                                    <option value="Femme">
                                        Femme
                                    </option>
                                </select>
                            </div>

                            {/* TELEPHONE */}

                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">

                                    <Phone
                                        size={16}
                                        className="text-blue-600"
                                    />

                                    Téléphone

                                </label>

                                <input
                                    type="text"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleChange}
                                    placeholder="Téléphone"
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                                />
                            </div>

                            {/* EMAIL */}

                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">

                                    <Mail
                                        size={16}
                                        className="text-blue-600"
                                    />

                                    Email

                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Email"
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                                />
                            </div>

                            {/* ADRESSE */}

                            <div className="md:col-span-2">

                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">

                                    <MapPin
                                        size={16}
                                        className="text-blue-600"
                                    />

                                    Adresse

                                </label>

                                <textarea
                                    name="adresse"
                                    value={formData.adresse}
                                    onChange={handleChange}
                                    placeholder="Adresse"
                                    rows="3"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none resize-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                                />

                            </div>

                            {/* GROUPE SANGUIN */}

                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">

                                    <HeartPulse
                                        size={16}
                                        className="text-blue-600"
                                    />

                                    Groupe sanguin

                                </label>

                                <select
                                    name="groupe_sanguin"
                                    value={formData.groupe_sanguin}
                                    onChange={handleChange}
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                                >

                                    <option value="">
                                        -- Sélectionner --
                                    </option>

                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>

                                </select>

                            </div>

                        </div>

                        {/* =====================================================
                            INFORMATIONS MEDICALES
                        ===================================================== */}

                        <div className="border-t border-gray-200 mt-8 pt-7">

                            <div className="flex items-center gap-3 mb-6">

                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">

                                    <HeartPulse size={20} />

                                </div>

                                <div>

                                    <h3 className="text-lg font-bold text-gray-900">
                                        Informations médicales
                                    </h3>

                                    <p className="text-sm text-gray-500">
                                        Allergies, maladies chroniques et antécédents.
                                    </p>

                                </div>

                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                                {/* ALLERGIES */}

                                <div>

                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Allergies
                                    </label>

                                    <textarea
                                        name="allergies"
                                        value={formData.allergies}
                                        onChange={handleChange}
                                        placeholder="Allergies connues"
                                        rows="4"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none resize-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                                    />

                                </div>

                                {/* MALADIES */}

                                <div>

                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Maladies chroniques
                                    </label>

                                    <textarea
                                        name="maladies_chroniques"
                                        value={formData.maladies_chroniques}
                                        onChange={handleChange}
                                        placeholder="Maladies chroniques"
                                        rows="4"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none resize-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                                    />

                                </div>

                                {/* ANTECEDENTS */}

                                <div>

                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Antécédents
                                    </label>

                                    <textarea
                                        name="antecedents"
                                        value={formData.antecedents}
                                        onChange={handleChange}
                                        placeholder="Antécédents médicaux"
                                        rows="4"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none resize-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                                    />

                                </div>

                            </div>

                        </div>

                        {/* =====================================================
                            ACTIONS
                        ===================================================== */}

                        <div className="border-t border-gray-200 mt-8 pt-6">

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/admin/patients")
                                    }
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition"
                                >

                                    <ArrowLeft size={18} />

                                    Annuler

                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
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

                                            Enregistrer
                                        </>
                                    )}

                                </button>

                            </div>

                        </div>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default EditPatient;