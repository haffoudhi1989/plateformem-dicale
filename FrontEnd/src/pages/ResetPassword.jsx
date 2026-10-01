import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, ArrowLeft, ShieldCheck, AlertCircle, CheckCircle2, Loader2, HeartPulse } from "lucide-react";
import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    "http://127.0.0.1:8000";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token") || "";
    const email = searchParams.get("email") || "";

    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!token || !email) { setError("Lien invalide ou incomplet."); return; }
        if (password.length < 8) { setError("Mot de passe trop court (min. 8 caractères)."); return; }
        if (password !== passwordConfirmation) { setError("Les mots de passe ne correspondent pas."); return; }

        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/reset-password`, {
                token, email, password, password_confirmation: passwordConfirmation,
            });
            setSuccess(response.data.message || "Mot de passe réinitialisé avec succès.");
            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            if (err.response) {
                if (err.response.status === 422) {
                    const errors = err.response.data.errors;
                    setError(errors ? Object.values(errors).flat().join(" ") : err.response.data.message || "Erreur de validation.");
                } else {
                    setError(err.response.data.message || "Une erreur est survenue.");
                }
            } else {
                setError("Connexion impossible au serveur.");
            }
        } finally {
            setLoading(false);
        }
    };

    const sharedBg = "min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden";

    if (!token || !email) {
        return (
            <div className={sharedBg}>
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl shadow-2xl shadow-blue-900/10 p-8 text-center relative z-10">
                    <div className="w-12 h-12 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-3">
                        <AlertCircle size={24} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 mb-1">Lien invalide</h1>
                    <p className="text-xs text-slate-400 mb-5 font-medium">Ce lien de réinitialisation a expiré.</p>
                    <button
                        onClick={() => navigate("/forgot-password")}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                    >
                        Demander un nouveau lien
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={sharedBg}>
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl shadow-2xl shadow-blue-900/10 p-8 sm:p-10 relative z-10">

                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-600/30">
                        <HeartPulse size={28} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Nouveau mot de passe</h1>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                        Pour <span className="text-blue-600 font-semibold">{email}</span>
                    </p>
                </div>

                {error && (
                    <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
                        <AlertCircle size={16} className="shrink-0 text-red-600" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Nouveau mot de passe
                        </label>
                        <div className="relative group">
                            <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                minLength={8}
                                required
                                disabled={loading}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15 transition-all disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Confirmer
                        </label>
                        <div className="relative group">
                            <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="password"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                placeholder="••••••••"
                                minLength={8}
                                required
                                disabled={loading}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15 transition-all disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {loading ? (
                            <><Loader2 size={18} className="animate-spin" /><span>Validation...</span></>
                        ) : (
                            <span>Valider le mot de passe</span>
                        )}
                    </button>
                </form>

                <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="mt-5 w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors py-1.5"
                >
                    <ArrowLeft size={15} />
                    Retour à la connexion
                </button>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
                    <ShieldCheck size={14} className="text-blue-600" />
                    <span>Mise à Jour Sécurisée</span>
                </div>

            </div>
        </div>
    );
}