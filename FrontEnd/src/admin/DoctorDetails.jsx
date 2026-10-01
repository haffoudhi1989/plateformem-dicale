import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Stethoscope,
    Phone,
    Mail,
    User,
} from "lucide-react";

function DoctorDetails() {
    const navigate = useNavigate();
    const { id } = useParams();

    // CRA : la variable est exposée via process.env.REACT_APP_*.
    const API_BASE =
        process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

    const API = `${API_BASE}/medecins`;

    // Racine du serveur : sert les fichiers /storage (photos)
    const API_ROOT = API.replace(/\/api\/.*$/, "");

    const [medecin, setMedecin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const getMedecin = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(`${API}/${id}`, {
                headers: {
                    Accept: "application/json",
                },
            });

            let data = response.data;

            if (data?.data) {
                data = data.data;
            }

            setMedecin(data);
        } catch (error) {
            console.error(
                "Erreur chargement médecin :",
                error.response?.data || error
            );

            setError(
                error.response?.data?.message ||
                    "Impossible de charger les informations du médecin."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getMedecin();
    }, [id]);

    if (loading) {
        return (
            <div className="
                min-h-[400px]
                flex
                items-center
                justify-center
            ">
                <div className="text-center">

                    <div className="
                        w-11
                        h-11
                        border-4
                        border-blue-100
                        border-t-blue-700
                        rounded-full
                        animate-spin
                        mx-auto
                    " />

                    <p className="
                        mt-4
                        text-sm
                        font-medium
                        text-blue-900
                    ">
                        Chargement du médecin...
                    </p>

                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full p-6">

                <button
                    type="button"
                    onClick={() => navigate("/admin/doctors")}
                    className="
                        inline-flex
                        items-center
                        gap-2
                        mb-6
                        text-blue-700
                        hover:text-blue-900
                        font-semibold
                    "
                >
                    <ArrowLeft size={18} />
                    Retour aux médecins
                </button>

                <div className="
                    rounded-2xl
                    border
                    border-red-200
                    bg-red-50
                    p-5
                    text-red-700
                ">
                    {error}
                </div>

            </div>
        );
    }

    if (!medecin) {
        return (
            <div className="w-full p-6">
                Aucun médecin trouvé.
            </div>
        );
    }

    const specialite =
        typeof medecin.specialite === "object"
            ? (
                medecin.specialite?.nom ||
                medecin.specialite?.name ||
                "Non définie"
            )
            : (
                medecin.specialite ||
                "Non définie"
            );

    return (
        <div className="w-full">

            {/* BANNIÈRE */}
            <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        {medecin.photo ? (
                            <img
                                src={`${API_ROOT}/storage/${medecin.photo}`}
                                alt={`${medecin.prenom || ""} ${medecin.nom || ""}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                }}
                            />
                        ) : (
                            <Stethoscope size={26} className="text-white" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                            Détails du médecin
                        </h1>
                        <p className="text-blue-100 text-sm mt-0.5">
                            Informations du médecin
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => navigate("/admin/doctors")}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition"
                    >
                        <ArrowLeft size={18} />
                        Retour aux médecins
                    </button>
                </div>
            </div>

            {/* CARTE INFORMATIONS */}

            <div className="
                bg-white
                border
                border-blue-100
                rounded-2xl
                shadow-sm
                overflow-hidden
            ">

                {/* INFORMATIONS */}

                <div className="
                    p-6
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    gap-5
                ">

                    <div className="
                        rounded-xl
                        bg-blue-50
                        p-4
                    ">
                        <p className="
                            text-xs
                            uppercase
                            font-semibold
                            text-blue-600
                        ">
                            Nom
                        </p>

                        <p className="
                            mt-1
                            text-lg
                            font-bold
                            text-blue-950
                        ">
                            {medecin.nom || "-"}
                        </p>
                    </div>

                    <div className="
                        rounded-xl
                        bg-blue-50
                        p-4
                    ">
                        <p className="
                            text-xs
                            uppercase
                            font-semibold
                            text-blue-600
                        ">
                            Prénom
                        </p>

                        <p className="
                            mt-1
                            text-lg
                            font-bold
                            text-blue-950
                        ">
                            {medecin.prenom || "-"}
                        </p>
                    </div>

                    <div className="
                        rounded-xl
                        bg-blue-50
                        p-4
                    ">
                        <p className="
                            text-xs
                            uppercase
                            font-semibold
                            text-blue-600
                        ">
                            Spécialité
                        </p>

                        <p className="
                            mt-1
                            text-lg
                            font-bold
                            text-blue-950
                        ">
                            {specialite}
                        </p>
                    </div>

                    <div className="
                        rounded-xl
                        bg-blue-50
                        p-4
                    ">
                        <div className="
                            flex
                            items-center
                            gap-2
                        ">
                            <Phone
                                size={17}
                                className="text-blue-600"
                            />

                            <p className="
                                text-xs
                                uppercase
                                font-semibold
                                text-blue-600
                            ">
                                Téléphone
                            </p>
                        </div>

                        <p className="
                            mt-1
                            text-lg
                            font-bold
                            text-blue-950
                        ">
                            {medecin.telephone || "-"}
                        </p>
                    </div>

                    <div className="
                        rounded-xl
                        bg-blue-50
                        p-4
                        md:col-span-2
                    ">
                        <div className="
                            flex
                            items-center
                            gap-2
                        ">
                            <Mail
                                size={17}
                                className="text-blue-600"
                            />

                            <p className="
                                text-xs
                                uppercase
                                font-semibold
                                text-blue-600
                            ">
                                Email
                            </p>
                        </div>

                        <p className="
                            mt-1
                            text-lg
                            font-bold
                            text-blue-950
                        ">
                            {medecin.email || "-"}
                        </p>
                    </div>

                </div>


            </div>

        </div>
    );
}

export default DoctorDetails;