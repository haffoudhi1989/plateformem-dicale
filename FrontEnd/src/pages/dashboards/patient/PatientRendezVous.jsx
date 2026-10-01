import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, CalendarPlus, MapPin, Video } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

export default function PatientRendezVous() {
    const navigate = useNavigate();

    const [patient, setPatient] = useState(null);
    const [rendezVous, setRendezVous] = useState([]);
    const [loading, setLoading] = useState(true);

    // Par défaut : uniquement les RDV du jour
    const auj = new Date();
    const aujourdhuiISO = `${auj.getFullYear()}-${String(auj.getMonth() + 1).padStart(2, "0")}-${String(auj.getDate()).padStart(2, "0")}`;
    const [dateFilter, setDateFilter] = useState(aujourdhuiISO);

    useEffect(() => {
        chargerRendezVous();
    }, []);

    const chargerRendezVous = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.get(
                `${API_URL}/patient/mes-rendez-vous`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            setPatient(response.data.patient);
            setRendezVous(response.data.data || []);

        } catch (error) {
            console.error(error);

            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
            }

        } finally {
            setLoading(false);
        }
    };

    const initiales = (medecin) =>
        `${medecin?.prenom?.charAt(0) || ""}${medecin?.nom?.charAt(0) || ""}`.toUpperCase() || "D";

    const getStatutStyle = (statut) => {
        const s = (statut || "").toLowerCase();
        if (s.includes("confirm") || s.includes("termin")) return "bg-emerald-50 text-emerald-700 border border-emerald-100";
        if (s.includes("annul")) return "bg-rose-50 text-rose-700 border border-rose-100";
        return "bg-amber-50 text-amber-700 border border-amber-100";
    };

    // ================================
    // TRI & GROUPEMENT PAR DATE
    // ================================

    const formaterDateLongue = (d) => {
        if (!d) return "";
        const dt = new Date(String(d).split("T")[0] + "T00:00:00");
        if (isNaN(dt.getTime())) return d;
        return dt.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const formaterDateCourte = (d) => {
        if (!d) return "";
        const p = String(d).split("-");
        return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
    };

    const rendezVousFiltres = rendezVous.filter((r) => {
        if (!dateFilter) return true;
        return String(r.date_rdv || "").split("T")[0] === dateFilter;
    });

    const rdvTries = [...rendezVousFiltres].sort((a, b) =>
        `${a.date_rdv} ${a.heure_rdv || ""}`.localeCompare(
            `${b.date_rdv} ${b.heure_rdv || ""}`
        )
    );

    const lignes = [];
    let dernierJour = "";
    rdvTries.forEach((rdv) => {
        const jour = String(rdv.date_rdv || "").split("T")[0];
        if (jour !== dernierJour) {
            lignes.push({ type: "sep", date: rdv.date_rdv });
            dernierJour = jour;
        }
        lignes.push({ type: "rdv", rdv });
    });

    // ================================
    // CHARGEMENT
    // ================================

    if (loading) {
        return (
            <div className="p-10 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-[3px] border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-slate-500">
                        Chargement des rendez-vous...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50">
            <div className="p-4 md:p-8 max-w-7xl mx-auto">

                {/* ================================
                    HEADER
                ================================= */}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[#1C1B19] tracking-tight">
                            Mes rendez-vous
                        </h1>
                        <p className="text-sm text-[#8C8577] mt-1">
                            {patient?.prenom
                                ? `Bonjour ${patient.prenom} ${patient.nom || ""}`
                                : "Vos consultations, triées par date"}
                            {rendezVous.length > 0 && (
                                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-2.5 py-0.5 text-[11px] font-bold">
                                    {rendezVous.length}
                                    {rendezVous.length > 1 ? " rendez-vous" : " rendez-vous"}
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
                    LISTE
                ================================= */}

                {/* ================================
                    FILTRE DATE (défaut : aujourd'hui)
                ================================= */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="text-sm font-semibold text-slate-600">
                        Afficher les RDV du :
                    </label>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    />
                    <button
                        type="button"
                        onClick={() =>
                            setDateFilter(dateFilter ? "" : aujourdhuiISO)
                        }
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                    >
                        {dateFilter ? "Toutes les dates" : "Revenir à aujourd'hui"}
                    </button>
                    {dateFilter && (
                        <span className="text-xs text-slate-400">
                            {rendezVousFiltres.length} rendez-vous ce jour
                        </span>
                    )}
                </div>

                {rendezVousFiltres.length === 0 ? (
                    <div className="bg-white rounded-2xl py-16 px-6 text-center border border-slate-200">
                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
                            <CalendarDays className="w-6 h-6 text-slate-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            {dateFilter
                                ? "Aucun rendez-vous à cette date"
                                : "Aucun rendez-vous"}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1.5">
                            {dateFilter && rendezVous.length > 0
                                ? "Choisissez une autre date ou affichez toutes vos dates."
                                : "Vous n'avez aucun rendez-vous pour le moment."}
                        </p>
                        <button
                            onClick={() => navigate("/patient/medecins")}
                            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition"
                        >
                            <CalendarPlus className="w-4 h-4" />
                            Prendre un rendez-vous
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Médecin
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Date
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Heure
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Type
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Motif
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Statut
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lignes.map((item, idx) => {
                                        if (item.type === "sep") {
                                            return (
                                                <tr key={`sep-${idx}`} className="bg-slate-50 border-t border-slate-100">
                                                    <td colSpan={6} className="px-6 py-2.5">
                                                        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-rose-600">
                                                            <CalendarDays size={13} />
                                                            {formaterDateLongue(item.date)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        const rdv = item.rdv;
                                        return (
                                            <tr
                                                key={rdv.id}
                                                className="border-t border-slate-100 hover:bg-slate-50/70 transition"
                                            >
                                                {/* MEDECIN */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-sm font-semibold text-rose-700">
                                                            {initiales(rdv.medecin)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-800">
                                                                Dr{" "}
                                                                {rdv.medecin?.prenom}{" "}
                                                                {rdv.medecin?.nom}
                                                            </p>
                                                            <p className="text-xs text-slate-400">
                                                                {rdv.medecin?.specialite?.nom || ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* DATE */}
                                                <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                                    {formaterDateCourte(rdv.date_rdv)}
                                                </td>

                                                {/* HEURE */}
                                                <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                                    {String(rdv.heure_rdv || "").slice(0, 5) || "-"}
                                                </td>

                                                {/* TYPE */}
                                                <td className="px-6 py-4">
                                                    {String(rdv.mode || "presentiel").toLowerCase() === "video" ? (
                                                        <div>
                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1 text-[11px] font-bold">
                                                                <Video size={12} /> Vidéo
                                                            </span>
                                                            <a
                                                                href="https://meet.google.com/"
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-sky-600 hover:text-sky-800"
                                                            >
                                                                <Video size={11} />
                                                                Rejoindre la visio
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-[11px] font-bold">
                                                            <MapPin size={12} /> Présentiel
                                                        </span>
                                                    )}
                                                </td>

                                                {/* MOTIF */}
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {rdv.motif || "-"}
                                                </td>

                                                {/* STATUT */}
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatutStyle(rdv.statut)}`}>
                                                        {rdv.statut || "En attente"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
