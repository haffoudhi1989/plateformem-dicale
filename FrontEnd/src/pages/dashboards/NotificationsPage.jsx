import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bell, CheckCheck, Check, Loader2, Inbox } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

/**
 * Notifications in-app (patient / médecin).
 * Props : role ("patient" | "medecin") — utilisé pour l'en-tête uniquement.
 */
export default function NotificationsPage({ role = "patient" }) {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const headers = useCallback(
        () => ({
            Authorization: `Bearer ${getToken()}`,
            Accept: "application/json",
        }),
        []
    );

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            if (!getToken()) {
                navigate("/login");
                return;
            }
            const res = await axios.get(`${API_URL}/notifications`, {
                headers: headers(),
            });
            setNotifications(res.data?.data || []);
        } catch (err) {
            console.error("Erreur notifications :", err);
            if (err.response?.status === 401) {
                navigate("/login");
            } else {
                setError("Impossible de charger les notifications.");
            }
        } finally {
            setLoading(false);
        }
    }, [headers, navigate]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            await axios.put(`${API_URL}/notifications/${id}/read`, {}, { headers: headers() });
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
            );
        } catch (err) {
            console.error("Erreur marquage lu :", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put(`${API_URL}/notifications/read-all`, {}, { headers: headers() });
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
            );
        } catch (err) {
            console.error("Erreur tout marquer lu :", err);
        }
    };

    const unreadCount = notifications.filter((n) => !n.read_at).length;

    // Accent selon l'espace : rose (#881337) pour le patient, vert (emerald) pour le médecin
    const accent =
        role === "medecin"
            ? {
                  text: "text-emerald-700",
                  softBg: "bg-emerald-50",
                  softText: "text-emerald-700",
                  row: "bg-emerald-50/50",
                  dot: "bg-emerald-700",
                  btnBorder: "border-emerald-200 text-emerald-700 hover:bg-emerald-700 hover:text-white",
              }
            : {
                  text: "text-[#881337]",
                  softBg: "bg-rose-50",
                  softText: "text-[#881337]",
                  row: "bg-rose-50/50",
                  dot: "bg-[#881337]",
                  btnBorder: "border-rose-200 text-[#881337] hover:bg-[#881337] hover:text-white",
              };

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            {/* EN-TÊTE — bannière « verre » pour l'espace médecin (modèle « Mes patients ») */}
            {role === "medecin" ? (
                <div className="rounded-2xl bg-gradient-to-r from-[#14532D] to-[#059669] shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                       
                        <h1 className="text-xl font-bold text-white">Mes notifications</h1>
                        <p className="text-sm text-emerald-50/90 mt-0.5">
                            Absences, annulations et informations importantes.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0 || loading}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer"
                        >
                            <CheckCheck size={15} />
                            Tout marquer comme lu
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className={`flex items-center gap-2 mb-1 font-bold uppercase tracking-[0.2em] text-xs ${accent.text}`}>
                            <Bell size={16} /> Notifications
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-[#1C1B19] tracking-tight">
                            Mes notifications
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Absences, annulations et informations importantes.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0 || loading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 text-xs font-bold transition cursor-pointer"
                    >
                        <CheckCheck size={15} />
                        Tout marquer comme lu
                    </button>
                </div>
            )}

            {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                    {error}
                </div>
            )}

            {/* LISTE */}
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <Loader2 size={28} className="animate-spin text-slate-300 mb-3" />
                        <p className="text-xs font-bold text-slate-400">Chargement des notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className={`w-16 h-16 rounded-3xl ${accent.softBg} ${accent.softText} flex items-center justify-center mx-auto mb-3`}>
                            <Inbox size={28} />
                        </div>
                        <h3 className="text-base font-black text-slate-800">Aucune notification</h3>
                        <p className="text-xs text-slate-400 mt-1">
                            Vous serez prévenu(e) en cas d'annulation de rendez-vous ou d'absence.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`flex items-start justify-between gap-4 px-5 py-4 ${
                                    n.read_at ? "bg-white" : accent.row
                                }`}
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`w-2 h-2 rounded-full shrink-0 ${n.read_at ? "bg-transparent" : accent.dot}`}
                                        />
                                        <p className="text-sm font-bold text-slate-800 truncate">
                                            {n.title}
                                        </p>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 leading-5">
                                        {n.message}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                                        {formatDate(n.created_at)}
                                    </p>
                                </div>

                                {!n.read_at && (
                                    <button
                                        type="button"
                                        onClick={() => markAsRead(n.id)}
                                        title="Marquer comme lue"
                                        className={`shrink-0 w-9 h-9 rounded-xl bg-white border ${accent.btnBorder} transition flex items-center justify-center cursor-pointer`}
                                    >
                                        <Check size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
