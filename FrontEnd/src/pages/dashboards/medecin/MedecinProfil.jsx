import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Mail,
    Phone,
    MapPin,
    Stethoscope,
    Building2,
    Loader2,
    CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_URL, urlPhoto } from "../../../services/profilMedecin";
import { filtrerSpecialites } from "../../../services/specialites";

/* Carte d'information non modifiable (profil médecin). */
function CarteInfo({ icon: Icon, label, value }) {
    return (
        <div className="flex gap-4 rounded-xl bg-slate-50 p-5 border border-slate-200">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm text-emerald-600">
                <Icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="font-semibold text-slate-800 truncate">{value || "Non renseigné"}</p>
            </div>
        </div>
    );
}

export default function MedecinProfil() {
    const navigate = useNavigate();

    const [profil, setProfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* Photo affichée uniquement (aucun envoi depuis cette page). */
    const [photoCassee, setPhotoCassee] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | COMPLÉTER LES INFORMATIONS MANQUANTES
    |--------------------------------------------------------------------------
    | Les champs vides de la fiche (téléphone, adresse, spécialité) peuvent
    | être renseignés directement depuis cette page.
    */

    const [champs, setChamps] = useState({
        telephone: "",
        adresse: "",
        specialite_id: "",
    });
    const [specialites, setSpecialites] = useState([]);
    const [enregistrementChamps, setEnregistrementChamps] = useState(false);
    const [messageChamps, setMessageChamps] = useState("");
    const [erreurChamps, setErreurChamps] = useState("");

    const token = () =>
        localStorage.getItem("token") || sessionStorage.getItem("token");

    const loadProfil = async () => {
        const jeton = token();

        if (!jeton) {
            navigate("/login");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await axios.get(`${API_URL}/medecin/profil`, {
                headers: { Authorization: `Bearer ${jeton}`, Accept: "application/json" },
            });

            const fiche = response.data?.data;

            setProfil(fiche);
            setChamps({
                telephone: fiche?.telephone || "",
                adresse: fiche?.adresse || "",
                specialite_id: fiche?.specialite_id
                    ? String(fiche.specialite_id)
                    : "",
            });
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                navigate("/login");
                return;
            }

            setError(
                err.response?.data?.message ||
                    "Impossible de charger votre profil."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfil();
    }, []);

    /* Liste des spécialités (pour compléter le champ vide) */
    useEffect(() => {
        const jeton = token();

        if (!jeton) return;

        axios
            .get(`${API_URL}/specialites`, {
                headers: {
                    Authorization: `Bearer ${jeton}`,
                    Accept: "application/json",
                },
            })
            .then((response) => {
                const liste = response.data?.data || response.data || [];

                // Seules les spécialités autorisées sont proposées
                // (voir src/services/specialites.js)
                setSpecialites(filtrerSpecialites(liste));
            })
            .catch(() => setSpecialites([]));
    }, []);

    /* Photo affichée : photo enregistrée côté serveur, sinon initiales. */
    const photoAffichee = profil?.photo_url || urlPhoto(profil?.photo) || null;

    useEffect(() => {
        setPhotoCassee(false);
    }, [photoAffichee]);

    const formatDate = (dateString) => {
        if (!dateString) return "Non renseigné";
        const date = new Date(dateString);
        return date.toLocaleDateString("fr-FR");
    };

    const initiales = () => {
        const prenom = profil?.prenom || "";
        const nom = profil?.nom || "";
        return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() || "M";
    };

    /* Téléphone, adresse et spécialité sont modifiables dans la section
       « Informations de contact » : on détecte les changements pour activer
       le bouton d'enregistrement. */
    const champsModifies =
        (champs.telephone || "") !== (profil?.telephone || "") ||
        (champs.adresse || "") !== (profil?.adresse || "") ||
        (champs.specialite_id || "") !==
            (profil?.specialite_id ? String(profil.specialite_id) : "");

    /*
    |--------------------------------------------------------------------------
    | ENREGISTREMENT DES INFORMATIONS COMPLÉTÉES
    |--------------------------------------------------------------------------
    */

    const enregistrerChamps = async () => {
        const jeton = token();

        if (!jeton) {
            navigate("/login");
            return;
        }

        try {
            setEnregistrementChamps(true);
            setMessageChamps("");
            setErreurChamps("");

            const formData = new FormData();

            formData.append("telephone", champs.telephone.trim());
            formData.append("adresse", champs.adresse.trim());
            formData.append("specialite_id", champs.specialite_id);

            const response = await axios.post(
                `${API_URL}/medecin/profil`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${jeton}`,
                        Accept: "application/json",
                    },
                }
            );

            const fiche = response.data?.data || {};

            setProfil(fiche);
            setChamps({
                telephone: fiche?.telephone || "",
                adresse: fiche?.adresse || "",
                specialite_id: fiche?.specialite_id
                    ? String(fiche.specialite_id)
                    : "",
            });

            setMessageChamps(
                response.data?.message || "Profil mis à jour."
            );
        } catch (err) {
            setErreurChamps(
                err.response?.data?.message ||
                    "Impossible d'enregistrer les informations."
            );
        } finally {
            setEnregistrementChamps(false);
        }
    };

    return (
        <div className="bg-slate-50">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
                {/* En-tête */}
                <header className="rounded-2xl bg-gradient-to-r from-[#14532D] to-[#059669] shadow-sm px-5 py-4 flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Espace médecin</p>
                        <h1 className="text-xl font-bold text-white mt-1">Mon profil</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                       
                       
                    </div>
                </header>

                {loading && (
                    <div className="flex h-40 items-center justify-center">
                        <div className="text-center">
                            <div className="w-10 h-10 border-[3px] border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-sm text-slate-500">Chargement de votre profil...</p>
                        </div>
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
                        {error}
                    </div>
                )}

                {!loading && !error && profil && (
                    <div className="space-y-6">
                        {/* Carte identité + photo de profil */}
                        <section className="flex flex-col sm:flex-row sm:items-center gap-5 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-600 to-indigo-600 text-2xl font-bold text-white shadow-md">
                                {photoAffichee && !photoCassee ? (
                                    <img
                                        src={photoAffichee}
                                            alt="Profil"
                                        className="h-full w-full object-cover"
                                        onError={() => setPhotoCassee(true)}
                                    />
                                ) : (
                                    initiales()
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <h2 className="text-2xl font-bold text-slate-900">Dr. {profil.prenom} {profil.nom}</h2>
                                <p className="mt-1 text-sm text-slate-500 font-medium">{profil?.specialite?.nom || "Médecin"}</p>
                            </div>
                        </section>

                        {/* Informations de contact */}
                        <section className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <h2 className="text-lg font-bold text-slate-900">Informations de contact</h2>

                                <div className="flex flex-wrap items-center gap-3">
                                    {messageChamps && (
                                        <p className="text-xs font-medium text-emerald-600">{messageChamps}</p>
                                    )}

                                    {erreurChamps && (
                                        <p className="text-xs font-medium text-rose-600">{erreurChamps}</p>
                                    )}

                                    <button
                                        type="button"
                                        onClick={enregistrerChamps}
                                        disabled={enregistrementChamps || !champsModifies}
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#059669] hover:opacity-90 disabled:opacity-50 text-white px-4 py-2.5 text-xs font-semibold transition cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        {enregistrementChamps ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <CheckCircle2 size={16} />
                                        )}
                                        {enregistrementChamps ? "Enregistrement..." : "Enregistrer"}
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <CarteInfo icon={Mail} label="E-mail" value={profil?.email} />

                                {/* Téléphone : champ complétable directement */}
                                <label className="flex gap-4 rounded-xl bg-slate-50 p-5 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition duration-200">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm text-emerald-600">
                                        <Phone size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Téléphone</p>
                                        <input
                                            type="tel"
                                            value={champs.telephone}
                                            onChange={(e) => setChamps({ ...champs, telephone: e.target.value })}
                                            placeholder="Non renseigné"
                                            className="w-full bg-transparent font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                                        />
                                    </div>
                                </label>

                                {/* Adresse : champ complétable directement */}
                                <label className="flex gap-4 rounded-xl bg-slate-50 p-5 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition duration-200">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm text-emerald-600">
                                        <MapPin size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Adresse</p>
                                        <input
                                            type="text"
                                            value={champs.adresse}
                                            onChange={(e) => setChamps({ ...champs, adresse: e.target.value })}
                                            placeholder="Non renseigné"
                                            className="w-full bg-transparent font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                                        />
                                    </div>
                                </label>

                                {/* Spécialité : champ complétable directement */}
                                <label className="flex gap-4 rounded-xl bg-slate-50 p-5 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition duration-200">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm text-emerald-600">
                                        <Stethoscope size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Spécialité</p>
                                        <select
                                            value={champs.specialite_id}
                                            onChange={(e) => setChamps({ ...champs, specialite_id: e.target.value })}
                                            className="w-full bg-transparent font-semibold text-slate-800 focus:outline-none"
                                        >
                                            <option value="">Non renseigné</option>
                                            {specialites.map((s) => (
                                                <option key={s.id} value={s.id}>{s.nom}</option>
                                            ))}
                                        </select>
                                    </div>
                                </label>

                                <CarteInfo icon={Building2} label="Cabinet" value={profil?.cabinet?.nom} />
                            </div>
                        </section>

                        {/* Informations système */}
                       
                    </div>
                )}
            </div>
        </div>
    );
}
