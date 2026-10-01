
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Layers } from "lucide-react";

const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

const authHeaders = () => ({
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
});

function EditSpecialite() {
    const { id } = useParams();
    const navigate = useNavigate();

    const API = "http://localhost:8000/api/specialites";

    const [nom, setNom] = useState("");
    const [description, setDescription] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // =========================
    // Charger la spécialité
    // =========================

    useEffect(() => {
        const loadSpecialite = async () => {
            try {
                const response = await axios.get(`${API}/${id}`, {
                    headers: authHeaders(),
                });

                console.log("Réponse API :", response.data);

                // Laravel peut retourner :
                // { data: {...} }
                // ou directement {...}
                const specialite =
                    response.data.data || response.data;

                setNom(specialite.nom || "");
                setDescription(specialite.description || "");

            } catch (error) {
                console.error(
                    "Erreur chargement spécialité :",
                    error.response?.data || error
                );

                if (error.response?.status === 401) {
                    localStorage.removeItem("token");
                    sessionStorage.removeItem("token");
                    navigate("/login");
                    return;
                }

                alert("Impossible de charger la spécialité.");

                navigate("/admin/specialities");

            } finally {
                setLoading(false);
            }
        };

        loadSpecialite();
    }, [id, navigate]);


    // =========================
    // Modifier la spécialité
    // =========================

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Vérification du nom
        if (!nom.trim()) {
            alert("Le nom de la spécialité est obligatoire.");
            return;
        }

        try {
            setSaving(true);

            const response = await axios.put(
                `${API}/${id}`,
                {
                    nom: nom.trim(),
                    description: description.trim()
                },
                {
                    headers: authHeaders()
                }
            );

            console.log(
                "Spécialité modifiée :",
                response.data
            );

            alert("Spécialité modifiée avec succès.");

            // Retour à la liste
            navigate("/admin/specialities");

        } catch (error) {
            console.error(
                "Erreur modification :",
                error.response?.data || error
            );

            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                navigate("/login");
                return;
            }

            // Afficher les erreurs Laravel
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;

                const messages = Object.values(errors)
                    .flat()
                    .join("\n");

                alert(messages);
            } else {
                alert(
                    error.response?.data?.message ||
                    "Erreur lors de la modification."
                );
            }

        } finally {
            setSaving(false);
        }
    };


    // =========================
    // Annuler
    // =========================

    const handleCancel = () => {
        navigate("/admin/specialities");
    };


    // =========================
    // Chargement
    // =========================

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100">

                <div className="w-full">

                    <div className="bg-white rounded-2xl shadow p-8 text-center">

                        <p className="text-gray-600">
                            Chargement de la spécialité...
                        </p>

                    </div>

                </div>

            </div>
        );
    }


    // =========================
    // Interface
    // =========================

    return (
        <div className="min-h-screen bg-gray-100 p-6">

            <div className="max-w-2xl mx-auto">

                {/* BANNIÈRE */}
                <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                            <Layers size={26} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                                Modifier la spécialité
                            </h1>
                            <p className="text-blue-100 text-sm mt-0.5">
                                Modifier les informations de la spécialité
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow p-6">


                    {/* Formulaire */}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        {/* Nom */}

                        <div>

                            <label
                                htmlFor="nom"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Nom de la spécialité
                            </label>

                            <input
                                id="nom"
                                type="text"
                                value={nom}
                                onChange={(e) =>
                                    setNom(e.target.value)
                                }
                                placeholder="Exemple : Cardiologie"
                                className="
                                    w-full
                                    border
                                    border-gray-300
                                    rounded-lg
                                    p-3
                                    outline-none
                                    focus:ring-2
                                    focus:ring-blue-500
                                    focus:border-blue-500
                                "
                                disabled={saving}
                            />

                        </div>


                        {/* Description */}

                        <div>

                            <label
                                htmlFor="description"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Description
                            </label>

                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) =>
                                    setDescription(e.target.value)
                                }
                                placeholder="Description de la spécialité"
                                rows={5}
                                className="
                                    w-full
                                    border
                                    border-gray-300
                                    rounded-lg
                                    p-3
                                    outline-none
                                    resize-none
                                    focus:ring-2
                                    focus:ring-blue-500
                                    focus:border-blue-500
                                "
                                disabled={saving}
                            />

                        </div>


                        {/* Boutons */}

                        <div className="flex gap-3 pt-2">

                            <button
                                type="submit"
                                disabled={saving}
                                className="
                                    flex-1
                                    bg-blue-600
                                    hover:bg-blue-700
                                    disabled:bg-blue-300
                                    text-white
                                    font-medium
                                    px-6
                                    py-3
                                    rounded-lg
                                    transition
                                "
                            >
                                {saving
                                    ? "Modification..."
                                    : "Enregistrer les modifications"
                                }
                            </button>


                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={saving}
                                className="
                                    bg-gray-500
                                    hover:bg-gray-600
                                    disabled:bg-gray-300
                                    text-white
                                    font-medium
                                    px-6
                                    py-3
                                    rounded-lg
                                    transition
                                "
                            >
                                Annuler
                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </div>
    );
}

export default EditSpecialite;

