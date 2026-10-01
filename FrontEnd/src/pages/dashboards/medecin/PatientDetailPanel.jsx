import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { X, Loader2, FilePlus2, FlaskConical, Calendar, CalendarDays, ClipboardList, FileText, IdCard, ReceiptText } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const fmtDate = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
};

/* Date au format JJ/MM/AAAA (zéros non significatifs conservés) */
const fmtDatePaiement = (d) => {
    if (!d) return "Non renseigné";
    const texte = String(d);
    const iso = texte.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
    const dt = new Date(texte);
    if (Number.isNaN(dt.getTime())) return "Non renseigné";
    const mois = String(dt.getMonth() + 1).padStart(2, "0");
    const jour = String(dt.getDate()).padStart(2, "0");
    return `${jour}/${mois}/${dt.getFullYear()}`;
};

/* Clé AAAA-MM-JJ d'un paiement, pour le filtre par date */
const datePaiementKey = (p) => {
    const brut = p?.date_paiement;
    if (!brut) return "";
    const texte = String(brut);
    const iso = texte.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const dt = new Date(texte);
    if (Number.isNaN(dt.getTime())) return "";
    const mois = String(dt.getMonth() + 1).padStart(2, "0");
    const jour = String(dt.getDate()).padStart(2, "0");
    return `${dt.getFullYear()}-${mois}-${jour}`;
};

/* Montant au format « x.xxx DT » */
const fmtMontant = (montant) => {
    if (montant === null || montant === undefined || montant === "") {
        return "Non renseigné";
    }
    const nombre = Number(montant);
    if (Number.isNaN(nombre)) return "Non renseigné";
    return `${nombre.toFixed(3)} DT`;
};

/* Classement d'un paiement : paye | attente | impaye
   (les cas « non payé » / « impayé » sont traités avant « pay ») */
const typePaiementStatut = (statut) => {
    const texte = String(statut ?? "").trim().toLowerCase();
    if (texte === "") return "paye";
    if (texte.includes("attente")) return "attente";
    if (
        texte.includes("non pay") ||
        texte.includes("impay") ||
        texte.includes("pas pay")
    ) {
        return "impaye";
    }
    if (texte.includes("pay")) return "paye";
    return "paye";
};

const badgePaiementClass = (type) => {
    if (type === "attente") return "bg-amber-100 text-amber-800";
    if (type === "impaye") return "bg-rose-100 text-rose-800";
    return "bg-emerald-100 text-emerald-800";
};

const libellePaiementStatut = (statut) => {
    const texte = String(statut ?? "").trim();
    if (texte === "") return "Payé";
    return texte.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
};

const modeLabel = (m) => {
    const map = {
        presentiel: "Présentiel",
        video: "Téléconsultation",
        telephone: "Téléphone",
        en_ligne: "En ligne",
    };
    return map[m] || m || "";
};

const sexeLabel = (sexe) => {
    if (!sexe) return "Non renseigné";
    if (sexe === "M") return "Homme";
    if (sexe === "F") return "Femme";
    return sexe;
};

const valeurOuNonRenseigne = (valeur) => {
    if (valeur === null || valeur === undefined) return "Non renseigné";
    const texte = String(valeur).trim();
    return texte === "" ? "Non renseigné" : texte;
};

const statutLabel = (statut) => {
    const texte = String(statut || "Planifié").replace(/_/g, " ");
    return texte.charAt(0).toUpperCase() + texte.slice(1);
};

const dateHeureLabel = (date, heure) => {
    const jour = date ? fmtDate(date) : "Non renseigné";
    return heure ? `${jour} à ${String(heure).substring(0, 5)}` : jour;
};

/* =====================================================
   TITRE DE SECTION DU DOSSIER
   -----------------------------------------------------
   Chaque grand bloc du dossier (dossier du patient, actes,
   consultations, ordonnances, analyses, historique des
   paiements) porte un intitulé plus grand et plus foncé,
   précédé d'une pastille d'icône teintée : les titres se
   distinguent ainsi les uns des autres au premier coup d'œil.
   ===================================================== */

