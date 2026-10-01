import React, { useEffect, useState } from "react";
import axios from "axios";
import { CalendarDays } from "lucide-react";
import { joursFeriesTunisie } from "../../utils/joursFeriesTunisie";

const API = "http://127.0.0.1:8000/api";

const jours = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
];

// Jours de semaine indexés par getDay() (0 = Dimanche)
const joursSemaineFR = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
];

const TYPE_FERMETURES = {
    jour_ferie: "Jour férié",
    absence_medecin: "Absence médecin",
    absence_patient: "Absence patient",
};

// =====================================================
// PETITS OUTILS DATES
// =====================================================

const pad2 = (n) => String(n).padStart(2, "0");

const toISO = (d) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const jourDeLaSemaine = (dateISO) => {
    const d = new Date(`${dateISO}T00:00:00`);
    return joursSemaineFR[d.getDay()];
};

const formatDateCourt = (dateISO) =>
    new Date(`${dateISO}T00:00:00`).toLocaleDateString("fr-FR");

const nomComplet = (item) =>
    item ? [item.prenom, item.nom].filter(Boolean).join(" ") : "";

export default function Horaire() {
    const [cabinets, setCabinets] = useState([]);
    const [cabinetId, setCabinetId] = useState("");

    const [horaires, setHoraires] = useState(
        jours.map((jour) => ({
            id: null,
            jour,
            heure_ouverture: "08:00",
            heure_fermeture: "17:00",
            actif: true,
        }))
    );

    // Fermetures / absences (jours fériés, médecins, patients)
    const [medecinsCabinet, setMedecinsCabinet] = useState([]);
    const [patientsCabinet, setPatientsCabinet] = useState([]);
    const [fermetures, setFermetures] = useState([]);
    const [formFermeture, setFormFermeture] = useState({
        type: "jour_ferie",
        date_debut: "",
        date_fin: "",
        medecin_id: "",
        patient_id: "",
        motif: "",
    });
    const [loadingFermetures, setLoadingFermetures] = useState(false);
    const [savingFermeture, setSavingFermeture] = useState(false);
    const [errFermeture, setErrFermeture] = useState("");
    const [msgFermeture, setMsgFermeture] = useState("");

    // Jour férié personnalisé
    const [feriePersoDate, setFeriePersoDate] = useState("");
    const [feriePersoMotif, setFeriePersoMotif] = useState("");
    const [msgFeriePerso, setMsgFeriePerso] = useState("");
    const [errFeriePerso, setErrFeriePerso] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const token = localStorage.getItem("token");

    const config = {
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        },
    };

    // =====================================================
    // CHARGER LES CABINETS
    // =====================================================

    useEffect(() => {
        chargerCabinets();
    }, []);

    const chargerCabinets = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API}/cabinets`,
                config
            );

            console.log("CABINETS :", response.data);

            const liste =
                response.data.data ?? response.data;

            if (!Array.isArray(liste)) {
                setError("Format des cabinets incorrect.");
                return;
            }

            setCabinets(liste);

            // Un seul cabinet : sélection automatique, aucune liste à afficher
            if (liste.length === 1) {
                const id = String(liste[0].id);
                setCabinetId(id);
                chargerHoraires(id);
                chargerDonneesFermetures(id);
            }

        } catch (err) {
            console.error(
                "Erreur cabinets :",
                err.response?.data || err
            );

            setError(
                err.response?.data?.message ||
                "Erreur lors du chargement des cabinets."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // CHANGER DE CABINET
    // =====================================================

    const changerCabinet = (e) => {
        const id = e.target.value;

        setCabinetId(id);
        setError("");
        setSuccess("");
        setFermetures([]);
        setErrFermeture("");
        setMsgFermeture("");

        if (id) {
            chargerHoraires(id);
            chargerDonneesFermetures(id);
        }
    };

    // =====================================================
    // CHARGER LES HORAIRES
    // =====================================================

    const chargerHoraires = async (id) => {
        try {
            setError("");

            const response = await axios.get(
                `${API}/horaires`,
                {
                    ...config,
                    params: {
                        cabinet_id: id,
                    },
                }
            );

            console.log("HORAIRES :", response.data);

            const liste =
                response.data.data ?? response.data;

            const nouveauxHoraires = jours.map((jour) => {
                const horaire = Array.isArray(liste)
                    ? liste.find((h) => h.jour === jour)
                    : null;

                if (horaire) {
                    return {
                        id: horaire.id,
                        jour: horaire.jour,
                        heure_ouverture:
                            horaire.heure_ouverture
                                ? String(
                                      horaire.heure_ouverture
                                  ).substring(0, 5)
                                : "08:00",
                        heure_fermeture:
                            horaire.heure_fermeture
                                ? String(
                                      horaire.heure_fermeture
                                  ).substring(0, 5)
                                : "17:00",
                        actif: Boolean(horaire.actif),
                    };
                }

                return {
                    id: null,
                    jour,
                    heure_ouverture: "08:00",
                    heure_fermeture: "17:00",
                    actif: true,
                };
            });

            setHoraires(nouveauxHoraires);

        } catch (err) {
            console.error(
                "Erreur horaires :",
                err.response?.data || err
            );

            setError(
                err.response?.data?.message ||
                "Erreur lors du chargement des horaires."
            );
        }
    };

    // =====================================================
    // CHARGER FERMETURES + MEMBRES DU CABINET
    // =====================================================

    const chargerDonneesFermetures = async (id) => {
        setLoadingFermetures(true);
        setErrFermeture("");

        try {
            const [resMedecins, resPatients, resFermetures] =
                await Promise.all([
                    axios.get(
                        `${API}/cabinets/${id}/medecins`,
                        config
                    ),
                    axios.get(
                        `${API}/cabinets/${id}/patients`,
                        config
                    ),
                    axios.get(`${API}/fermetures`, {
                        ...config,
                        params: { cabinet_id: id },
                    }),
                ]);

            const listeMedecins =
                resMedecins.data?.data ?? resMedecins.data ?? [];
            const listePatients =
                resPatients.data?.data ?? resPatients.data ?? [];
            const listeFermetures =
                resFermetures.data?.data ??
                resFermetures.data ??
                [];

            setMedecinsCabinet(
                Array.isArray(listeMedecins)
                    ? listeMedecins
                    : []
            );
            setPatientsCabinet(
                Array.isArray(listePatients)
                    ? listePatients
                    : []
            );
            setFermetures(
                Array.isArray(listeFermetures)
                    ? listeFermetures
                    : []
            );
        } catch (err) {
            console.error(
                "Erreur fermetures :",
                err.response?.data || err
            );

            setErrFermeture(
                err.response?.data?.message ||
                "Erreur lors du chargement des fermetures / absences."
            );
        } finally {
            setLoadingFermetures(false);
        }
    };

    // =====================================================
    // ENREGISTRER UNE FERMETURE
    // =====================================================

    // =====================================================
    // FERMETURES : ACTIONS
    // =====================================================

    const fermetureSurDate = (dateISO, type) =>
        fermetures.find(
            (f) =>
                f.type === type &&
                dateISO >= f.date_debut &&
                dateISO <= (f.date_fin || f.date_debut)
        );

    const changerFormFermeture = (champ, valeur) => {
        setFormFermeture((prev) => ({
            ...prev,
            [champ]: valeur,
        }));
    };

    const basculerJourFerie = async (dateISO, nom) => {
        if (!cabinetId) return;

        setSavingFermeture(true);
        setErrFermeture("");
        setMsgFermeture("");

        try {
            const existante = fermetureSurDate(
                dateISO,
                "jour_ferie"
            );

            if (existante) {
                await axios.delete(
                    `${API}/fermetures/${existante.id}`,
                    config
                );

                setFermetures((prev) =>
                    prev.filter((f) => f.id !== existante.id)
                );

                setMsgFermeture(
                    `« ${nom} » débloqué (${formatDateCourt(
                        dateISO
                    )}).`
                );
            } else {
                const res = await axios.post(
                    `${API}/fermetures`,
                    {
                        cabinet_id: Number(cabinetId),
                        type: "jour_ferie",
                        date_debut: dateISO,
                        date_fin: dateISO,
                        motif: nom,
                    },
                    config
                );

                const cree = res.data?.data ?? res.data;

                setFermetures((prev) =>
                    [...prev, cree].sort((a, b) =>
                        a.date_debut < b.date_debut ? -1 : 1
                    )
                );

                setMsgFermeture(
                    `« ${nom} » bloqué (${formatDateCourt(
                        dateISO
                    )}) — le cabinet sera fermé ce jour.`
                );
            }
        } catch (err) {
            console.error(
                "Erreur jour férié :",
                err.response?.data || err
            );

            setErrFermeture(
                err.response?.data?.message ||
                "Erreur lors de la mise à jour du jour férié."
            );
        } finally {
            setSavingFermeture(false);
        }
    };

    const ajouterFermeture = async (e) => {
        e.preventDefault();

        if (!cabinetId) {
            setErrFermeture(
                "Veuillez sélectionner un cabinet."
            );
            return;
        }

        const {
            type,
            date_debut,
            date_fin,
            medecin_id,
            patient_id,
            motif,
        } = formFermeture;

        if (!date_debut) {
            setErrFermeture(
                "Veuillez choisir une date de début."
            );
            return;
        }

        if (type === "absence_medecin" && !medecin_id) {
            setErrFermeture(
                "Veuillez sélectionner le médecin absent."
            );
            return;
        }

        if (type === "absence_patient" && !patient_id) {
            setErrFermeture(
                "Veuillez sélectionner le patient absent."
            );
            return;
        }

        if (date_fin && date_fin < date_debut) {
            setErrFermeture(
                "La date de fin doit être après la date de début."
            );
            return;
        }

        setSavingFermeture(true);
        setErrFermeture("");
        setMsgFermeture("");

        try {
            const payload = {
                cabinet_id: Number(cabinetId),
                type,
                date_debut,
                date_fin: date_fin || null,
                medecin_id:
                    type === "absence_medecin"
                        ? Number(medecin_id)
                        : null,
                patient_id:
                    type === "absence_patient"
                        ? Number(patient_id)
                        : null,
                motif: motif || null,
            };

            const res = await axios.post(
                `${API}/fermetures`,
                payload,
                config
            );

            const cree = res.data?.data ?? res.data;

            setFermetures((prev) =>
                [...prev, cree].sort((a, b) =>
                    a.date_debut < b.date_debut ? -1 : 1
                )
            );

            setFormFermeture({
                type: "jour_ferie",
                date_debut: "",
                date_fin: "",
                medecin_id: "",
                patient_id: "",
                motif: "",
            });

            setMsgFermeture(
                "Absence / fermeture enregistrée avec succès."
            );
        } catch (err) {
            console.error(
                "Erreur fermeture :",
                err.response?.data || err
            );

            setErrFermeture(
                err.response?.data?.message ||
                "Erreur lors de l'enregistrement de la fermeture."
            );
        } finally {
            setSavingFermeture(false);
        }
    };

    const supprimerFermeture = async (id) => {
        if (
            !window.confirm(
                "Supprimer cette fermeture / absence ?"
            )
        ) {
            return;
        }

        setSavingFermeture(true);
        setErrFermeture("");
        setMsgFermeture("");

        try {
            await axios.delete(
                `${API}/fermetures/${id}`,
                config
            );

            setFermetures((prev) =>
                prev.filter((f) => f.id !== id)
            );

            setMsgFermeture("Fermeture supprimée.");
        } catch (err) {
            console.error(
                "Erreur suppression :",
                err.response?.data || err
            );

            setErrFermeture(
                err.response?.data?.message ||
                "Erreur lors de la suppression."
            );
        } finally {
            setSavingFermeture(false);
        }
    };

    // =====================================================
    // DONNÉES DÉRIVÉES (AFFICHAGE)
    // =====================================================

    const anneeCourante = new Date().getFullYear();

    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    // Prochains jours fériés uniquement (année en cours et suivante,
    // à partir d'aujourd'hui) — pas de liste annuelle complète.
    const prochainsFeries = [
        ...joursFeriesTunisie(anneeCourante),
        ...joursFeriesTunisie(anneeCourante + 1),
    ]
        .filter((f) => f.date >= toISO(aujourdhui))
        .slice(0, 12);

    const horaireActifLe = (dateISO) => {
        const h = horaires.find(
            (h) => h.jour === jourDeLaSemaine(dateISO)
        );
        return h ? Boolean(h.actif) : true;
    };

    const badgeType = (type) => {
        if (type === "jour_ferie") {
            return "rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800";
        }
        if (type === "absence_medecin") {
            return "rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800";
        }
        return "rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800";
    };

    const detailFermeture = (f) => {
        if (f.type === "jour_ferie") {
            return f.motif || "Jour férié";
        }
        if (f.type === "absence_medecin") {
            return f.medecin
                ? nomComplet(f.medecin)
                : `Médecin #${f.medecin_id}`;
        }
        return f.patient
            ? nomComplet(f.patient)
            : `Patient #${f.patient_id}`;
    };

    // =====================================================
    // JOUR FÉRIÉ PERSONNALISÉ
    // =====================================================
    const ajouterJourFeriePersonnalise = async () => {
        if (!cabinetId) {
            setErrFeriePerso("Sélectionnez d'abord un cabinet.");
            return;
        }
        if (!feriePersoDate) {
            setErrFeriePerso("Choisissez une date.");
            return;
        }

        setErrFeriePerso("");
        setMsgFeriePerso("");
        setSavingFermeture(true);

        try {
            await axios.post(
                `${API}/fermetures`,
                {
                    cabinet_id: Number(cabinetId),
                    type: "jour_ferie",
                    date_debut: feriePersoDate,
                    motif:
                        feriePersoMotif.trim() ||
                        "Jour férié personnalisé",
                },
                config
            );

            setMsgFeriePerso(
                "Jour férié ajouté : le cabinet sera fermé ce jour."
            );
            setFeriePersoDate("");
            setFeriePersoMotif("");
            await chargerDonneesFermetures(cabinetId);
        } catch (err) {
            setErrFeriePerso(
                err.response?.data?.message ||
                "Erreur lors de l'ajout du jour férié."
            );
        } finally {
            setSavingFermeture(false);
        }
    };

    // =====================================================
    // AFFICHAGE
    // =====================================================

    return (
        <div className="w-full">
            {error && <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}
            {success && <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-700">{success}</div>}

            {/* Sélecteur de cabinet — masqué quand l'utilisateur n'a qu'un seul cabinet */}
            {cabinets.length > 1 && (
                <div className="mb-6 rounded-xl bg-white p-5 shadow">
                    <label className="mb-2 block font-semibold text-gray-700">Cabinet</label>
                    {loading ? (
                        <p className="text-gray-500">Chargement des cabinets...</p>
                    ) : (
                        <select value={cabinetId} onChange={changerCabinet} className="w-full rounded-lg border border-gray-300 px-4 py-3">
                            <option value="">Sélectionner un cabinet</option>
                            {cabinets.map((cabinet) => (
                                <option key={cabinet.id} value={cabinet.id}>
                                    ID: {cabinet.id} {" - "} {cabinet.nom || cabinet.name || `Cabinet ${cabinet.id}`}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            )}

            {cabinetId && (
                <div className="space-y-6">
                    {errFermeture && <div className="rounded-lg bg-red-50 p-4 text-red-700">{errFermeture}</div>}
                    {msgFermeture && <div className="rounded-lg bg-green-50 p-4 text-green-700">{msgFermeture}</div>}

                    {/* Prochains jours fériés (Tunisie) */}
                    <div className="rounded-xl bg-white p-5 shadow">
                        <div className="border-b border-slate-100 pb-4">
                            <h3 className="text-lg font-semibold text-slate-800">Prochains jours fériés (Tunisie)</h3>
                            <p className="text-sm text-gray-500 mt-0.5">Bloquez les prochains jours fériés pendant lesquels le cabinet doit rester fermé.</p>
                        </div>
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left">Date</th>
                                        <th className="px-5 py-3 text-left">Jour</th>
                                        <th className="px-5 py-3 text-left">Férié</th>
                                        <th className="px-5 py-3 text-left">Statut</th>
                                        <th className="px-5 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {prochainsFeries.map((ferie, index) => {
                                        const bloque = Boolean(fermetureSurDate(ferie.date, "jour_ferie"));
                                        const ouvertParDefaut = horaireActifLe(ferie.date);
                                        return (
                                            <tr key={`${ferie.date}-${index}`}>
                                                <td className="px-5 py-3 whitespace-nowrap">{formatDateCourt(ferie.date)}</td>
                                                <td className="px-5 py-3">{jourDeLaSemaine(ferie.date)}</td>
                                                <td className="px-5 py-3 font-medium">{ferie.nom}</td>
                                                <td className="px-5 py-3">
                                                    {bloque ? (
                                                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Bloqué (fermé)</span>
                                                    ) : ouvertParDefaut ? (
                                                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Ouvert par défaut</span>
                                                    ) : (
                                                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">Déjà fermé ce jour</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <button type="button" onClick={() => basculerJourFerie(ferie.date, ferie.nom)} disabled={savingFermeture}
                                                        className={bloque
                                                            ? "rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                                                            : "rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"}>
                                                        {bloque ? "Débloquer" : "Bloquer"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Jour férié personnalisé */}
                    <div className="rounded-xl bg-white p-5 shadow">
                        <div className="border-b border-slate-100 pb-4">
                            <h3 className="text-lg font-semibold text-slate-800">Jour férié personnalisé</h3>
                            <p className="text-sm text-gray-500 mt-0.5">Date de fermeture au choix (hors liste Tunisie). Le jour sera marqué « Fermé » — supprimez-le dans la liste ci-dessous pour le rouvrir.</p>
                        </div>
                        {errFeriePerso && <div className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{errFeriePerso}</div>}
                        {msgFeriePerso && <div className="mt-4 rounded-lg bg-green-50 p-3 text-green-700">{msgFeriePerso}</div>}
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="flex-1">
                                <label className="mb-1 block text-sm font-semibold text-gray-700">Date</label>
                                <input type="date" value={feriePersoDate} onChange={(e) => setFeriePersoDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2" />
                            </div>
                            <div className="flex-1">
                                <label className="mb-1 block text-sm font-semibold text-gray-700">Motif (optionnel)</label>
                                <input type="text" value={feriePersoMotif} onChange={(e) => setFeriePersoMotif(e.target.value)} placeholder="Ex : Fête de la République, pont..." className="w-full rounded-lg border border-gray-300 px-4 py-2" />
                            </div>
                            <button
                                type="button"
                                onClick={ajouterJourFeriePersonnalise}
                                disabled={savingFermeture}
                                className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {savingFermeture ? "Ajout..." : "Ajouter le jour férié"}
                            </button>
                        </div>
                    </div>

                    {/* Formulaire : déclarer absence / fermeture */}
                    <div className="rounded-xl bg-white p-5 shadow">
                        <div className="border-b border-slate-100 pb-4">
                            <h3 className="text-lg font-semibold text-slate-800">Déclarer une absence / fermeture</h3>
                            <p className="text-sm text-gray-500 mt-0.5">Jour férié, absence médecin ou patient — ces dates seront bloquées.</p>
                        </div>
                        <form onSubmit={ajouterFermeture} className="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-gray-700">Type</label>
                                <select value={formFermeture.type} onChange={(e) => changerFormFermeture("type", e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2">
                                    {Object.entries(TYPE_FERMETURES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            {formFermeture.type === "absence_medecin" && (
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-gray-700">Médecin</label>
                                    <select value={formFermeture.medecin_id} onChange={(e) => changerFormFermeture("medecin_id", e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2">
                                        {medecinsCabinet.length === 0 ? (
                                            <option value="">Aucun médecin associé</option>
                                        ) : (
                                            <>
                                                <option value="">Sélectionner le médecin</option>
                                                {medecinsCabinet.map((m) => <option key={m.id} value={m.id}>{nomComplet(m) || `Médecin #${m.id}`}</option>)}
                                            </>
                                        )}
                                    </select>
                                </div>
                            )}
                            {formFermeture.type === "absence_patient" && (
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-gray-700">Patient</label>
                                    <select value={formFermeture.patient_id} onChange={(e) => changerFormFermeture("patient_id", e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2">
                                        {patientsCabinet.length === 0 ? (
                                            <option value="">Aucun patient associé</option>
                                        ) : (
                                            <>
                                                <option value="">Sélectionner le patient</option>
                                                {patientsCabinet.map((p) => <option key={p.id} value={p.id}>{nomComplet(p) || `Patient #${p.id}`}</option>)}
                                            </>
                                        )}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-gray-700">Date de début</label>
                                <input type="date" required value={formFermeture.date_debut} onChange={(e) => changerFormFermeture("date_debut", e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-gray-700">Date de fin (optionnelle)</label>
                                <input type="date" value={formFermeture.date_fin} min={formFermeture.date_debut || undefined} onChange={(e) => changerFormFermeture("date_fin", e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-semibold text-gray-700">Motif (optionnel)</label>
                                <input type="text" value={formFermeture.motif} onChange={(e) => changerFormFermeture("motif", e.target.value)} placeholder="Ex : congé, jour férié, absence..." className="w-full rounded-lg border border-gray-300 px-4 py-2" />
                            </div>
                            <div className="md:col-span-2">
                                <button type="submit" disabled={savingFermeture} className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                                    {savingFermeture ? "Enregistrement..." : "Enregistrer la fermeture / absence"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Liste des fermetures enregistrées */}
                    <div className="rounded-xl bg-white p-5 shadow">
                        <div className="border-b border-slate-100 pb-4">
                            <h3 className="text-lg font-semibold text-slate-800">Fermetures & absences enregistrées</h3>
                            <p className="text-sm text-gray-500 mt-0.5">Prochaines et passées — supprimables à tout moment.</p>
                        </div>
                        {loadingFermetures ? (
                            <p className="mt-3 text-gray-500">Chargement des fermetures...</p>
                        ) : fermetures.length === 0 ? (
                            <p className="mt-3 text-gray-500">Aucune fermeture enregistrée pour ce cabinet.</p>
                        ) : (
                            <div className="mt-3 overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-5 py-3 text-left">Type</th>
                                            <th className="px-5 py-3 text-left">Détail</th>
                                            <th className="px-5 py-3 text-left">Période</th>
                                            <th className="px-5 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {fermetures.map((f) => (
                                            <tr key={f.id}>
                                                <td className="px-5 py-3"><span className={badgeType(f.type)}>{TYPE_FERMETURES[f.type] || f.type}</span></td>
                                                <td className="px-5 py-3">
                                                    {detailFermeture(f)}
                                                    {f.motif && f.type !== "jour_ferie" && <div className="text-xs text-gray-400">{f.motif}</div>}
                                                </td>
                                                <td className="px-5 py-3 whitespace-nowrap">
                                                    {formatDateCourt(f.date_debut)}
                                                    {f.date_fin && f.date_fin !== f.date_debut && <> → {formatDateCourt(f.date_fin)}</>}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <button type="button" onClick={() => supprimerFermeture(f.id)} disabled={savingFermeture}
                                                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                                                        Supprimer
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
