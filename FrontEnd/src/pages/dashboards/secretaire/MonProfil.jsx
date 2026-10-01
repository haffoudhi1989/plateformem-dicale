import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
    ArrowLeft,
    Mail,
    Phone,
    RefreshCw,
    Shield,
    CheckCircle2,
    XCircle,
    Sparkles,
    Building2,
    UserCheck,
    ChevronLeft,
    Camera,
    Trash2,
    Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { enregistrerPhotoProfil, urlPhoto } from "../../../services/profilSecretaire";

const API_URL = "http://127.0.0.1:8000/api";

export default function MonProfil() {
    const navigate = useNavigate();
    const [profil, setProfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadProfil = async () => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            setLoading(true);
            setError("");
            const response = await axios.get(`${API_URL}/profil`, {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            });
            setProfil(response.data?.data || response.data);
        } catch (err) {
            console.error("Erreur profil :", err);
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                navigate("/login");
                return;
            }
            setError(err.response?.data?.message || "Impossible de charger votre profil.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfil();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "Non renseigné";
        const date = new Date(dateString);
        return date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };

    const initials =
        (profil?.prenom?.charAt(0) || "S").toUpperCase() +
        (profil?.nom?.charAt(0) || "C").toUpperCase();

    /*
    |--------------------------------------------------------------------------
    | PHOTO DE PROFIL (envoi vers /secretaire/profil)
    |--------------------------------------------------------------------------
    */

    const [photoFile, setPhotoFile] = useState(null);
    const [apercuPhoto, setApercuPhoto] = useState(null);
    const [supprimerPhoto, setSupprimerPhoto] = useState(false);
    const [envoiPhoto, setEnvoiPhoto] = useState(false);
    const [messagePhoto, setMessagePhoto] = useState("");
    const [erreurPhoto, setErreurPhoto] = useState("");
    const [photoCassee, setPhotoCassee] = useState(false);

    const inputPhotoRef = useRef(null);

    const PHOTO_MAX = 4 * 1024 * 1024;

    /* Photo enregistrée côté serveur (masquée si on demande le retrait) */
    const photoServeur =
        !supprimerPhoto && (profil?.photo_url || urlPhoto(profil?.photo));

    const photoAffichee = apercuPhoto || photoServeur || null;

    useEffect(() => {
        setPhotoCassee(false);
    }, [photoAffichee]);

    const handlePhoto = (e) => {
        const fichier = e.target.files?.[0];

        setMessagePhoto("");
        setErreurPhoto("");

        if (!fichier) return;

        if (!["image/jpeg", "image/png", "image/webp"].includes(fichier.type)) {
            setErreurPhoto("Formats acceptés : JPG, PNG ou WEBP.");
            e.target.value = "";
            return;
        }

        if (fichier.size > PHOTO_MAX) {
            setErreurPhoto("La photo ne doit pas dépasser 4 Mo.");
            e.target.value = "";
            return;
        }

        if (apercuPhoto) {
            URL.revokeObjectURL(apercuPhoto);
        }

        setPhotoFile(fichier);
        setApercuPhoto(URL.createObjectURL(fichier));
        setSupprimerPhoto(false);
    };

    const retirerPhoto = () => {
        if (apercuPhoto) {
            URL.revokeObjectURL(apercuPhoto);
        }

        setPhotoFile(null);
        setApercuPhoto(null);
        setSupprimerPhoto(true);
        setMessagePhoto("");
        setErreurPhoto("");

        if (inputPhotoRef.current) {
            inputPhotoRef.current.value = "";
        }
    };

    const enregistrerPhoto = async () => {
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        if (!photoFile && !supprimerPhoto) {
            setErreurPhoto("Choisissez d'abord une photo.");
            return;
        }

        try {
            setEnvoiPhoto(true);
            setMessagePhoto("");
            setErreurPhoto("");

            const formData = new FormData();

            if (photoFile) {
                formData.append("photo", photoFile);
            }

            if (supprimerPhoto) {
                formData.append("remove_photo", "1");
            }

            // POST et non PUT : PHP ne décode pas « multipart/form-data » sur PUT.
            const response = await axios.post(
                `${API_URL}/secretaire/profil`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            const fiche = response.data?.data || {};

            setProfil((courant) => ({ ...courant, ...fiche }));

            if (apercuPhoto) {
                URL.revokeObjectURL(apercuPhoto);
            }

            setPhotoFile(null);
            setApercuPhoto(null);
            setSupprimerPhoto(false);

            if (inputPhotoRef.current) {
                inputPhotoRef.current.value = "";
            }

            // Avatar de la barre latérale mis à jour sans reconnexion
            enregistrerPhotoProfil(fiche.photo || null);

            setMessagePhoto(
                response.data?.message || "Photo de profil mise à jour."
            );
        } catch (err) {
            setErreurPhoto(
                err.response?.data?.message ||
                    "Impossible d'enregistrer la photo."
            );
        } finally {
            setEnvoiPhoto(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            {/* EN-TÊTE PRINCIPAL — BANNIÈRE VERRE */}
            <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/60 backdrop-blur-md shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="absolute -top-10 -right-8 h-32 w-32 rounded-full bg-emerald-200/30 blur-2xl pointer-events-none" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-1">
                        <button
                            type="button"
                            onClick={() => navigate("/secretaire/dashboard")}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-violet-600 transition cursor-pointer"
                        >
                            <ChevronLeft size={16} />
                            Dashboard
                        </button>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600">
                            Secrétariat Médical
                        </span>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">
                        Mon Profil Professionnel
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Consultez vos informations personnelles et identifiants du cabinet
                    </p>
                </div>

                <div className="relative flex items-center gap-2">
                    
                </div>
            </div>

            {/* CHARGEMENT */}
            {loading && (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-12 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-sm font-bold text-slate-700">Chargement de votre profil...</p>
                </div>
            )}

            {/* ERREUR */}
            {!loading && error && (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm flex items-center gap-3">
                    <XCircle size={20} className="shrink-0" />
                    <span className="text-xs font-bold">{error}</span>
                </div>
            )}

            {/* CONTENU DU PROFIL */}
            {!loading && !error && profil && (
                <div className="space-y-6">
                    {/* CARTE IDENTITÉ */}
                    <section className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                            <div className="flex flex-col items-center gap-3 shrink-0">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl md:text-3xl shadow-lg shadow-violet-500/25">
                                    {photoAffichee && !photoCassee ? (
                                        <img
                                            src={photoAffichee}
                                            alt="Photo de profil"
                                            className="w-full h-full object-cover"
                                            onError={() => setPhotoCassee(true)}
                                        />
                                    ) : (
                                        initials
                                    )}
                                </div>

                                <input
                                    ref={inputPhotoRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handlePhoto}
                                    className="hidden"
                                />

                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => inputPhotoRef.current?.click()}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 text-[11px] font-bold transition cursor-pointer"
                                    >
                                        <Camera size={13} />
                                        {photoAffichee ? "Changer" : "Choisir une photo"}
                                    </button>

                                    {photoAffichee && !supprimerPhoto && (
                                        <button
                                            type="button"
                                            onClick={retirerPhoto}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 text-[11px] font-bold transition cursor-pointer"
                                        >
                                            <Trash2 size={13} />
                                            Retirer
                                        </button>
                                    )}

                                    {(photoFile || supprimerPhoto) && (
                                        <button
                                            type="button"
                                            onClick={enregistrerPhoto}
                                            disabled={envoiPhoto}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-3 py-2 text-[11px] font-bold transition cursor-pointer"
                                        >
                                            {envoiPhoto ? (
                                                <Loader2 size={13} className="animate-spin" />
                                            ) : (
                                                <CheckCircle2 size={13} />
                                            )}
                                            {envoiPhoto ? "Envoi..." : "Enregistrer"}
                                        </button>
                                    )}
                                </div>

                                {messagePhoto && (
                                    <p className="text-[11px] font-bold text-emerald-600 text-center">{messagePhoto}</p>
                                )}

                                {erreurPhoto && (
                                    <p className="text-[11px] font-bold text-rose-600 text-center">{erreurPhoto}</p>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-bold mb-2">
                                    <Sparkles size={13} className="text-amber-500" />
                                    Secrétariat Médical
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                                    {profil.prenom} {profil.nom}
                                </h2>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                                    <span className="flex items-center gap-1.5">
                                        <Mail size={14} className="text-violet-600" />
                                        {profil.email}
                                    </span>
                                    {profil.telephone && (
                                        <>
                                            <span className="text-slate-300">•</span>
                                            <span className="flex items-center gap-1.5">
                                                <Phone size={14} className="text-emerald-600" />
                                                {profil.telephone}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* COORDONNÉES ET CONTACT */}
                    <section className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
                                <UserCheck size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">
                                    Coordonnées du compte
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Informations de contact et d'affectation
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <Mail size={14} className="text-violet-600" />
                                    <span>Adresse E-mail</span>
                                </div>
                                <p className="text-sm font-bold text-slate-800 break-all">{profil.email || "-"}</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <Phone size={14} className="text-emerald-600" />
                                    <span>Numéro de Téléphone</span>
                                </div>
                                <p className="text-sm font-bold text-slate-800">{profil.telephone || "Non renseigné"}</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <Building2 size={14} className="text-indigo-600" />
                                    <span>Cabinet Médical</span>
                                </div>
                                <p className="text-sm font-bold text-slate-800">
                                    {profil.cabinet?.nom || (profil.cabinet_id ? `Cabinet #${profil.cabinet_id}` : "Cabinet Principal")}
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <Shield size={14} className="text-amber-600" />
                                    <span>Rôle Attribué</span>
                                </div>
                                <p className="text-sm font-bold text-slate-800">Secrétaire Médicale</p>
                            </div>
                        </div>

                        {/* DROITS & ACCÈS */}
                        <div className="pt-4 border-t border-slate-100">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                                Droits et Autorisations
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div className="flex items-center gap-2 p-3 rounded-2xl bg-violet-50/60 border border-violet-100 text-xs font-bold text-violet-800">
                                    <CheckCircle2 size={15} className="text-violet-600 shrink-0" />
                                    <span>Gestion des RDV</span>
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs font-bold text-emerald-800">
                                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                    <span>Fichiers Patients</span>
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs font-bold text-indigo-800">
                                    <CheckCircle2 size={15} className="text-indigo-600 shrink-0" />
                                    <span>Messagerie Directe</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
