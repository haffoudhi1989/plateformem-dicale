import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { FlaskConical, Loader2, Plus, X } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const fmtDate = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
};

export default function MedecinFicheAnalyse() {
    const [searchParams] = useSearchParams();
    const patientIdParam = searchParams.get("patientId") || "";

    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(Boolean(patientIdParam));
    const [saving, setSaving] = useState(false);
    const [msgForm, setMsgForm] = useState("");
    const [errForm, setErrForm] = useState("");
    const [medecinId, setMedecinId] = useState(null);
    const [patients, setPatients] = useState([]);
    const [form, setForm] = useState({
        patient_id: patientIdParam,
        type: "",
        nom: "",
        date_examen: new Date().toISOString().substring(0, 10),
        statut: "en_attente",
        resultat: "",
    });

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const config = {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    };

    useEffect(() => {
        Promise.all([
            axios.get(`${API_URL}/analyses`, config),
            axios.get(`${API_URL}/medecin/dashboard`, config),
        ])
            .then(([resAnalyses, resDash]) => {
                const data = Array.isArray(resAnalyses.data)
                    ? resAnalyses.data
                    : resAnalyses.data?.data ?? [];
                setAnalyses(data);

                setMedecinId(resDash.data?.medecin?.id ?? null);
                setPatients(resDash.data?.patients ?? []);
            })
            .catch((err) =>
                setError(err.response?.data?.message || "Impossible de charger les fiches.")
            )
            .finally(() => setLoading(false));
    }, []);

    const changer = (champ, valeur) =>
        setForm((prev) => ({ ...prev, [champ]: valeur }));

    const envoyerAnalyse = async (e) => {
        e.preventDefault();
        setErrForm("");
        setMsgForm("");

        if (!form.patient_id) {
            setErrForm("Selectionnez le patient.");
            return;
        }
        if (!form.type.trim()) {
            setErrForm("Indiquez le type d'analyse.");
            return;
        }

        setSaving(true);

        try {
            const res = await axios.post(
                `${API_URL}/analyses`,
                {
                    patient_id: Number(form.patient_id),
                    medecin_id: medecinId ? Number(medecinId) : null,
                    type: form.type.trim(),
                    nom: form.nom || null,
                    date_examen: form.date_examen,
                    statut: form.statut,
                    resultat: form.resultat || null,
                },
                config
            );

            const cree = res.data?.data ?? res.data;
            setAnalyses((prev) => [cree, ...prev]);
            setMsgForm(res.data?.message || "Fiche d'analyse creee avec succes.");
            setForm({
                patient_id: "",
                type: "",
                nom: "",
                date_examen: new Date().toISOString().substring(0, 10),
                statut: "en_attente",
                resultat: "",
            });
            setShowForm(false);
        } catch (err) {
            setErrForm(
                err.response?.data?.message ||
                    "Erreur lors de la creation de la fiche."
            );
        } finally {
            setSaving(false);
        }
    };

    const filtrees = analyses.filter((a) =>
        String(a.nom || a.type || a.patient_id || "")
            .toLowerCase()
            .includes(search.toLowerCase())
    );
    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-6">

                <div className="rounded-2xl bg-gradient-to-r from-[#14532D] to-[#059669] shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                            <FlaskConical size={26} className="text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                                Espace Medecin
                            </p>
                            <h1 className="text-xl font-bold text-white mt-1">
                                Fiches d'analyse
                            </h1>
                            <p className="text-sm text-emerald-50/90 mt-0.5">
                                Consultez les resultats d'analyses medicaux.
                            </p>
                        </div>
                    </div>
                </div>
                {error && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">
                                Resultats ({analyses.length})
                            </h2>
                            <p className="text-sm text-slate-500">
                                Toutes les fiches d'analyse disponibles.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher..."
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowForm((v) => !v)}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                    showForm
                                        ? "bg-slate-200 text-slate-700"
                                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                                }`}
                            >
                                {showForm ? (
                                    <>
                                        <X size={14} /> Fermer
                                    </>
                                ) : (
                                    <>
                                        <Plus size={15} /> Ajouter une analyse
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {showForm && (
                        <form
                            onSubmit={envoyerAnalyse}
                            className="border-b border-slate-100 bg-slate-50/60 p-5 space-y-4"
                        >
                            {errForm && (
                                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                    {errForm}
                                </div>
                            )}
                            {msgForm && (
                                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                                    {msgForm}
                                </div>
                            )}

                            {patientIdParam && (
                                <p className="text-xs font-semibold text-emerald-700">
                                    Patient pre-selectionne depuis la fiche patient.
                                </p>
                            )}

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Patient
                                    </label>
                                    <select
                                        value={form.patient_id}
                                        onChange={(e) =>
                                            changer("patient_id", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                                    >
                                        <option value="">Selectionner un patient</option>
                                        {patients.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.prenom} {p.nom}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Type d'analyse
                                    </label>
                                    <input
                                        value={form.type}
                                        onChange={(e) => changer("type", e.target.value)}
                                        placeholder="Ex : NFS, Glycemie, CRP..."
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Nom / laboratoire (optionnel)
                                    </label>
                                    <input
                                        value={form.nom}
                                        onChange={(e) => changer("nom", e.target.value)}
                                        placeholder="Ex : Laboratoire El Amal"
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Date de l'examen
                                    </label>
                                    <input
                                        type="date"
                                        value={form.date_examen}
                                        onChange={(e) =>
                                            changer("date_examen", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Statut
                                    </label>
                                    <select
                                        value={form.statut}
                                        onChange={(e) => changer("statut", e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                                    >
                                        <option value="en_attente">En attente</option>
                                        <option value="valide">Valide</option>
                                        <option value="annule">Annule</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Resultat / remarques
                                </label>
                                <textarea
                                    value={form.resultat}
                                    onChange={(e) => changer("resultat", e.target.value)}
                                    rows={3}
                                    placeholder="Resultats de l'analyse..."
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {saving ? "Enregistrement..." : "Enregistrer la fiche"}
                                </button>
                            </div>
                        </form>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 size={24} className="animate-spin text-emerald-600" />
                        </div>
                    ) : filtrees.length === 0 ? (
                        <p className="py-12 text-center text-sm text-slate-400">
                            Aucune fiche d'analyse trouvee.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-5 py-3">Patient</th>
                                        <th className="px-5 py-3">Type / Examen</th>
                                        <th className="px-5 py-3">Statut</th>
                                        <th className="px-5 py-3">Resultat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtrees.map((a) => (
                                        <tr key={a.id}>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                {fmtDate(a.date_examen)}
                                            </td>
                                            <td className="px-5 py-3">
                                                {a.patient ? `${a.patient.prenom ?? ""} ${a.patient.nom ?? ""}` : `Patient #${a.patient_id}`}
                                            </td>
                                            <td className="px-5 py-3 font-medium">
                                                {a.nom || a.type || "-"}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 text-xs font-semibold">
                                                    {a.statut || "En attente"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600">
                                                {a.resultat || "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
