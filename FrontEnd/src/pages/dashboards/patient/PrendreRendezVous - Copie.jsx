import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";

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

    useEffect(() => {
        chargerMedecins();
    }, []);

    const chargerMedecins = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.get(
                `${API_URL}/patient/medecins-disponibles`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            setMedecins(response.data.data || []);
        } catch (err) {
            console.error(err);

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
                return;
            }

            setError("Impossible de récupérer les médecins.");
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

            console.log("RÉPONSE :", response.data);

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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">

            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">

                {/* HEADER */}

                <div className="text-center mb-8">

                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center text-3xl">
                        📅
                    </div>

                    <h2 className="text-3xl font-bold text-gray-800">
                        Prendre un rendez-vous
                    </h2>

                    <p className="text-sm text-gray-500 mt-2">
                        Veuillez remplir les informations ci-dessous
                    </p>

                </div>


                {/* MESSAGE SUCCÈS */}

                {message && (
                    <div
                        className="mb-6 p-4 text-sm text-rose-800 bg-rose-50 rounded-lg border border-rose-200"
                        role="alert"
                    >
                        {message}
                    </div>
                )}


                {/* MESSAGE ERREUR */}

                {error && (
                    <div
                        className="mb-6 p-4 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200"
                        role="alert"
                    >
                        {error}
                    </div>
                )}


                {/* CHARGEMENT */}

                {loading ? (

                    <div className="flex flex-col justify-center items-center py-12">

                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>

                        <span className="mt-4 text-gray-600 font-medium">
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

                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Médecin
                            </label>

                            <select
                                value={medecinId}
                                onChange={(e) =>
                                    setMedecinId(e.target.value)
                                }
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-blue-500 outline-none transition-all"
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

                        </div>


                        {/* DATE + HEURE */}

                        <div className="grid grid-cols-2 gap-4">

                            <div>

                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Date
                                </label>

                                <input
                                    type="date"
                                    value={dateRdv}
                                    onChange={(e) =>
                                        setDateRdv(e.target.value)
                                    }
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-blue-500 outline-none transition-all text-gray-700"
                                />

                            </div>


                            <div>

                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Heure
                                </label>

                                <input
                                    type="time"
                                    value={heureRdv}
                                    onChange={(e) =>
                                        setHeureRdv(e.target.value)
                                    }
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-blue-500 outline-none transition-all text-gray-700"
                                />

                            </div>

                        </div>


                        {/* MOTIF */}

                        <div>

                            <label className="block text-sm font-semibold text-gray-700 mb-2">

                                Motif de consultation{" "}

                                <span className="text-gray-400 font-normal">
                                    (Optionnel)
                                </span>

                            </label>

                            <textarea
                                value={motif}
                                onChange={(e) =>
                                    setMotif(e.target.value)
                                }
                                rows="3"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-blue-500 outline-none transition-all resize-none"
                                placeholder="Décrivez brièvement la raison..."
                            />

                        </div>


                        {/* BOUTON */}

                        <button
                            type="submit"
                            disabled={sending}
                            className={`
                                w-full
                                py-3.5
                                px-4
                                text-white
                                font-bold
                                rounded-xl
                                shadow-md
                                focus:outline-none
                                focus:ring-2
                                focus:ring-offset-2
                                focus:ring-rose-500
                                transition-all
                                transform
                                active:scale-[0.98]

                                ${
                                    sending
                                        ? "bg-blue-400 cursor-not-allowed"
                                        : "bg-rose-600 hover:bg-rose-700 hover:shadow-lg"
                                }
                            `}
                        >

                            {sending ? (

                                <div className="flex items-center justify-center">

                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>

                                    Confirmation en cours...

                                </div>

                            ) : (

                                "Confirmer le rendez-vous"

                            )}

                        </button>

                    </form>

                )}

            </div>

        </div>
    );
}