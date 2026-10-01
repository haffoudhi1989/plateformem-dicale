import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

import {
    Camera,
    Eye,
    EyeOff,
    Lock,
    Mail,
    Phone,
    Save,
    Settings,
    Trash2,
    UserCircle
} from "lucide-react";

const API = "http://127.0.0.1:8000";

const PHOTO_DEFAUT = "/admin.png";

// =====================================================
// URL DE LA PHOTO
// =====================================================
// Construite à partir du chemin relatif renvoyé par l'API, comme
// dans PatientProfil : l'image ne dépend donc pas de APP_URL /
// asset() côté back-end.

const urlPhoto = (profil) => {

    if (profil?.photo) {
        return `${API}/storage/${profil.photo}`;
    }

    return profil?.photo_url || null;
};

// =====================================================
// CHAMP MOT DE PASSE
// =====================================================
// Défini au niveau du module : sinon le champ est recréé à chaque
// saisie et perd le focus à chaque caractère.

function PasswordInput({
    label,
    value,
    setValue,
    showPassword,
    setShowPassword,
    placeholder
}) {

    return (

        <div>

            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                {label}
            </label>

            <div className="relative">

                <Lock
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-12 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />

                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition"
                >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>

            </div>

        </div>
    );
}

function Parametres() {

    // =====================================================
    // COORDONNEES
    // =====================================================

    const [nom, setNom] = useState("");
    const [email, setEmail] = useState("");
    const [telephone, setTelephone] = useState("");

    // =====================================================
    // PHOTO
    // =====================================================

    const [photoFile, setPhotoFile] = useState(null);
    const [photoUrl, setPhotoUrl] = useState(null);
    const [supprimerPhoto, setSupprimerPhoto] = useState(false);

    const inputPhotoRef = useRef(null);

    // =====================================================
    // MOT DE PASSE (optionnel)
    // =====================================================

    const [motDePasse, setMotDePasse] = useState("");
    const [confirmation, setConfirmation] = useState("");

    const [showMotDePasse, setShowMotDePasse] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // =====================================================
    // ETAT
    // =====================================================

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [chargement, setChargement] = useState(true);

    // =====================================================
    // SESSION
    // =====================================================

    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
    };

    // =====================================================
    // PROFIL LOCAL (repli)
    // =====================================================

    const lireUserLocal = () => {

        try {

            const brut =
                localStorage.getItem("user") ||
                sessionStorage.getItem("user");

            return brut ? JSON.parse(brut) : null;

        } catch {

            return null;

        }
    };

    const ecrireUserLocal = (patch) => {

        [localStorage, sessionStorage].forEach((stockage) => {

            const brut = stockage.getItem("user");

            if (!brut) return;

            try {

                stockage.setItem(
                    "user",
                    JSON.stringify({
                        ...JSON.parse(brut),
                        ...patch
                    })
                );

            } catch {

                /* stockage indisponible : on ignore */

            }
        });
    };

    // =====================================================
    // CHARGEMENT DES COORDONNEES
    // =====================================================

    const chargerParametres = async () => {

        setChargement(true);

        try {

            const response = await axios.get(
                `${API}/api/admin/parametres`,
                { headers }
            );

            const profil = response.data?.data || {};

            setNom(profil.name || "");
            setEmail(profil.email || "");
            setTelephone(profil.telephone || "");
            setPhotoUrl(urlPhoto(profil));

        } catch (err) {

            console.error(
                "Chargement paramètres :",
                err.response?.data || err
            );

            // Repli : informations de la session en cours
            const local = lireUserLocal();

            if (local) {

                setNom(local.name || "");
                setEmail(local.email || "");
                setTelephone(local.telephone || "");
                setPhotoUrl(urlPhoto(local));
            }

        } finally {

            setChargement(false);
            setSupprimerPhoto(false);
            setPhotoFile(null);

            if (inputPhotoRef.current) {
                inputPhotoRef.current.value = "";
            }
        }
    };

    useEffect(() => {

        chargerParametres();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // =====================================================
    // CHOIX DE LA PHOTO
    // =====================================================

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
        setPhotoFile(fichier);
        setPhotoUrl(URL.createObjectURL(fichier));
        setSupprimerPhoto(false);
    };

    const retirerPhoto = () => {

        setPhotoFile(null);
        setPhotoUrl(null);
        setSupprimerPhoto(true);

        if (inputPhotoRef.current) {
            inputPhotoRef.current.value = "";
        }
    };

    // =====================================================
    // ENREGISTRER
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setMessage("");
        setError("");

        if (!nom.trim()) {
            setError("Veuillez saisir votre nom complet.");
            return;
        }

        if (!email.trim()) {
            setError("Veuillez saisir votre adresse email.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError("Veuillez saisir une adresse email valide.");
            return;
        }

        if (
            telephone.trim() &&
            !/^[0-9+\s().-]{6,20}$/.test(telephone.trim())
        ) {
            setError("Veuillez saisir un numéro de téléphone valide.");
            return;
        }

        // Mot de passe : optionnel (vide = inchangé)
        if (motDePasse) {

            if (motDePasse.length < 8) {
                setError(
                    "Le nouveau mot de passe doit contenir au moins 8 caractères."
                );
                return;
            }

            if (motDePasse !== confirmation) {
                setError("Les deux mots de passe ne correspondent pas.");
                return;
            }
        }

        if (!token) {
            setError(
                "Votre session a expiré. Veuillez vous reconnecter."
            );
            return;
        }

        try {

            setLoading(true);

            const formData = new FormData();

            formData.append("name", nom.trim());
            formData.append("email", email.trim());
            formData.append("telephone", telephone.trim());

            if (motDePasse) {
                formData.append("password", motDePasse);
                formData.append("password_confirmation", confirmation);
            }

            if (photoFile) {
                formData.append("photo", photoFile);
            }

            if (supprimerPhoto) {
                formData.append("remove_photo", "1");
            }

            // POST et non PUT : PHP ne décode pas « multipart/form-data »
            // pour les requêtes PUT, tous les champs arriveraient vides
            // (erreur « The name field is required. »).
            const response = await axios.post(
                `${API}/api/admin/parametres`,
                formData,
                { headers }
            );

            const profil = response.data?.data || {};

            setMessage(
                response.data?.message ||
                "Paramètres enregistrés avec succès."
            );

            setPhotoUrl(urlPhoto(profil));
            setPhotoFile(null);
            setSupprimerPhoto(false);
            setMotDePasse("");
            setConfirmation("");

            if (inputPhotoRef.current) {
                inputPhotoRef.current.value = "";
            }

            // Mise à jour de la session (sidebar = nom + photo)
            ecrireUserLocal({
                name: profil.name,
                email: profil.email,
                telephone: profil.telephone,
                photo: profil.photo,
                photo_url: urlPhoto(profil)
            });

            window.dispatchEvent(new Event("admin-profile-updated"));

        } catch (err) {

            console.error(
                "Erreur paramètres :",
                err.response?.data || err
            );

            const data = err.response?.data;

            if (data?.errors) {

                const premier = Object.values(data.errors)[0];

                setError(
                    Array.isArray(premier) ? premier[0] : premier
                );

            } else {

                setError(
                    data?.message ||
                    "Une erreur est survenue. Vérifiez que l'API est démarrée."
                );
            }

        } finally {

            setLoading(false);
        }
    };

    // =====================================================
    // AFFICHAGE
    // =====================================================

    return (

        <div className="space-y-6">

            {/* ================================================= */}
            {/* EN-TÊTE */}
            {/* ================================================= */}

            <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <Settings size={26} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                            Paramètres
                        </h1>
                        <p className="text-blue-100 text-sm mt-0.5">
                            Vos coordonnées, votre photo et votre mot de passe
                        </p>
                    </div>
                </div>
            </div>


            {/* MESSAGE SUCCÈS */}

            {message && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800 p-4 font-semibold text-sm shadow-sm flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {message}
                </div>
            )}


            {/* MESSAGE ERREUR */}

            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 p-4 font-semibold text-sm shadow-sm flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    {error}
                </div>
            )}


            {/* CARTE FORMULAIRE */}

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

                {/* HEADER CARTE */}

                <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center gap-4">

                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                        <UserCircle size={26} />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            Profil administrateur
                        </h2>

                        <p className="text-xs text-slate-400 mt-0.5">
                            Modifier vos coordonnées et votre photo
                        </p>
                    </div>

                </div>


                {/* FORMULAIRE */}

                <form
                    onSubmit={handleSubmit}
                    className="p-6 md:p-8 space-y-6"
                >

                    {chargement && (
                        <p className="text-sm font-medium text-slate-400">
                            Chargement de vos informations…
                        </p>
                    )}

                    {/* PHOTO */}

                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">

                        <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-slate-100 ring-1 ring-slate-200">
                            <img
                                src={photoUrl || PHOTO_DEFAUT}
                                alt="Photo de profil"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = PHOTO_DEFAUT;
                                }}
                            />
                        </div>

                        <div className="space-y-2">

                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                                Photo de profil
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
                                    {photoUrl ? "Changer la photo" : "Choisir une photo"}
                                </button>

                                {photoUrl && (
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


                    {/* NOM COMPLET */}

                    <div>

                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Nom complet
                        </label>

                        <div className="relative">

                            <UserCircle
                                size={19}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={nom}
                                onChange={(e) => setNom(e.target.value)}
                                placeholder="Nom et prénom"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                                required
                            />

                        </div>

                    </div>


                    {/* EMAIL */}

                    <div>

                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Adresse email
                        </label>

                        <div className="relative">

                            <Mail
                                size={19}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                                required
                            />

                        </div>

                    </div>


                    {/* TELEPHONE */}

                    <div>

                       

                      
                    </div>


                    {/* MOT DE PASSE */}

                    <div className="pt-2 border-t border-slate-100 space-y-6">

                        <p className="text-xs font-semibold text-slate-400 pt-4">
                            Mot de passe — laissez vide pour conserver le
                            mot de passe actuel.
                        </p>

                        <PasswordInput
                            label="Nouveau mot de passe"
                            value={motDePasse}
                            setValue={setMotDePasse}
                            showPassword={showMotDePasse}
                            setShowPassword={setShowMotDePasse}
                            placeholder="Minimum 8 caractères"
                        />

                        <PasswordInput
                            label="Confirmer le nouveau mot de passe"
                            value={confirmation}
                            setValue={setConfirmation}
                            showPassword={showConfirmation}
                            setShowPassword={setShowConfirmation}
                            placeholder="Retapez le nouveau mot de passe"
                        />

                    </div>


                    {/* BOUTONS */}

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-semibold text-sm transition shadow-md shadow-blue-700/20 disabled:opacity-60 cursor-pointer"
                        >
                            <Save size={18} />
                            {loading ? "Enregistrement..." : "Enregistrer"}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setMessage("");
                                setError("");
                                chargerParametres();
                            }}
                            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold text-sm transition cursor-pointer"
                        >
                            Annuler
                        </button>

                    </div>

                </form>

            </div>

        </div>

    );
}

export default Parametres;
