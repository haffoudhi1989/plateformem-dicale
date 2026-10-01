import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, CreditCard, ReceiptText } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

export default function PatientPaiements() {
    const navigate = useNavigate();

    const [patient, setPatient] = useState(null);
    const [paiements, setPaiements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        chargerPaiements();
    }, []);

    const chargerPaiements = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.get(
                `${API_URL}/patient/mes-paiements`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            setPatient(response.data.patient);
            setPaiements(response.data.data || []);

        } catch (err) {
            console.error("Erreur paiements :", err);

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
                return;
            }

            setError(
                err.response?.data?.message ||
                "Impossible de récupérer vos paiements."
            );

        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // STATUT
    // ==========================================

    const getStatutStyle = (statut) => {
        const value = statut?.toLowerCase();

        if (
            value === "payé" ||
            value === "paye" ||
            value === "paid"
        ) {
            return "bg-emerald-50 text-emerald-700 border border-emerald-100";
        }

        if (
            value === "annulé" ||
            value === "annule" ||
            value === "cancelled"
        ) {
            return "bg-rose-50 text-rose-700 border border-rose-100";
        }

        return "bg-amber-50 text-amber-700 border border-amber-100";
    };

    // ==========================================
    // FORMAT MONTANT
    // ==========================================

    const formatMontant = (montant) => {
        if (montant === null || montant === undefined) {
            return "-";
        }

        return `${Number(montant).toFixed(2)} DT`;
    };

    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const dateObj = new Date(date);

        if (Number.isNaN(dateObj.getTime())) {
            return date;
        }

        return dateObj.toLocaleDateString("fr-FR");
    };

    // ==========================================
    // CHARGEMENT
    // ==========================================

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-[3px] border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-slate-500">
                        Chargement de vos paiements...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50">
            <div className="max-w-6xl mx-auto px-6 py-10">

                {/* =================================
                    HEADER
                ================================= */}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Mes paiements
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Bonjour {patient?.prenom} {patient?.nom}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/patient/dashboard")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition self-start md:self-auto"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Dashboard
                    </button>
                </div>

                {/* =================================
                    ERREUR
                ================================= */}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-sm">
                        {error}
                    </div>
                )}

                {/* =================================
                    AUCUN PAIEMENT
                ================================= */}

                {paiements.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 py-16 px-6 text-center">
                        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-slate-100 flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-slate-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Aucun paiement
                        </h2>
                        <p className="text-sm text-slate-500 mt-1.5">
                            Vous n'avez aucun paiement enregistré pour le moment.
                        </p>
                        <button
                            onClick={() => navigate("/patient/rendez-vous")}
                            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition"
                        >
                            Voir mes rendez-vous
                        </button>
                    </div>
                ) : (
                    /* =================================
                       LISTE DES PAIEMENTS
                    ================================= */

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
                                    <ReceiptText className="w-6 h-6 text-rose-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Historique des paiements
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-0.5">
                                        {paiements.length} paiement
                                        {paiements.length > 1 ? "s" : ""} enregistré
                                        {paiements.length > 1 ? "s" : ""}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* TABLE */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Date
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Montant
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Mode de paiement
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Description
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Statut
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paiements.map((paiement) => (
                                        <tr
                                            key={paiement.id}
                                            className="border-t border-slate-100 hover:bg-slate-50/70 transition"
                                        >
                                            {/* DATE */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <CalendarDays className="w-4 h-4 text-slate-400" />
                                                    {formatDate(paiement.date_paiement)}
                                                </div>
                                            </td>

                                            {/* MONTANT */}
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-rose-600">
                                                    {formatMontant(paiement.montant)}
                                                </span>
                                            </td>

                                            {/* MODE */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <CreditCard className="w-4 h-4 text-slate-400" />
                                                    {paiement.mode_paiement || "-"}
                                                </div>
                                            </td>

                                            {/* DESCRIPTION */}
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {paiement.description || "-"}
                                            </td>

                                            {/* STATUT */}
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatutStyle(paiement.statut)}`}
                                                >
                                                    {paiement.statut || "En attente"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
