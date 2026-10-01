import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Stethoscope } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

export default function PatientMedecins() {
    const navigate = useNavigate();

    const [medecins, setMedecins] = useState([]);
    const [loading, setLoading] = useState(true);
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

            const headers = {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            };

            /*
             * L'API /patient/mes-medecins ne renvoie que les praticiens liés
             * au dossier du patient connecté (rendez-vous, ordonnances ou
             * cabinet) : aucun filtrage côté navigateur n'est nécessaire.
             */
            const reponse = await axios.get(
                `${API_URL}/patient/mes-medecins`,
                { headers }
            );

            setMedecins(reponse.data.data || []);
        } catch (err) {
            console.error(err);

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
                return;
            }

            setError(
                err.response?.data?.message ||
                    "Impossible de récupérer vos médecins."
            );
        } finally {
            setLoading(false);
        }
    };

    const initiales = (medecin) =>
        `${medecin.prenom?.charAt(0) || ""}${medecin.nom?.charAt(0) || ""}`.toUpperCase() ||
        "M";

    const specialiteNom = (medecin) =>
        medecin.specialite?.nom || medecin.specialite || "Médecin";

    // ================================
    // CHARGEMENT
    // ================================

    if (loading) {
        return (
            <div className="p-10 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-11 h-11 border-[3px] border-[#881337] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-[#8C8577] font-medium">
                        Chargement de vos médecins...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* ================================
                EN-TÊTE
            ================================= */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#1C1B19] tracking-tight">
                        Mes médecins
                    </h1>
                    <p className="text-sm text-[#8C8577] mt-1">
                        Les praticiens liés à votre dossier — choisissez-en un
                        pour prendre rendez-vous
                        {medecins.length > 0 && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-2.5 py-0.5 text-[11px] font-bold">
                                {medecins.length}
                                {medecins.length > 1
                                    ? " praticiens"
                                    : " praticien"}
                            </span>
                        )}
                    </p>
                </div>
                <button
                    onClick={() => navigate("/patient/dashboard")}
                    className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E7E1D5] rounded-xl text-sm font-semibold text-[#4A453D] hover:bg-[#EDE8DD] transition"
                >
                    <ArrowLeft size={16} />
                    Retour à l'accueil
                </button>
            </div>

            {/* ================================
                ERREUR
            ================================= */}
            {error && (
                <div className="mb-6 p-4 bg-[#F8EFEF] border border-[#E4CBCC] text-[#7A2E33] rounded-2xl text-sm font-medium">
                    {error}
                </div>
            )}

            {/* ================================
                AUCUN MEDECIN LIÉ
            ================================= */}
            {medecins.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#E7E1D5] py-20 px-6 text-center shadow-[0_1px_3px_rgba(28,27,25,0.06)]">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#881337] to-rose-600 text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-200">
                        <Stethoscope size={26} />
                    </div>
                    <h2 className="text-xl font-bold text-[#1C1B19]">
                        Aucun praticien lié à votre dossier
                    </h2>
                    <p className="text-sm text-[#8C8577] mt-2 max-w-sm mx-auto leading-6">
                        Un praticien apparaît ici dès qu'un rendez-vous ou une
                        ordonnance vous lie à lui.
                    </p>
                </div>
            ) : (
                /* ================================
                   LISTE DES MEDECINS
                ================================= */
                <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(290px,1fr))]">
                    {medecins.map((medecin) => (
                        <div
                            key={medecin.id}
                            className="group bg-white rounded-3xl border border-[#E7E1D5] p-6 shadow-[0_1px_3px_rgba(28,27,25,0.06)] hover:shadow-lg hover:border-rose-200 hover:-translate-y-1 transition-all duration-300"
                        >
                            {/* PHOTO / IDENTITÉ */}
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#881337] to-rose-700 text-white flex items-center justify-center text-xl font-black shadow-md shadow-rose-100 shrink-0">
                                    {initiales(medecin)}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold text-[#1C1B19] truncate">
                                        Dr {medecin.prenom} {medecin.nom}
                                    </h2>
                                    <span className="inline-flex items-center gap-1.5 mt-1 rounded-full bg-rose-50 text-[#881337] border border-rose-100 px-3 py-1 text-[11px] font-bold">
                                        <Stethoscope size={12} />
                                        {specialiteNom(medecin)}
                                    </span>
                                </div>
                            </div>

                            {/* INFORMATIONS */}
                            <div className="space-y-3 text-sm border-t border-[#F0ECE4] pt-4">
                                {medecin.email && (
                                    <div className="flex items-center gap-3 text-[#4A453D]">
                                        <span className="w-8 h-8 rounded-lg bg-[#F6F3EE] text-[#881337] flex items-center justify-center shrink-0">
                                            <Mail size={14} />
                                        </span>
                                        <span className="truncate text-[13px]">
                                            {medecin.email}
                                        </span>
                                    </div>
                                )}
                                {!medecin.email && (
                                    <p className="text-xs text-[#A39A89] italic">
                                        Aucune coordonnée enregistrée.
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
