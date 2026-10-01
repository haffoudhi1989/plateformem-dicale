import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarDays, CalendarPlus } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

export default function PrendreRendezVous() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const medecinIdInitial = searchParams.get("medecin") || "";

    const [medecins, setMedecins] = useState([]);
    const [medecinId, setMedecinId] = useState(medecinIdInitial);
    const [dateRdv, setDateRdv] = useState("");
    const [heureRdv, setHeureRdv] = useState("");
    const [motif, setMotif] = useState("");

    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [fermetures, setFermetures] = useState([]);

    // Charge les fermetures (jours fériés / absences) du cabinet du médecin choisi
    useEffect(() => {
        const medecinChoisi = medecins.find(
            (x) => String(x.id) === String(medecinId)
        );
        const cabinetId =
            medecinChoisi?.cabinet_id || medecinChoisi?.cabinet?.id;

        if (!medecinChoisi || !cabinetId) {
            setFermetures([]);
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) return;

        axios
            .get(`${API_URL}/fermetures?cabinet_id=${cabinetId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            })
            .then((res) => {
                const items = res.data?.data ?? [];
                const aujourdHui = new Date().toISOString().slice(0, 10);

                const utiles = items.filter(
                    (f) =>
                        ["jour_ferie", "absence_medecin"].includes(f.type) &&
                        (f.date_fin || f.date_debut) >= aujourdHui &&
                        (f.type === "jour_ferie" ||
                            Number(f.medecin_id) === Number(medecinId))
                );

                setFermetures(utiles);
            })
            .catch(() => setFermetures([]));
    }, [medecinId, medecins]);

    const formaterFermeture = (f) => {
        const d = (s) =>
            s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : "";
        const debut = d(f.date_debut);
        const fin = d(f.date_fin);
        const motif =
            f.motif || (f.type === "jour_ferie" ? "Jour férié" : "Absence du médecin");
        return fin && fin !== debut
            ? `du ${debut} au ${fin} (${motif})`
            : `le ${debut} (${motif})`;
    };

    const fermetureSurDate = (dateISO) =>
        dateISO
            ? fermetures.find(
                  (f) =>
                      dateISO >= f.date_debut &&
                      dateISO <= (f.date_fin || f.date_debut)
              )
            : null;

    useEffect(() => {
        chargerMedecins();
    }, []);

    const chargerMedecins = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        const entetes = {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        };

        // Repli : liste complète des médecins (route générique authentifiée)
        const chargerTousLesMedecins = async () => {
            try {
                const response = await axios.get(
                    `${API_URL}/medecins`,
                    { headers: entetes }
                );
                const data = response.data?.data ?? response.data ?? [];

                if (Array.isArray(data) && data.length > 0) {
                    setMedecins(data);
                    return true;
                }
            } catch (err) {
                console.error(err);
            }
            return false;
        };

        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/patient/medecins-disponibles`,
                { headers: entetes }
            );

            const data = response.data?.data ?? [];

            if (Array.isArray(data) && data.length > 0) {
                setMedecins(data);
            } else if (!(await chargerTousLesMedecins())) {
                setError(
                    "Aucun médecin disponible pour le moment. Si le problème persiste, contactez votre cabinet."
                );
            }
        } catch (err) {
            console.error(err);

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
                return;
            }

            // Le patient n'a pas encore de fiche liée : on utilise la liste générale
            if (!(await chargerTousLesMedecins())) {
                setError(
                    "Aucun médecin disponible pour le moment. Si le problème persiste, contactez votre cabinet."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const envoyerRendezVous = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (!medecinId || !dateRdv || !heureRdv) {
            setError(
                "Veuillez remplir le médecin, la date et l'heure."
            );
            return;
        }

        const fermee = fermetureSurDate(dateRdv);

        if (fermee) {
            setError(
                `Le cabinet est fermé ${formaterFermeture(fermee)}. Veuillez choisir une autre date.`
            );
            return;
        }

        try {
            setSending(true);

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.post(
                `${API_URL}/patient/prendre-rendez-vous`,
                {
                    medecin_id: medecinId,
                    date_rdv: dateRdv,
                    heure_rdv: heureRdv,
                    motif: motif || null,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                }
            );

            setMessage(
                response.data.message ||
                "Rendez-vous créé avec succès."
            );

            setDateRdv("");
            setHeureRdv("");
            setMotif("");

        } catch (err) {
            console.error("ERREUR COMPLETE :", err);

            if (err.response?.status === 422) {
                const errors = err.response.data.errors;

                if (errors) {
                    const messages = Object.values(errors)
                        .flat()
                        .join(" ");

                    setError(messages);
                } else {
                    setError(
                        err.response.data.message ||
                        "Données invalides."
                    );
                }

            } else if (err.response?.status === 401) {

                localStorage.removeItem("token");
                localStorage.removeItem("user");

                navigate("/login");

            } else {

                setError(
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    "Erreur lors de la création du rendez-vous."
                );
            }

        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-slate-50 flex items-center justify-center p-4 min-h-[60vh]">

            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

                {/* HEADER */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center">
                        <CalendarDays className="w-6 h-6 text-rose-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Prendre un rendez-vous
                    </h2>
                    <p className="text-sm text-slate-500 mt-1.5">
                        Veuillez remplir les informations ci-dessous
                    </p>
                </div>

                {/* MESSAGE SUCCÈS */}
                {message && (
                    <div
                        className="mb-6 p-4 text-sm text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200"
                        role="alert"
                    >
                        {message}
                    </div>
                )}

                {/* MESSAGE ERREUR */}
                {error && (
                    <div
                        className="mb-6 p-4 text-sm text-red-800 bg-red-50 rounded-xl border border-red-200"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {/* CHARGEMENT */}
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-12">
                        <div className="w-10 h-10 border-[3px] border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="mt-4 text-sm text-slate-600 font-medium">
                            Chargement des médecins...
                        </span>
                    </div>
                ) : (
                    <form
                        onSubmit={envoyerRendezVous}
                        className="space-y-5"
                    >
                        {/* MEDECIN */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Médecin
                            </label>
                            <select
                                value={medecinId}
                                onChange={(e) =>
                                    setMedecinId(e.target.value)
                                }
                                required
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-blue-500 outline-none transition-all"
                            >
                                <option value="">
                                    -- Sélectionnez un médecin --
                                </option>
                                {medecins.map((medecin) => (
                                    <option
                                        key={medecin.id}
                                        value={medecin.id}
                                    >
                                        Dr. {medecin.nom} {medecin.prenom}
                                        {medecin.specialite
                                            ? ` - ${medecin.specialite}`
                                            : ""}
                                    </option>
                                ))}
                            </select>

                            {fermetures.length > 0 && (
                                <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-relaxed">
                                    <span className="font-bold">
                                        Fermeture du cabinet du médecin sélectionné :{" "}
                                    </span>
                                    {fermetures.map((f) =>
                                        formaterFermeture(f)
                                    ).join(" — ")}
                                    . Aucun rendez-vous ne peut être pris ces jours-là.
                                </div>
                            )}
                        </div>

                        {/* DATE + HEURE */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={dateRdv}
                                    onChange={(e) =>
                                        setDateRdv(e.target.value)
                                    }
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-blue-500 outline-none transition-all text-slate-700"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Heure
                                </label>
                                <input
                                    type="time"
                                    value={heureRdv}
                                    onChange={(e) =>
                                        setHeureRdv(e.target.value)
                                    }
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-blue-500 outline-none transition-all text-slate-700"
                                />
                            </div>
                        </div>

                        {/* ALERTE SI DATE FERMÉE */}
                        {(() => {
                            const fermee = fermetureSurDate(dateRdv);
                            return fermee ? (
                                <div
                                    className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 leading-relaxed"
                                    role="alert"
                                >
                                    Cette date est une fermeture du cabinet (
                                    {formaterFermeture(fermee)}). Choisissez une
                                    autre date pour confirmer le rendez-vous.
                                </div>
                            ) : null;
                        })()}

                        {/* MOTIF */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Motif de consultation{" "}
                                <span className="text-slate-400 font-normal">
                                    (Optionnel)
                                </span>
                            </label>
                            <textarea
                                value={motif}
                                onChange={(e) =>
                                    setMotif(e.target.value)
                                }
                                rows="3"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-blue-500 outline-none transition-all resize-none"
                                placeholder="Décrivez brièvement la raison..."
                            />
                        </div>

                        {/* BOUTON */}
                        <button
                            type="submit"
                            disabled={sending}
                            className={`
                                w-full
                                py-3
                                px-4
                                text-white
                                font-semibold
                                rounded-xl
                                shadow-sm
                                focus:outline-none
                                focus:ring-2
                                focus:ring-offset-2
                                focus:ring-rose-500
                                transition-all
                                active:scale-[0.98]

                                ${
                                    sending
                                        ? "bg-blue-400 cursor-not-allowed"
                                        : "bg-rose-600 hover:bg-rose-700 hover:shadow-md"
                                }
                            `}
                        >
                            {sending ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                    Confirmation en cours...
                                </div>
                            ) : (
                                <span className="inline-flex items-center gap-2">
                                    <CalendarPlus className="w-4 h-4" />
                                    Confirmer le rendez-vous
                                </span>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
