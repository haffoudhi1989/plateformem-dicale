import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    UserPlus,
    User,
    HeartPulse,
    ArrowLeft,
    Camera,
    Save,
    Trash2,
    Loader2,
    AlertCircle
} from "lucide-react";

function AddPatient() {

    const navigate = useNavigate();

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        nom: "",
        prenom: "",
        date_naissance: "",
        sexe: "",
        telephone: "",
        email: "",
        password: "",
        adresse: "",
        groupe_sanguin: "",
        allergies: "",
        maladies_chroniques: "",
        antecedents: ""
    });

    // ============================
    // Photo du patient
    // ============================

    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

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
    };

    const retirerPhoto = () => {

        setPhoto(null);
        setPhotoPreview(null);

        if (inputPhotoRef.current) {
            inputPhotoRef.current.value = "";
        }
    };

    // ============================
    // Modifier le formulaire
    // ============================

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };

    // ============================
    // Ajouter patient
    // ============================

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

        if (!formData.email.trim()) {
            setError("Veuillez saisir l'email.");
            return;
        }

        if (!formData.password) {
            setError("Veuillez saisir un mot de passe.");
            return;
        }

        if (formData.password.length < 8) {
            setError(
                "Le mot de passe doit contenir au moins 8 caractères."
            );
            return;
        }

        try {

            setLoading(true);

            const data = new FormData();

            Object.keys(formData).forEach((key) => {

                data.append(key, formData[key]);

            });

            // Photo (facultative)
            if (photo) {
                data.append("photo", photo);
            }

            const response = await axios.post(
                "http://localhost:8000/api/patients",
                data,
                {
                    headers: {
                        Accept: "application/json"
                    }
                }
            );

            console.log(
                "Patient ajouté :",
                response.data
            );

            alert(
                "Patient et compte de connexion créés avec succès."
            );

            navigate("/admin/patients");

        } catch (error) {

            console.error(
                "Erreur ajout patient :",
                error.response?.data || error
            );

            if (error.response?.status === 422) {

                const errors =
                    error.response?.data?.errors;

                if (errors) {

                    const firstError =
                        Object.values(errors)[0]?.[0];

                    setError(
                        firstError ||
                        "Veuillez vérifier les informations saisies."
                    );

                    return;
                }
            }

            setError(
                error.response?.data?.message ||
                "Erreur lors de l'ajout du patient."
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <div>

            {/* ============================
                EN-TÊTE
            ============================ */}

            <div>

                                <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                            <UserPlus size={26} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                                Ajouter un patient
                            </h1>
                            <p className="text-blue-100 text-sm mt-0.5">
                                Enregistrez un nouveau patient et créez son compte de connexion.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                    {/* RETOUR */}

                    <button
                        type="button"
                        onClick={() => navigate("/admin/patients")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition border border-white/20 shadow-sm self-start md:self-auto cursor-pointer disabled:opacity-50"
                    >
                        <ArrowLeft size={14} />
                        Retour
                    </button>
                    </div>
                </div>

            </div>

            {/* ============================
                FORMULAIRE
            ============================ */}

            <div className="w-full">

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                    {/* HEADER FORMULAIRE */}

                    <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/70">

                        <div className="flex items-center gap-3">

                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">

                                <UserPlus size={19} />

                            </div>

                            <div>

                                <h2 className="font-bold text-slate-800">
                                    Informations du patient
                                </h2>

                                <p className="text-xs text-slate-500 mt-0.5">
                                    Complétez les informations ci-dessous.
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* ERREUR */}

                    {error && (

                        <div className="mx-5 md:mx-7 mt-5 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">

                            <AlertCircle size={19} className="shrink-0 mt-0.5" />

                            <div>
                                <p className="font-semibold text-sm">Erreur</p>
                                <p className="text-sm mt-0.5">{error}</p>
                            </div>

                        </div>

                    )}

                    {/* FORM */}

                    <form
                        onSubmit={handleSubmit}
                        className="p-6 lg:p-8"
                    >

                        {/* ============================
                            INFORMATIONS PERSONNELLES
                        ============================ */}

                        <div className="flex items-center gap-3 mb-6">

                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">

                                <User size={19} />

                            </div>

                            <div>

                                <h2 className="font-bold text-slate-800">
                                    Informations personnelles
                                </h2>

                                <p className="text-xs text-slate-500 mt-0.5">
                                    Informations générales du patient.
                                </p>

                            </div>

                        </div>

                        {/* ============================
                            PHOTO DU PATIENT
                        ============================ */}

                        <div className="flex items-center gap-5 mb-6">

                            <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center">

                                {photoPreview ? (

                                    <img
                                        src={photoPreview}
                                        alt="Photo du patient"
                                        className="w-full h-full object-cover"
                                    />

                                ) : (

                                    <User size={30} className="text-slate-300" />

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
                                            Retirer
                                        </button>

                                    )}

                                </div>

                                <p className="text-xs text-slate-400">
                                    JPG, PNG ou WebP — 4 Mo maximum.
                                </p>

                            </div>

                        </div>

                        <div className="
                            grid
                            grid-cols-1
                            md:grid-cols-2
                            gap-5
                        ">

                            {/* NOM */}

                            <div>

                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Nom

                                </label>

                                <input
                                    type="text"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleChange}
                                    placeholder="Ex : Ben Ali"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />

                            </div>

                            {/* PRENOM */}

                            <div>

                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Prénom

                                </label>

                                <input
                                    type="text"
                                    name="prenom"
                                    value={formData.prenom}
                                    onChange={handleChange}
                                    placeholder="Ex : Ahmed"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />

                            </div>

                            {/* DATE DE NAISSANCE */}

                            <div>

                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Date de naissance

                                </label>

                                <input
                                    type="date"
                                    name="date_naissance"
                                    value={formData.date_naissance}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />

                            </div>

                            {/* SEXE */}

                            <div>

                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Sexe

                                </label>

                                <select
                                    name="sexe"
                                    value={formData.sexe}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                >

                                    <option value="">
                                        -- Sélectionner le sexe --
                                    </option>

                                    <option value="homme">
                                        Homme
                                    </option>

                                    <option value="femme">
                                        Femme
                                    </option>

                                </select>

                            </div>

                            {/* TELEPHONE */}

                            <div>

                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Téléphone

                                </label>

                                <input
                                    type="text"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleChange}
                                    placeholder="Ex : 20 000 000"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />

                            </div>

                            {/* EMAIL */}

                            <div>

                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Email

                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="exemple@email.com"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />

                            </div>

                            {/* PASSWORD */}

                            <div>

                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Mot de passe

                                </label>

                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Minimum 8 caractères"
                                    required
                                    minLength={8}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />

                                <p className="text-xs text-slate-400 mt-1.5">
                                    Le mot de passe doit contenir au moins 8 caractères.
                                </p>

                            </div>

                            {/* ADRESSE */}

                            <div className="md:col-span-2">

                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Adresse

                                </label>

                                <textarea
                                    name="adresse"
                                    value={formData.adresse}
                                    onChange={handleChange}
                                    placeholder="Adresse complète du patient"
                                    rows="3"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition resize-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />

                            </div>

                        </div>

                        {/* ============================
                            INFORMATIONS MÉDICALES
                        ============================ */}

                        <div className="border-t border-slate-200 mt-7 pt-7">

                            <div className="flex items-center gap-3 mb-6">

                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">

                                    <HeartPulse size={19} />

                                </div>

                                <div>

                                    <h2 className="font-bold text-slate-800">
                                        Informations médicales
                                    </h2>

                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Informations de santé du patient.
                                    </p>

                                </div>

                            </div>

                            <div className="
                                grid
                                grid-cols-1
                                md:grid-cols-2
                                gap-5
                            ">

                                {/* GROUPE SANGUIN */}

                                <div>

                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Groupe sanguin

                                    </label>

                                    <select
                                        name="groupe_sanguin"
                                        value={formData.groupe_sanguin}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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

                                {/* ALLERGIES */}

                                <div>

                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Allergies

                                    </label>

                                    <textarea
                                        name="allergies"
                                        value={formData.allergies}
                                        onChange={handleChange}
                                        placeholder="Allergies connues"
                                        rows="3"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition resize-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />

                                </div>

                                {/* MALADIES CHRONIQUES */}

                                <div>

                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Maladies chroniques

                                    </label>

                                    <textarea
                                        name="maladies_chroniques"
                                        value={formData.maladies_chroniques}
                                        onChange={handleChange}
                                        placeholder="Maladies chroniques"
                                        rows="3"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition resize-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />

                                </div>

                                {/* ANTECEDENTS */}

                                <div>

                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Antécédents

                                    </label>

                                    <textarea
                                        name="antecedents"
                                        value={formData.antecedents}
                                        onChange={handleChange}
                                        placeholder="Antécédents médicaux"
                                        rows="3"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition resize-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />

                                </div>

                            </div>

                        </div>

                        {/* ============================
                            BOUTONS
                        ============================ */}

                        <div className="border-t border-slate-200 mt-7 pt-6">

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">

                                {/* ANNULER */}

                                <button
                                    type="button"
                                    onClick={() => navigate("/admin/patients")}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    Annuler
                                </button>

                                {/* AJOUTER */}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >

                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />

                                            Ajout en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />

                                            Ajouter le patient
                                        </>
                                    )}

                                </button>

                            </div>

                        </div>

                    </form>

                </div>

            </div>

        </div>
    );
}

export default AddPatient;