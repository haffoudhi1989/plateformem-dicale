import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Layers, Save, Loader2 } from "lucide-react";

const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

const authHeaders = () => ({
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
});

function AddSpecialite() {

    const navigate = useNavigate();

    const API = "http://localhost:8000/api/specialites";

    const [form, setForm] = useState({
        nom: "",
        description: ""
    });

    const [loading, setLoading] = useState(false);


    // =========================
    // Modifier le formulaire
    // =========================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setForm({
            ...form,
            [name]: value
        });

    };


    // =========================
    // Ajouter spécialité
    // =========================

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!form.nom) {

            alert(
                "Veuillez saisir le nom de la spécialité."
            );

            return;
        }

        try {

            setLoading(true);

            console.log(
                "Données envoyées :",
                form
            );

            await axios.post(
                API,
                form,
                { headers: authHeaders() }
            );

            alert(
                "Spécialité ajoutée avec succès."
            );

            navigate(
                "/admin/specialities"
            );

        } catch (error) {

            console.error(
                "Erreur ajout spécialité :",
                error.response?.data || error
            );

            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                navigate("/login");
                return;
            }

            if (
                error.response?.data?.errors
            ) {

                console.log(
                    "Erreurs validation Laravel :",
                    error.response.data.errors
                );

                alert(
                    Object.values(
                        error.response.data.errors
                    )
                        .flat()
                        .join("\n")
                );

            } else {

                alert(
                    error.response?.data?.message ||
                    "Erreur lors de l'ajout de la spécialité."
                );

            }

        } finally {

            setLoading(false);

        }

    };


    // =========================
    // Affichage
    // =========================

    return (

        <div className="overflow-x-clip">

            <div>

                {/* ========================= */}
                {/* EN-TÊTE */}
                {/* ========================= */}

                                <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                            <Layers size={26} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                                Ajouter une spécialité
                            </h1>
                            <p className="text-blue-100 text-sm mt-0.5">
                                Créer une nouvelle spécialité médicale
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >

                        {/* ========================= */}
                        {/* NOM */}
                        {/* ========================= */}

                        <div>

                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Nom de la spécialité
                            </label>

                            <input
                                type="text"
                                name="nom"
                                value={form.nom}
                                onChange={handleChange}
                                placeholder="Exemple : Cardiologie"
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                required
                            />

                        </div>


                        {/* ========================= */}
                        {/* DESCRIPTION */}
                        {/* ========================= */}

                        <div>

                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Description
                            </label>

                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Description de la spécialité..."
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition resize-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            />

                        </div>


                        {/* ========================= */}
                        {/* BOUTONS */}
                        {/* ========================= */}

                        <div className="border-t border-slate-200 pt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">

                            <button
                                type="button"
                                onClick={() => navigate("/admin/specialities")}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Annuler
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Ajouter la spécialité
                                    </>
                                )}
                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </div>
    );

}

export default AddSpecialite;