import React, { useState } from "react";
import {
    UserPlus,
    User,
    Mail,
    Lock,
    ShieldCheck,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import api from "../../services/api";

const ROLES = [
    {
        value: "patient",
        label: "Patient",
        description: "Accès aux services patients",
    },
    {
        value: "medecin",
        label: "Médecin",
        description: "Gestion des consultations",
    },
    {
        value: "secretaire",
        label: "Secrétaire",
        description: "Gestion administrative",
    },
    {
        value: "admin",
        label: "Administrateur",
        description: "Accès complet à la plateforme",
    },
      {
        value: "cabinet",
        label: "Cabinet",
        description: "Gestion des médecins, rendez-vous et patients",
    },
];

function UserAdd() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "patient",
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");
        setLoading(true);

        try {
            const response = await api.post("/api/admin/users", form);

            console.log("Utilisateur créé :", response.data);

            setMessage("Utilisateur ajouté avec succès.");

            setForm({
                name: "",
                email: "",
                password: "",
                role: "patient",
            });
        } catch (err) {
            console.error(
                "Erreur création utilisateur :",
                err.response?.data || err
            );

            setError(
                err.response?.data?.message ||
                    "Impossible de créer l'utilisateur."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>

            {/* Header */}
            <div>

                                <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                            <UserPlus size={26} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                                Ajouter un utilisateur
                            </h1>
                            <p className="text-blue-100 text-sm mt-0.5">
                                Créez un nouveau compte et définissez son rôle.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Carte principale */}
            <div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                    {/* Header carte */}
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <ShieldCheck size={19} />
                            </div>

                            <div>
                                <h2 className="font-bold text-slate-800">
                                    Informations du compte
                                </h2>

                                <p className="text-xs text-slate-500 mt-0.5">
                                    Remplissez les informations du nouvel utilisateur.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="p-4 lg:p-5">

                            {/* Messages */}
                            {message && (
                                <div className="mb-4 flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                                    <CheckCircle2
                                        size={19}
                                        className="shrink-0 mt-0.5"
                                    />

                                    <div>
                                        <p className="font-semibold text-sm">
                                            Opération réussie
                                        </p>

                                        <p className="text-sm mt-0.5">
                                            {message}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="mb-4 flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                                    <AlertCircle
                                        size={19}
                                        className="shrink-0 mt-0.5"
                                    />

                                    <div>
                                        <p className="font-semibold text-sm">
                                            Erreur
                                        </p>

                                        <p className="text-sm mt-0.5">
                                            {error}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                                {/* Nom */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Nom complet
                                    </label>

                                    <div className="relative">
                                        <User
                                            size={18}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                        />

                                        <input
                                            type="text"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="Ex : Ahmed Ben Ali"
                                            required
                                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Adresse email
                                    </label>

                                    <div className="relative">
                                        <Mail
                                            size={18}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                        />

                                        <input
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="exemple@email.com"
                                            required
                                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Mot de passe
                                    </label>

                                    <div className="relative">
                                        <Lock
                                            size={18}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                        />

                                        <input
                                            type="password"
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            placeholder="Minimum 8 caractères"
                                            minLength={8}
                                            required
                                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>

                                    <p className="text-xs text-slate-400 mt-2">
                                        Le mot de passe doit contenir au moins 8 caractères.
                                    </p>
                                </div>

                            </div>

                            {/* Rôle */}
                            <div className="mt-4">
                                <div className="mb-2">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Rôle de l'utilisateur
                                    </label>

                                    <p className="text-xs text-slate-500 mt-1">
                                        Sélectionnez les permissions principales du compte.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">

                                    {ROLES.map((role) => {
                                        const selected =
                                            form.role === role.value;

                                        return (
                                            <label
                                                key={role.value}
                                                title={role.description}
                                                className={`cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all ${
                                                    selected
                                                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                                                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value={role.value}
                                                    checked={selected}
                                                    onChange={handleChange}
                                                    className="sr-only"
                                                />
                                                {role.label}
                                            </label>
                                        );
                                    })}

                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">

                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2
                                            size={18}
                                            className="animate-spin"
                                        />
                                        Création...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={18} />
                                        Ajouter l'utilisateur
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

export default UserAdd;