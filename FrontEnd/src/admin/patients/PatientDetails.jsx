import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, UserRound, X, CheckCircle2 } from "lucide-react";
import { getPatient } from "../../services/patientService";
import api from "../../services/api";

function PatientDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [patient, setPatient] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    // Racine du serveur : sert les fichiers /storage (photos)
    const API_ROOT = "http://127.0.0.1:8000";

    // =====================================================
    // ENCAISSEMENT D'UN PAIEMENT
    // =====================================================

    const [showPaymentModal, setShowPaymentModal] =
        useState(false);

    const [paymentForm, setPaymentForm] = useState({
        montant: "",
        mode_paiement: "Espèces",
        statut: "Payé",
        date_paiement: new Date()
            .toISOString()
            .substring(0, 10),
        description: "",
    });

    const [paymentSaving, setPaymentSaving] =
        useState(false);

    const [paymentError, setPaymentError] = useState("");

    const [paymentSuccess, setPaymentSuccess] =
        useState("");

    const openPaymentModal = () => {
        setPaymentForm({
            montant: "",
            mode_paiement: "Espèces",
            statut: "Payé",
            date_paiement: new Date()
                .toISOString()
                .substring(0, 10),
            description: "",
        });

        setPaymentError("");

        setShowPaymentModal(true);
    };

    const handleEncaisserPayment = async (event) => {
        event.preventDefault();

        setPaymentSaving(true);
        setPaymentError("");

        try {
            const response = await api.post(
                "/api/admin/paiements",
                {
                    patient_id: patient.id,
                    montant: paymentForm.montant,
                    mode_paiement:
                        paymentForm.mode_paiement,
                    statut: paymentForm.statut,
                    date_paiement:
                        paymentForm.date_paiement || null,
                    description:
                        paymentForm.description,
                }
            );

            setShowPaymentModal(false);

            setPaymentSuccess(
                response.data?.message ||
                    "Paiement enregistré avec succès."
            );

            setTimeout(
                () => setPaymentSuccess(""),
                4000
            );
        } catch (err) {
            const serverErrors =
                err.response?.data?.errors;

            const message = serverErrors
                ? Object.values(serverErrors)
                      .flat()
                      .join(" ")
                : err.response?.data?.message ||
                  "Impossible d'enregistrer le paiement.";

            setPaymentError(message);
        } finally {
            setPaymentSaving(false);
        }
    };

    // =====================================================
    // CHARGER LE PATIENT
    // =====================================================

    useEffect(() => {

        const loadPatient = async () => {

            try {

                setLoading(true);
                setError("");

                const response = await getPatient(id);

                console.log(
                    "Réponse API patient :",
                    response.data
                );

                /*
                -------------------------------------------------
                Laravel peut retourner :

                {
                    patient: {...}
                }

                ou

                {
                    data: {...}
                }

                ou directement :

                {
                    id: 1,
                    nom: "...",
                    prenom: "..."
                }
                -------------------------------------------------
                */

                const data =
                    response?.data?.patient ||
                    response?.data?.data ||
                    response?.data;

                if (!data || !data.id) {

                    setError(
                        "Patient introuvable."
                    );

                    return;
                }

                /*
                -------------------------------------------------
                On normalise les données
                -------------------------------------------------
                */

                setPatient({
                    id: data.id || "",
                    nom: data.nom || "",
                    prenom: data.prenom || "",
                    date_naissance:
                        data.date_naissance || "",
                    sexe: data.sexe || "",
                    telephone:
                        data.telephone || "",
                    email:
                        data.email || "",
                    adresse:
                        data.adresse || "",
                    groupe_sanguin:
                        data.groupe_sanguin || "",
                    allergies:
                        data.allergies || "",
                    maladies_chroniques:
                        data.maladies_chroniques || "",
                    antecedents:
                        data.antecedents || "",
                    photo: data.photo || ""
                });

            } catch (err) {

                console.error(
                    "Erreur chargement patient :",
                    err
                );

                console.error(
                    "Réponse serveur :",
                    err.response?.data
                );

                setError(
                    err.response?.data?.message ||
                    "Impossible de charger les informations du patient."
                );

            } finally {

                setLoading(false);

            }

        };

        loadPatient();

    }, [id]);


    // =====================================================
    // CHARGEMENT
    // =====================================================

    if (loading) {

        return (

            <div className="p-6">

                <div className="
                    bg-white
                    rounded-2xl
                    shadow
                    border
                    border-gray-200
                    p-10
                    text-center
                ">

                    <div className="
                        w-10
                        h-10
                        border-4
                        border-blue-100
                        border-t-blue-700
                        rounded-full
                        animate-spin
                        mx-auto
                    " />

                    <p className="
                        mt-4
                        text-blue-700
                        font-medium
                    ">
                        Chargement du patient...
                    </p>

                </div>

            </div>
        );
    }


    // =====================================================
    // ERREUR
    // =====================================================

    if (error) {

        return (

            <div className="p-6">

                <div className="
                    bg-white
                    rounded-2xl
                    shadow
                    border
                    border-gray-200
                    p-8
                    text-center
                ">

                    <p className="
                        text-red-600
                        font-medium
                    ">
                        {error}
                    </p>

                    <button
                        onClick={() =>
                            navigate("/admin/patients")
                        }
                        className="
                            mt-5
                            inline-flex
                            items-center
                            gap-2
                            bg-blue-700
                            hover:bg-blue-800
                            text-white
                            px-5
                            py-2.5
                            rounded-lg
                            font-medium
                            transition
                        "
                    >

                        <ArrowLeft size={18} />

                        Retour aux patients

                    </button>

                </div>

            </div>
        );
    }


    // =====================================================
    // PATIENT NON TROUVÉ
    // =====================================================

    if (!patient) {

        return (

            <div className="p-6">

                <div className="
                    bg-white
                    rounded-2xl
                    shadow
                    border
                    border-gray-200
                    p-8
                    text-center
                ">

                    <p className="text-gray-600">
                        Patient introuvable.
                    </p>

                </div>

            </div>
        );
    }


    // =====================================================
    // AFFICHAGE
    // =====================================================

    return (

        <div className="
            w-full
            p-4
            md:p-6
        ">

            {/* =================================================
                SUCCÈS
            ================================================= */}

            {paymentSuccess && (
                <div className="
                    mb-6
                    flex
                    items-center
                    gap-2
                    bg-green-50
                    border
                    border-green-200
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-green-700
                ">

                    <CheckCircle2 size={18} />

                    {paymentSuccess}

                </div>
            )}

            {/* =================================================
                HEADER
            ================================================= */}

            {/* BANNIÈRE */}
            <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        {patient?.photo ? (
                            <img
                                src={`${API_ROOT}/storage/${patient.photo}`}
                                alt={`${patient.prenom || ""} ${patient.nom || ""}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                }}
                            />
                        ) : (
                            <UserRound size={26} className="text-white" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                            Fiche Patient
                        </h1>
                        <p className="text-blue-100 text-sm mt-0.5">
                            Informations personnelles et médicales
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={openPaymentModal}
                        className="
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            bg-blue-700
                            hover:bg-blue-800
                            text-white
                            px-5
                            py-2.5
                            rounded-xl
                            font-medium
                            shadow-sm
                            transition
                        "
                    >

                        <CreditCard size={18} />

                        Encaisser un paiement

                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/admin/patients")
                        }
                        className="
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            bg-white
                            border
                            border-gray-300
                            hover:bg-gray-50
                            text-gray-700
                            px-5
                            py-2.5
                            rounded-xl
                            font-medium
                            shadow-sm
                            transition
                        "
                    >

                        <ArrowLeft size={18} />

                        Retour

                    </button>
                </div>
            </div>



            {/* =================================================
                IDENTITÉ DU PATIENT
            ================================================= */}

            <div className="
                bg-white
                rounded-2xl
                shadow-md
                border
                border-gray-200
                p-6
                mb-6
            ">

                <p className="
                    text-sm
                    text-gray-500
                    mb-2
                ">
                    Patient N° {patient.id}
                </p>

                <h2 className="
                    text-2xl
                    md:text-3xl
                    font-bold
                    text-blue-950
                ">

                    {patient.nom} {patient.prenom}

                </h2>

            </div>


            {/* =================================================
                INFORMATIONS PERSONNELLES
            ================================================= */}

            <div className="
                bg-white
                rounded-2xl
                shadow-md
                border
                border-gray-200
                p-6
            ">

                <h3 className="
                    text-xl
                    font-semibold
                    text-blue-950
                    border-b
                    border-blue-100
                    pb-3
                    mb-5
                ">
                    Informations du patient
                </h3>


                <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    gap-5
                ">


                    {/* NOM */}

                    <div className="
                        bg-blue-50
                        rounded-xl
                        p-4
                        border
                        border-blue-100
                    ">

                        <p className="
                            text-sm
                            text-gray-500
                            mb-1
                        ">
                            Nom
                        </p>

                        <p className="
                            font-semibold
                            text-gray-900
                        ">
                            {patient.nom || "-"}
                        </p>

                    </div>


                    {/* PRÉNOM */}

                    <div className="
                        bg-blue-50
                        rounded-xl
                        p-4
                        border
                        border-blue-100
                    ">

                        <p className="
                            text-sm
                            text-gray-500
                            mb-1
                        ">
                            Prénom
                        </p>

                        <p className="
                            font-semibold
                            text-gray-900
                        ">
                            {patient.prenom || "-"}
                        </p>

                    </div>


                    {/* DATE DE NAISSANCE */}

                    <div className="
                        bg-blue-50
                        rounded-xl
                        p-4
                        border
                        border-blue-100
                    ">

                        <p className="
                            text-sm
                            text-gray-500
                            mb-1
                        ">
                            Date de naissance
                        </p>

                        <p className="
                            font-semibold
                            text-gray-900
                        ">
                            {patient.date_naissance
    ? new Date(patient.date_naissance).toLocaleDateString("fr-FR")
    : "-"}
                        </p>

                    </div>


                    {/* SEXE */}

                    <div className="
                        bg-blue-50
                        rounded-xl
                        p-4
                        border
                        border-blue-100
                    ">

                        <p className="
                            text-sm
                            text-gray-500
                            mb-1
                        ">
                            Sexe
                        </p>

                        <p className="
                            font-semibold
                            text-gray-900
                        ">
                            {patient.sexe || "-"}
                        </p>

                    </div>


                    {/* TÉLÉPHONE */}

                    <div className="
                        bg-blue-50
                        rounded-xl
                        p-4
                        border
                        border-blue-100
                    ">

                        <p className="
                            text-sm
                            text-gray-500
                            mb-1
                        ">
                            Téléphone
                        </p>

                        <p className="
                            font-semibold
                            text-gray-900
                        ">
                            {patient.telephone || "-"}
                        </p>

                    </div>


                    {/* EMAIL */}

                    <div className="
                        bg-blue-50
                        rounded-xl
                        p-4
                        border
                        border-blue-100
                    ">

                        <p className="
                            text-sm
                            text-gray-500
                            mb-1
                        ">
                            Email
                        </p>

                        <p className="
                            font-semibold
                            text-gray-900
                            break-words
                        ">
                            {patient.email || "-"}
                        </p>

                    </div>


                    {/* ADRESSE */}

                    <div className="
                        md:col-span-2
                        bg-blue-50
                        rounded-xl
                        p-4
                        border
                        border-blue-100
                    ">

                        <p className="
                            text-sm
                            text-gray-500
                            mb-1
                        ">
                            Adresse
                        </p>

                        <p className="
                            font-semibold
                            text-gray-900
                        ">
                            {patient.adresse || "-"}
                        </p>

                    </div>


                    {/* GROUPE SANGUIN */}

                    <div className="
                        bg-blue-50
                        rounded-xl
                        p-4
                        border
                        border-blue-100
                    ">

                        <p className="
                            text-sm
                            text-gray-500
                            mb-1
                        ">
                            Groupe sanguin
                        </p>

                        <p className="
                            font-semibold
                            text-blue-800
                        ">
                            {patient.groupe_sanguin || "-"}
                        </p>

                    </div>


                    {/* ALLERGIES */}

                    <div className="
                        bg-blue-50
                        rounded-xl
                        p-4
                        border
                        border-blue-100
                    ">

                        <p className="
                            text-sm
                            text-gray-500
                            mb-1
                        ">
                            Allergies
                        </p>

                        <p className="
                            font-semibold
                            text-gray-900
                        ">
                            {patient.allergies || "Aucune"}
                        </p>

                    </div>


                    {/* MALADIES CHRONIQUES */}

                    <div className="
                        md:col-span-2
                        bg-blue-50
                        rounded-xl
                        p-4
                        border
                        border-blue-100
                    ">

                        <p className="
                            text-sm
                            text-gray-500
                            mb-1
                        ">
                            Maladies chroniques
                        </p>

                        <p className="
                            font-semibold
                            text-gray-900
                        ">
                            {patient.maladies_chroniques || "Aucune"}
                        </p>

                    </div>


                    {/* ANTÉCÉDENTS */}

                    <div className="
                        md:col-span-2
                        bg-blue-50
                        rounded-xl
                        p-4
                        border
                        border-blue-100
                    ">

                        <p className="
                            text-sm
                            text-gray-500
                            mb-1
                        ">
                            Antécédents
                        </p>

                        <p className="
                            font-semibold
                            text-gray-900
                        ">
                            {patient.antecedents || "Aucun"}
                        </p>

                    </div>

                </div>

            </div>

            {/* =================================================
                MODAL ENCAISSEMENT
            ================================================= */}

            {showPaymentModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm"
                    onClick={() => setShowPaymentModal(false)}
                >
                    <div
                        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        {/* En-tête */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-bold text-blue-950">
                                    Encaisser un paiement
                                </h3>

                                <p className="text-xs text-gray-500 mt-0.5">
                                    {patient.nom} {patient.prenom}{" "}
                                    — Patient N° {patient.id}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPaymentModal(false)
                                }
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                                aria-label="Fermer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleEncaisserPayment}
                            className="px-6 py-5 space-y-4"
                        >
                            {/* Montant */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Montant (DT) *
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    required
                                    value={paymentForm.montant}
                                    onChange={(event) =>
                                        setPaymentForm({
                                            ...paymentForm,
                                            montant:
                                                event.target.value,
                                        })
                                    }
                                    placeholder="Ex : 50"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition"
                                />
                            </div>

                            {/* Mode + Statut */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Mode de paiement *
                                    </label>

                                    <select
                                        value={paymentForm.mode_paiement}
                                        onChange={(event) =>
                                            setPaymentForm({
                                                ...paymentForm,
                                                mode_paiement:
                                                    event.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition bg-white"
                                    >
                                        <option>Espèces</option>
                                        <option>Carte bancaire</option>
                                        <option>Chèque</option>
                                        <option>Virement</option>
                                        <option>Autre</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Statut *
                                    </label>

                                    <select
                                        value={paymentForm.statut}
                                        onChange={(event) =>
                                            setPaymentForm({
                                                ...paymentForm,
                                                statut:
                                                    event.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition bg-white"
                                    >
                                        <option>Payé</option>
                                        <option>En attente</option>
                                        <option>Annulé</option>
                                    </select>
                                </div>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Date du paiement
                                </label>

                                <input
                                    type="date"
                                    value={paymentForm.date_paiement}
                                    onChange={(event) =>
                                        setPaymentForm({
                                            ...paymentForm,
                                            date_paiement:
                                                event.target.value,
                                        })
                                    }
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Description
                                </label>

                                <textarea
                                    rows={2}
                                    value={paymentForm.description}
                                    onChange={(event) =>
                                        setPaymentForm({
                                            ...paymentForm,
                                            description:
                                                event.target.value,
                                        })
                                    }
                                    placeholder="Ex : Consultation, analyse... (optionnel)"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition resize-none"
                                />
                            </div>

                            {/* Erreur */}
                            {paymentError && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                    {paymentError}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPaymentModal(false)
                                    }
                                    className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
                                >
                                    Annuler
                                </button>

                                <button
                                    type="submit"
                                    disabled={paymentSaving}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-medium shadow-sm disabled:opacity-60 transition"
                                >
                                    <CreditCard size={16} />

                                    {paymentSaving
                                        ? "Enregistrement..."
                                        : "Encaisser le paiement"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default PatientDetails;