function TitreSection({
    icon: Icon,
    teinte = "bg-slate-100 text-slate-700",
    children,
}) {
    return (
        <h3 className="flex items-center gap-2.5 text-base font-bold text-slate-900">
            <span
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${teinte}`}
            >
                <Icon size={16} />
            </span>

            <span className="min-w-0">{children}</span>
        </h3>
    );
}

export default function PatientDetailPanel({
    patient,
    loading,
    error,
    ordonnances = [],
    analyses = [],
    rdvs = [],
    onClose,
    onAjouterOrdonnance,
    onAjouterAnalyse,
    sectionInitiale = null,
}) {
    const [dateFiltre, setDateFiltre] = useState("");
    const [historiqueComplet, setHistoriqueComplet] = useState(false);
    const [paiements, setPaiements] = useState([]);
    const [paiementsLoading, setPaiementsLoading] = useState(false);
    const [paiementsError, setPaiementsError] = useState("");
    const [datePaiementFiltre, setDatePaiementFiltre] = useState("");
    const [paiementDetail, setPaiementDetail] = useState(null);
    const paiementsSectionRef = useRef(null);

    /* Historique des paiements du patient (API) */
    useEffect(() => {
        const patientId = patient?.id;

        if (!patientId) {
            setPaiements([]);
            setPaiementsError("");
            setPaiementsLoading(false);
            return undefined;
        }

        let annule = false;

        const chargerPaiements = async () => {
            setPaiementsLoading(true);
            setPaiementsError("");

            try {
                const token =
                    localStorage.getItem("token") ||
                    sessionStorage.getItem("token");
                const res = await axios.get(
                    `${API_URL}/patients/${patientId}/paiements`,
                    {
                        headers: {
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const liste = Array.isArray(res.data)
                    ? res.data
                    : res.data?.data ?? [];

                if (!annule) setPaiements(Array.isArray(liste) ? liste : []);
            } catch (err) {
                if (!annule) {
                    setPaiements([]);
                    setPaiementsError(
                        err.response?.data?.message ||
                            "Impossible de charger l'historique des paiements."
                    );
                }
            } finally {
                if (!annule) setPaiementsLoading(false);
            }
        };

        chargerPaiements();

        return () => {
            annule = true;
        };
    }, [patient?.id]);

    /* Ouverture directe sur la section « Historique des paiements » :
       quand sectionInitiale === "paiements", on y défile automatiquement. */
    useEffect(() => {
        if (sectionInitiale !== "paiements") return undefined;
        if (loading) return undefined;

        const cible = paiementsSectionRef.current;
        if (!cible) return undefined;

        const minuteur = setTimeout(() => {
            cible.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);

        return () => clearTimeout(minuteur);
    }, [sectionInitiale, loading, patient?.id]);

    if (!patient) return null;

    const consultationsTriees = [...rdvs].sort((a, b) => {
        const cleA = `${a.date_rdv || a.date || ""} ${a.heure_rdv || a.heure || ""}`;
        const cleB = `${b.date_rdv || b.date || ""} ${b.heure_rdv || b.heure || ""}`;
        return cleB.localeCompare(cleA);
    });

    const dateRdvKey = (r) => {
        const brut = r.date_rdv || r.date;
        if (!brut) return "";
        const texte = String(brut);
        const iso = texte.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
        const dt = new Date(texte);
        if (Number.isNaN(dt.getTime())) return "";
        const mois = String(dt.getMonth() + 1).padStart(2, "0");
        const jour = String(dt.getDate()).padStart(2, "0");
        return `${dt.getFullYear()}-${mois}-${jour}`;
    };

    const consultationsAffichees = dateFiltre
        ? consultationsTriees.filter((r) => dateRdvKey(r) === dateFiltre)
        : historiqueComplet
        ? consultationsTriees
        : consultationsTriees.slice(0, 3);

    const paiementsTries = [...paiements].sort((a, b) =>
        datePaiementKey(b).localeCompare(datePaiementKey(a))
    );

    const paiementsAffiches = datePaiementFiltre
        ? paiementsTries.filter(
              (p) => datePaiementKey(p) === datePaiementFiltre
          )
        : paiementsTries;

    const totauxPaiements = paiementsAffiches.reduce(
        (acc, p) => {
            const montant = Number(p?.montant);
            if (Number.isNaN(montant)) return acc;
            const type = typePaiementStatut(p?.statut);
            acc[type] += montant;
            return acc;
        },
        { paye: 0, attente: 0, impaye: 0 }
    );

    const infosPatient = [
        { label: "Nom", valeur: patient.nom },
        { label: "Prénom", valeur: patient.prenom },
        { label: "Téléphone", valeur: patient.telephone },
        { label: "Email", valeur: patient.email },
        {
            label: "Date de naissance",
            valeur: patient.date_naissance ? fmtDate(patient.date_naissance) : "",
        },
        { label: "Sexe", valeur: patient.sexe ? sexeLabel(patient.sexe) : "" },
        { label: "Groupe sanguin", valeur: patient.groupe_sanguin },
        { label: "Allergies", valeur: patient.allergies },
        {
            label: "Maladies chroniques",
            valeur: patient.maladies_chroniques ?? patient.maladiesChroniques,
        },
        {
            label: "Antécédents",
            valeur:
                patient.antecedents ??
                patient.antecedents_medicaux ??
                patient.antecedentsMedicaux,
        },
    ];

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm">
            {/* Barre d'action du dossier : les informations du patient sont
                affichées une seule fois, dans la carte « Dossier du patient »
                ci-dessous. Les champs qui figuraient ici (initiales, nom,
                référence, sexe, téléphone) ne sont donc plus répétés ;
                seul le bouton de fermeture est conservé. */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-5 py-3 flex items-center justify-end rounded-t-2xl">
                <button
                    type="button"
                    onClick={onClose}
                    className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                    title="Fermer le dossier"
                    aria-label="Fermer le dossier du patient"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="p-5">
                {error && (
                    <div className="mb-4 rounded-xl border border-rose-200/80 bg-rose-50 p-3 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                    {/* Les champs déjà connus (dossier du patient : nom,
                        téléphone, e-mail…) s'affichent immédiatement : seules
                        les sections qui dépendent des données récupérées
                        montrent un indicateur de chargement. */}
                    <div className="space-y-5">
                        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-slate-50 border-b border-slate-200/80 px-5 py-3.5">
                                <TitreSection icon={IdCard} teinte="bg-teal-50 text-teal-700">
                                    Dossier du patient
                                </TitreSection>
                            </div>
                            <div className="p-5">
                                {/* Les informations non renseignées ne sont pas
                                    affichées : la fiche reste lisible même
                                    quand le dossier est incomplet. */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                    {infosPatient
                                        .filter(
                                            (info) =>
                                                String(
                                                    info.valeur ?? ""
                                                ).trim() !== ""
                                        )
                                        .map((info) => (
                                            <div
                                                key={info.label}
                                                className="min-w-0"
                                            >
                                                <p className="text-xs font-medium text-slate-600">
                                                    {info.label}
                                                </p>
                                                <p className="mt-0.5 break-words text-sm font-medium text-slate-900">
                                                    {String(info.valeur).trim()}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-slate-50 border-b border-slate-200/80 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                                <TitreSection icon={ClipboardList} teinte="bg-indigo-50 text-indigo-700">
                                    Actes
                                </TitreSection>
                                <p className="text-xs font-medium text-slate-600">
                                    {loading ? (
                                        <span className="inline-flex items-center gap-1.5">
                                            <Loader2 size={12} className="animate-spin text-teal-600" />
                                            Chargement des actes…
                                        </span>
                                    ) : (
                                        <>
                                            Ordonnances :{" "}
                                            <span className="font-bold text-slate-900">
                                                {ordonnances.length}
                                            </span>{" "}
                                            · Analyses :{" "}
                                            <span className="font-bold text-slate-900">
                                                {analyses.length}
                                            </span>
                                        </>
                                    )}
                                </p>
                            </div>
                            <div className="p-5 space-y-2.5">
                                {/* Actions principales : les deux ajouts, côte à côte */}
                                <div className="grid sm:grid-cols-2 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => onAjouterOrdonnance?.(patient)}
                                        className="inline-flex items-center justify-center gap-2 w-full h-11 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition cursor-pointer whitespace-nowrap"
                                    >
                                        <FilePlus2 size={16} /> Ajouter une ordonnance
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onAjouterAnalyse?.(patient)}
                                        className="inline-flex items-center justify-center gap-2 w-full h-11 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition cursor-pointer whitespace-nowrap"
                                    >
                                        <FlaskConical size={16} /> Ajouter une analyse
                                    </button>
                                </div>

                                {/* Action secondaire : accès à l'historique des paiements */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        paiementsSectionRef.current?.scrollIntoView({
                                            behavior: "smooth",
                                            block: "start",
                                        })
                                    }
                                    className="inline-flex items-center justify-center gap-2 w-full h-11 px-4 rounded-xl bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 text-sm font-semibold transition cursor-pointer whitespace-nowrap"
                                >
                                    <ReceiptText size={16} /> Historique des paiements
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-slate-50 border-b border-slate-200/80 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                                <TitreSection icon={CalendarDays} teinte="bg-blue-50 text-blue-700">
                                    {dateFiltre
                                        ? `Consultations du ${fmtDate(dateFiltre)}`
                                        : historiqueComplet
                                        ? `Historique complet des consultations (${rdvs.length})`
                                        : "3 dernières consultations"}
                                </TitreSection>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                                        <Calendar size={14} className="text-slate-500" />
                                        <input
                                            type="date"
                                            value={dateFiltre}
                                            onChange={(e) => setDateFiltre(e.target.value)}
                                            className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
                                            title="Filtrer les consultations par date"
                                        />
                                        {dateFiltre && (
                                            <button
                                                type="button"
                                                onClick={() => setDateFiltre("")}
                                                className="text-slate-500 hover:text-slate-700"
                                                title="Effacer le filtre par date"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    {!dateFiltre && rdvs.length > 3 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setHistoriqueComplet((v) => !v)
                                            }
                                            className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                                        >
                                            {historiqueComplet
                                                ? "Voir les 3 dernières"
                                                : `Voir tout l'historique (${rdvs.length})`}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="p-5 space-y-4">
                                {loading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 size={20} className="animate-spin text-teal-600" />
                                    </div>
                                ) : consultationsAffichees.length === 0 ? (
                                    <p className="py-6 text-sm text-slate-500 text-center">
                                        {dateFiltre
                                            ? "Aucune consultation à cette date."
                                            : "Aucune consultation enregistrée pour ce patient."}
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {consultationsAffichees.map((r, index) => (
                                            <div
                                                key={r.id ?? index}
                                                className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {dateHeureLabel(
                                                            r.date_rdv || r.date,
                                                            r.heure_rdv || r.heure
                                                        )}
                                                    </p>
                                                    {r.medecin && (
                                                        <p className="text-xs font-medium text-teal-700 mt-0.5">
                                                            Dr {r.medecin.prenom || ""}{" "}
                                                            {r.medecin.nom || ""}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-slate-600 mt-1">
                                                        Motif : {valeurOuNonRenseigne(r.motif)}
                                                    </p>
                                                    {r.mode && (
                                                        <span className="inline-flex items-center mt-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
                                                            {modeLabel(r.mode)}
                                                        </span>
                                                    )}
                                                    {r.notes && (
                                                        <p className="text-xs text-slate-600 mt-2 bg-white border border-slate-200/80 rounded-lg px-3 py-2">
                                                            {r.notes}
                                                        </p>
                                                    )}
                                                </div>
                                                <span
                                                    className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        String(r.statut || "").includes("termin")
                                                            ? "bg-teal-100 text-teal-800"
                                                            : String(r.statut || "").includes("annul")
                                                            ? "bg-rose-100 text-rose-800"
                                                            : "bg-amber-100 text-amber-800"
                                                    }`}
                                                >
                                                    {statutLabel(r.statut)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-5">
                        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-slate-50 border-b border-slate-200/80 px-5 py-3.5">
                                <TitreSection icon={FileText} teinte="bg-emerald-50 text-emerald-700">
                                    Ordonnances ({ordonnances.length})
                                </TitreSection>
                            </div>
                            <div className="p-5">
                                {loading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 size={20} className="animate-spin text-teal-600" />
                                    </div>
                                ) : ordonnances.length === 0 ? (
                                    <p className="py-6 text-sm text-slate-500 text-center">
                                        Aucune ordonnance enregistree.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {ordonnances.map((o) => (
                                            <div
                                                key={o.id}
                                                className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-sm font-semibold text-slate-900">
                                                        Ordonnance #{o.id}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-600">
                                                        {fmtDate(o.date_ordonnance)}
                                                    </span>
                                                </div>
                                                {o.notes && (
                                                    <p className="text-xs text-slate-600 mt-1">
                                                        {o.notes}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                    {(o.lignes || o.medicaments || []).map((m, i) => (
                                                        <span
                                                            key={i}
                                                            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-teal-100 text-teal-800"
                                                        >
                                                            {m.medicament || m.nom || m}
                                                            {m.dosage ? ` - ${m.dosage}` : ""}
                                                        </span>
                                                    ))}
                                                    {(o.lignes || []).length === 0 &&
                                                        (o.medicaments || []).length === 0 && (
                                                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700">
                                                                {o.statut === "active"
                                                                    ? "Active"
                                                                    : o.statut || "Enregistree"}
                                                            </span>
                                                        )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-slate-50 border-b border-slate-200/80 px-5 py-3.5">
                                <TitreSection icon={FlaskConical} teinte="bg-violet-50 text-violet-700">
                                    Analyses ({analyses.length})
                                </TitreSection>
                            </div>
                            <div className="p-5">
                                {loading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 size={20} className="animate-spin text-teal-600" />
                                    </div>
                                ) : analyses.length === 0 ? (
                                    <p className="py-6 text-sm text-slate-500 text-center">
                                        Aucune analyse enregistree.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {analyses.map((a) => (
                                            <div
                                                key={a.id}
                                                className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-sm font-semibold text-slate-900">
                                                        {a.nom || a.type || `Analyse #${a.id}`}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-600">
                                                        {fmtDate(a.date_examen)}
                                                    </span>
                                                </div>
                                                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-800 mt-1.5">
                                                    {a.statut || "En attente"}
                                                </span>
                                                {a.resultat && (
                                                    <p className="text-xs text-slate-600 mt-2">
                                                        {a.resultat}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        </div>

                        <div ref={paiementsSectionRef} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-slate-50 border-b border-slate-200/80 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                                <TitreSection icon={ReceiptText} teinte="bg-amber-50 text-amber-700">
                                    {datePaiementFiltre
                                        ? `Paiements du ${fmtDatePaiement(datePaiementFiltre)}`
                                        : "Historique des paiements"}
                                </TitreSection>
                                <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                                    <Calendar size={14} className="text-slate-500" />
                                    <input
                                        type="date"
                                        value={datePaiementFiltre}
                                        onChange={(e) =>
                                            setDatePaiementFiltre(e.target.value)
                                        }
                                        className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
                                        title="Filtrer les paiements par date"
                                    />
                                    {datePaiementFiltre && (
                                        <button
                                            type="button"
                                            onClick={() => setDatePaiementFiltre("")}
                                            className="text-slate-500 hover:text-slate-700"
                                            title="Effacer le filtre par date"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-5">
                                {paiementsError && (
                                    <p className="text-sm text-rose-600 mb-3">
                                        {paiementsError}
                                    </p>
                                )}

                                {paiementsLoading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2
                                            size={18}
                                            className="animate-spin text-teal-600"
                                        />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                                        <table className="w-full min-w-[640px] border-collapse text-left">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50">
                                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Date
                                                    </th>
                                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Mode
                                                    </th>
                                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Description
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Montant
                                                    </th>
                                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Statut
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paiementsAffiches.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={5}
                                                            className="px-4 py-6 text-center text-sm text-slate-500"
                                                        >
                                                            {datePaiementFiltre
                                                                ? "Aucun paiement à cette date."
                                                                : "Aucun paiement enregistré pour ce patient."}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paiementsAffiches.map((p, index) => {
                                                        const type = typePaiementStatut(p?.statut);
                                                        return (
                                                            <tr
                                                                key={p?.id ?? index}
                                                                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70 transition-colors"
                                                            >
                                                                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                                                    {fmtDatePaiement(p?.date_paiement)}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                                    {valeurOuNonRenseigne(p?.mode_paiement)}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                                    {p?.description ? p.description : "—"}
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-slate-900">
                                                                    {fmtMontant(p?.montant)}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span
                                                                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgePaiementClass(
                                                                            type
                                                                        )}`}
                                                                    >
                                                                        {libellePaiementStatut(p?.statut)}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 flex flex-wrap items-center gap-6">
                                    <span className="inline-flex items-baseline gap-2">
                                        <span className="text-xs font-medium text-slate-600">
                                            Total payé :
                                        </span>
                                        <span className="text-lg font-bold text-emerald-700 tabular-nums">
                                            {fmtMontant(totauxPaiements.paye)}
                                        </span>
                                    </span>
                                    <span className="inline-flex items-baseline gap-2">
                                        <span className="text-xs font-medium text-slate-600">
                                            En attente :
                                        </span>
                                        <span className="text-lg font-bold text-amber-600 tabular-nums">
                                            {fmtMontant(totauxPaiements.attente)}
                                        </span>
                                    </span>
                                    <span className="inline-flex items-baseline gap-2">
                                        <span className="text-xs font-medium text-slate-600">
                                            Non payé :
                                        </span>
                                        <span className="text-lg font-bold text-rose-600 tabular-nums">
                                            {fmtMontant(totauxPaiements.impaye)}
                                        </span>
                                    </span>
                                </div>

                                {paiementDetail && (
                                    <div className="mt-4 rounded-xl border border-teal-200/80 bg-teal-50 px-4 py-3 flex items-start justify-between gap-3">
                                        <div className="min-w-0 text-sm text-teal-800">
                                            <p className="font-semibold">
                                                Détail du paiement
                                            </p>
                                            <p className="mt-0.5 text-teal-700">
                                                {fmtDatePaiement(
                                                    paiementDetail?.date_paiement
                                                )}{" "}
                                                ·{" "}
                                                {valeurOuNonRenseigne(
                                                    paiementDetail?.mode_paiement
                                                )}{" "}
                                                · {fmtMontant(paiementDetail?.montant)}
                                            </p>
                                            <p className="mt-0.5 text-teal-700">
                                                Statut :{" "}
                                                {libellePaiementStatut(
                                                    paiementDetail?.statut
                                                )}
                                            </p>
                                            {paiementDetail?.description ? (
                                                <p className="mt-0.5 text-teal-700">
                                                    Description :{" "}
                                                    {paiementDetail.description}
                                                </p>
                                            ) : null}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setPaiementDetail(null)}
                                            className="shrink-0 text-teal-700 hover:text-teal-900 cursor-pointer"
                                            title="Fermer le détail"
                                            aria-label="Fermer le détail du paiement"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
            </div>
        </div>
    );
}
