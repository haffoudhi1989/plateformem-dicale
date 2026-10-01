import React, { useState } from "react";
import axios from "axios";
import {
    Mail,
    Send,
    CheckCircle2,
    MessageCircle,
    AlertCircle,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

export default function CabinetContact() {
    const [form, setForm] = useState({
        nom: "",
        email: "",
        sujet: "",
        message: "",
    });

    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        axios
            .post(`${API_URL}/cabinet/contact`, form, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            })
            .then(() => {
                setSent(true);
            })
            .catch((err) => {
                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.href = "/login";
                } else {
                    setError(
                        err.response?.data?.message ||
                            "Erreur lors de l'envoi du message."
                    );
                }
            })
            .finally(() => setLoading(false));
    };

    const inputWrapClass =
        "flex items-center gap-2.5 w-full px-4 py-2.5 rounded-md bg-[#F6F3EE] border border-[#E7E1D5] focus-within:border-[#92400E] focus-within:bg-white transition";

    const inputBareClass =
        "w-full bg-transparent text-sm text-[#1C1B19] placeholder-[#A39A89] focus:outline-none";

    return (
        <div>
            {/* ===================== En-tête ===================== */}
            <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-700 shadow-lg p-3 md:p-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 shrink-0 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                            <MessageCircle size={24} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider">Espace Cabinet · Contact</p>
                            <h1 className="text-lg md:text-xl font-bold text-white mt-0.5 truncate">Nous contacter</h1>
                            <p className="text-orange-100/80 text-sm mt-0.5">Une question, un besoin d'assistance ? Écrivez-nous.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===================== Formulaire ===================== */}
            <div className="bg-white rounded-md border border-[#E7E1D5] p-6 shadow-[0_1px_3px_rgba(28,27,25,0.06)]">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 bg-[#EEF2F6] rounded-xl flex items-center justify-center">
                                <MessageCircle size={20} className="text-[#92400E]" />
                            </div>
                            <div>
                                <h2 className="font-bold text-[#1C1B19]">
                                    Envoyez-nous un message
                                </h2>
                                <p className="text-sm text-[#A39A89]">
                                    Nous vous répondrons dans les plus brefs délais.
                                </p>
                            </div>
                        </div>

                        {sent ? (
                            <div className="rounded-md border border-[#DCE8E4] bg-[#EEF4F1] p-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-[0_1px_3px_rgba(28,27,25,0.06)]">
                                    <CheckCircle2 size={32} className="text-[#2F5D50]" />
                                </div>

                                <p className="font-bold text-[#2F5D50] text-lg">
                                    Message envoyé avec succès !
                                </p>

                                <p className="mt-1.5 text-sm text-[#4A453D]">
                                    Merci {form.nom || "cher utilisateur"}, nous revenons
                                    vers vous rapidement.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSent(false);
                                        setForm({
                                            nom: "",
                                            email: "",
                                            sujet: "",
                                            message: "",
                                        });
                                    }}
                                    className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#92400E] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600 active:scale-95"
                                >
                                    Nouveau message
                                </button>
                            </div>
                        ) : (
                            <>
                            {error && (
                                <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 mb-4">
                                    <AlertCircle size={16} className="text-red-500 shrink-0" />
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#4A453D] mb-1.5">
                                            Nom complet
                                        </label>
                                        <div className={inputWrapClass}>
                                            <input
                                                type="text"
                                                name="nom"
                                                value={form.nom}
                                                onChange={handleChange}
                                                required
                                                placeholder="Votre nom"
                                                className={inputBareClass}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#4A453D] mb-1.5">
                                            Email
                                        </label>
                                        <div className={inputWrapClass}>
                                            <Mail size={16} className="shrink-0 text-[#A39A89]" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={form.email}
                                                onChange={handleChange}
                                                required
                                                placeholder="vous@exemple.com"
                                                className={inputBareClass}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#4A453D] mb-1.5">
                                        Sujet
                                    </label>
                                    <div className={inputWrapClass}>
                                        <input
                                            type="text"
                                            name="sujet"
                                            value={form.sujet}
                                            onChange={handleChange}
                                            required
                                            placeholder="Objet de votre message"
                                            className={inputBareClass}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#4A453D] mb-1.5">
                                        Message
                                    </label>
                                    <div className={`${inputWrapClass} items-start`}>
                                        <textarea
                                            name="message"
                                            value={form.message}
                                            onChange={handleChange}
                                            required
                                            rows="5"
                                            placeholder="Votre message..."
                                            className={`${inputBareClass} resize-none`}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex items-center gap-2 rounded-md bg-[#92400E] px-6 py-3 text-sm font-medium text-white transition hover:bg-amber-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <Send size={16} />
                                    {loading ? "Envoi en cours..." : "Envoyer le message"}
                                </button>
                            </form>
                            </>
                        )}
            </div>
        </div>
    );
}
