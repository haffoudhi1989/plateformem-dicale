import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { filtrerSpecialites } from "../services/specialites";
import {
    Stethoscope,
    User,
    Mail,
    Phone,
    MapPin,
    Hospital,
    ArrowLeft,
    Camera,
    Save,
    Trash2,
    PencilLine
} from "lucide-react";

function EditDoctor() {

    const { id } = useParams();

    const navigate = useNavigate();

    const API = "http://localhost:8000/api/medecins";

    const [nom, setNom] = useState("");
    const [prenom, setPrenom] = useState("");
    const [telephone, setTelephone] = useState("");
    const [email, setEmail] = useState("");
    const [adresse, setAdresse] = useState("");
    const [specialiteId, setSpecialiteId] = useState("");

    const [specialites, setSpecialites] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);


    // =====================================
    // Photo du médecin
    // =====================================

    const API_ROOT = "http://127.0.0.1:8000";

    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [supprimerPhoto, setSupprimerPhoto] = useState(false);

    const inputPhotoRef = useRef(null);

    const handlePhoto = (e) => {

        const fichier = e.target.files?.[0];

        if (!fichier) return;

        if (
            !["image/jpeg", "image/png", "image/webp"].includes(
                fichier.type
            )
        ) {
            alert("Format non pris en charge (JPG, PNG ou WebP).");
            e.target.value = "";
            return;
        }

        if (fichier.size > 4 * 1024 * 1024) {
            alert("La photo ne doit pas dépasser 4 Mo.");
            e.target.value = "";
            return;
        }

        setPhoto(fichier);
        setPhotoPreview(URL.createObjectURL(fichier));
        setSupprimerPhoto(false);
    };

    const retirerPhoto = () => {

        setPhoto(null);
        setPhotoPreview(null);
        setSupprimerPhoto(true);

        if (inputPhotoRef.current) {
            inputPhotoRef.current.value = "";
        }
    };


    // =====================================
    // Charger les spécialités
    // =====================================

    const getSpecialites = async () => {

        try {

            const response = await axios.get(
                "http://localhost:8000/api/specialites"
            );

            const data =
                response.data.data ||
                response.data;

            // Seules les spécialités autorisées sont proposées
            // (voir src/services/specialites.js)
            setSpecialites(filtrerSpecialites(data));

        } catch (error) {

            console.error(
                "Erreur spécialités :",
                error.response?.data || error
            );

        }

    };


    // =====================================
    // Charger médecin
    // =====================================

    const getDoctor = async () => {

        try {

            const response = await axios.get(
                `${API}/${id}`
            );

            const medecin =
                response.data.data ||
                response.data;


            setNom(
                medecin.nom || ""
            );

            setPrenom(
                medecin.prenom || ""
            );

            setTelephone(
                medecin.telephone || ""
            );

            setEmail(
                medecin.email || ""
            );

            setAdresse(
                medecin.adresse || ""
            );


            // Récupérer specialite_id

            if (medecin.specialite_id) {

                setSpecialiteId(
                    String(medecin.specialite_id)
                );

            } else if (
                medecin.specialite &&
                typeof medecin.specialite === "object"
            ) {

                setSpecialiteId(
                    String(medecin.specialite.id)
                );

            }


            // Photo existante

            setPhotoPreview(
                medecin.photo
                    ? `${API_ROOT}/storage/${medecin.photo}`
                    : null
            );

            setSupprimerPhoto(false);
            setPhoto(null);

        } catch (error) {

            console.error(
                "Erreur chargement médecin :",
                error.response?.data || error
            );

            alert(
                "Impossible de charger le médecin."
            );

            navigate("/admin/doctors");

        } finally {

            setLoading(false);

        }

    };


    // =====================================
    // Chargement initial
    // =====================================

    useEffect(() => {

        getDoctor();
        getSpecialites();

    }, [id]);


    // =====================================
    // Modifier médecin
    // =====================================

    const handleSubmit = async (e) => {

        e.preventDefault();


        if (
            nom.trim() === "" ||
            prenom.trim() === ""
        ) {

            alert(
                "Le nom et le prénom sont obligatoires."
            );

            return;

        }


        try {

            setSaving(true);


            const data = new FormData();

            data.append("nom", nom.trim());
            data.append("prenom", prenom.trim());
            data.append("telephone", telephone.trim());
            data.append("email", email.trim());
            data.append("adresse", adresse.trim());

            if (specialiteId) {
                data.append("specialite_id", String(specialiteId));
            }

            // Photo : nouvelle image envoyée ou suppression explicite
            if (photo) {
                data.append("photo", photo);
            }

            if (supprimerPhoto) {
                data.append("remove_photo", "1");
            }

            // Laravel reçoit le PUT via POST multipart
            data.append("_method", "PUT");

            const token =
                localStorage.getItem("token") ||
                sessionStorage.getItem("token");

            await axios.post(
                `${API}/${id}`,
                data,
                {
                    headers: {
                        Accept: "application/json",
                        ...(token
                            ? { Authorization: `Bearer ${token}` }
                            : {})
                    }
                }
            );


            alert(
                "Médecin modifié avec succès."
            );


            navigate("/admin/doctors");


        } catch (error) {

            console.error(
                "Erreur modification médecin :",
                error.response?.data || error
            );


            // Message précis renvoyé par l'API (validation, session expirée…)
            const details = error.response?.data;

            let messageServeur = "";

            if (details?.errors) {

                const premier = Object.values(details.errors)[0];

                messageServeur = Array.isArray(premier)
                    ? premier[0]
                    : premier;

            } else if (details?.message) {

                messageServeur = details.message;
            }

            alert(
                messageServeur
                    ? `Erreur : ${messageServeur}`
                    : "Erreur lors de la modification du médecin."
            );

        } finally {

            setSaving(false);

        }

    };


    // =====================================
    // Chargement
    // =====================================

    if (loading) {

        return (

            <div className="
                min-h-[500px]
                flex
                items-center
                justify-center
                bg-gray-50
            ">

                <div className="text-center">

                    <div className="
                        w-12
                        h-12
                        border-4
                        border-blue-100
                        border-t-blue-700
                        rounded-full
                        animate-spin
                        mx-auto
                    " />

                    <p className="
                        mt-4
                        text-sm
                        text-gray-500
                        font-medium
                    ">
                        Chargement du médecin...
                    </p>

                </div>

            </div>

        );

    }


    return (

        <div className="
            min-h-full
            bg-gray-50
        ">

            {/* BANNIÈRE */}
            <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <PencilLine size={26} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                            Modifier le médecin
                        </h1>
                        <p className="text-blue-100 text-sm mt-0.5">
                            Modifiez les informations du médecin sélectionné.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() =>
                            navigate("/admin/doctors")
                        }
                        className="
                            hidden
                            sm:flex
                            items-center
                            gap-2
                            px-4
                            py-2.5
                            rounded-xl
                            border
                            border-gray-200
                            bg-white
                            text-gray-600
                            text-sm
                            font-medium
                            hover:bg-blue-50
                            hover:text-blue-700
                            hover:border-blue-200
                            transition
                        "
                    >

                        <ArrowLeft size={17} />

                        Retour

                    </button>
                </div>
            </div>



            {/* =====================================
                FORMULAIRE
            ===================================== */}

            <div className="

            ">

                <div className="
                    bg-white
                    rounded-2xl
                    border
                    border-gray-200
                    shadow-sm
                    overflow-hidden
                ">


                    {/* HEADER */}

                    <div className="
                        px-5
                        md:px-7
                        py-5
                        border-b
                        border-gray-200
                        bg-gradient-to-r
                        from-blue-50
                        to-white
                    ">

                        <div className="
                            flex
                            items-center
                            gap-3
                        ">

                            <div className="
                                w-11
                                h-11
                                rounded-xl
                                bg-blue-700
                                text-white
                                flex
                                items-center
                                justify-center
                                shadow-sm
                            ">

                                <Stethoscope size={22} />

                            </div>


                            <div>

                                <h2 className="
                                    text-base
                                    md:text-lg
                                    font-bold
                                    text-gray-900
                                ">

                                    Informations du médecin

                                </h2>


                                <p className="
                                    text-xs
                                    md:text-sm
                                    text-gray-500
                                    mt-0.5
                                ">

                                    Mettez à jour les informations ci-dessous.

                                </p>

                            </div>

                        </div>

                    </div>


                    {/* FORM */}

                    <form
                        onSubmit={handleSubmit}
                        className="p-5 md:p-7"
                    >

                        {/* PHOTO DU MÉDECIN */}

                        <div className="flex items-center gap-5 mb-6">

                            <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center">

                                {photoPreview ? (

                                    <img
                                        src={photoPreview}
                                        alt="Photo du médecin"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                        }}
                                    />

                                ) : (

                                    <Stethoscope
                                        size={30}
                                        className="text-slate-300"
                                    />

                                )}

                            </div>

                            <div className="space-y-2">

                                <label className="block text-sm font-semibold text-gray-700">
                                    Photo du médecin
                                </label>

                                <div className="flex flex-wrap items-center gap-3">

                                    <input
                                        ref={inputPhotoRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handlePhoto}
                                        className="hidden"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            inputPhotoRef.current?.click()
                                        }
                                        className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition cursor-pointer"
                                    >
                                        <Camera size={17} />
                                        {photoPreview
                                            ? "Changer la photo"
                                            : "Choisir une photo"}
                                    </button>

                                    {photoPreview && (

                                        <button
                                            type="button"
                                            onClick={retirerPhoto}
                                            className="inline-flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition cursor-pointer"
                                        >
                                            <Trash2 size={17} />
                                            Supprimer
                                        </button>

                                    )}

                                </div>

                                <p className="text-xs text-slate-400">
                                    JPG, PNG ou WebP — 4 Mo maximum.
                                </p>

                            </div>

                        </div>

                        <div className="
                            grid
                            grid-cols-1
                            md:grid-cols-2
                            gap-5
                        ">


                            {/* NOM */}

                            <div>

                                <label className="
                                    flex
                                    items-center
                                    gap-2
                                    text-sm
                                    font-semibold
                                    text-gray-700
                                    mb-2
                                ">

                                    <User
                                        size={16}
                                        className="text-blue-600"
                                    />

                                    Nom

                                </label>


                                <input
                                    type="text"
                                    value={nom}
                                    onChange={(e) =>
                                        setNom(e.target.value)
                                    }
                                    className="
                                        w-full
                                        h-12
                                        px-4
                                        rounded-xl
                                        border
                                        border-gray-200
                                        bg-gray-50
                                        text-gray-800
                                        outline-none
                                        transition
                                        focus:bg-white
                                        focus:border-blue-500
                                        focus:ring-4
                                        focus:ring-blue-50
                                    "
                                    placeholder="Nom"
                                />

                            </div>


                            {/* PRENOM */}

                            <div>

                                <label className="
                                    flex
                                    items-center
                                    gap-2
                                    text-sm
                                    font-semibold
                                    text-gray-700
                                    mb-2
                                ">

                                    <User
                                        size={16}
                                        className="text-blue-600"
                                    />

                                    Prénom

                                </label>


                                <input
                                    type="text"
                                    value={prenom}
                                    onChange={(e) =>
                                        setPrenom(e.target.value)
                                    }
                                    className="
                                        w-full
                                        h-12
                                        px-4
                                        rounded-xl
                                        border
                                        border-gray-200
                                        bg-gray-50
                                        text-gray-800
                                        outline-none
                                        transition
                                        focus:bg-white
                                        focus:border-blue-500
                                        focus:ring-4
                                        focus:ring-blue-50
                                    "
                                    placeholder="Prénom"
                                />

                            </div>


                            {/* SPECIALITE */}

                            <div className="md:col-span-2">

                                <label className="
                                    flex
                                    items-center
                                    gap-2
                                    text-sm
                                    font-semibold
                                    text-gray-700
                                    mb-2
                                ">

                                    <Hospital
                                        size={16}
                                        className="text-blue-600"
                                    />

                                    Spécialité

                                </label>


                                <select
                                    value={specialiteId}
                                    onChange={(e) =>
                                        setSpecialiteId(
                                            e.target.value
                                        )
                                    }
                                    className="
                                        w-full
                                        h-12
                                        px-4
                                        rounded-xl
                                        border
                                        border-gray-200
                                        bg-gray-50
                                        text-gray-800
                                        outline-none
                                        transition
                                        focus:bg-white
                                        focus:border-blue-500
                                        focus:ring-4
                                        focus:ring-blue-50
                                    "
                                >

                                    <option value="">
                                        Sélectionner une spécialité
                                    </option>


                                    {specialites.map(
                                        (specialite) => (

                                            <option
                                                key={specialite.id}
                                                value={specialite.id}
                                            >

                                                {specialite.nom}

                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            {/* TELEPHONE */}

                            <div>

                                <label className="
                                    flex
                                    items-center
                                    gap-2
                                    text-sm
                                    font-semibold
                                    text-gray-700
                                    mb-2
                                ">

                                    <Phone
                                        size={16}
                                        className="text-blue-600"
                                    />

                                    Téléphone

                                </label>


                                <input
                                    type="text"
                                    value={telephone}
                                    onChange={(e) =>
                                        setTelephone(
                                            e.target.value
                                        )
                                    }
                                    className="
                                        w-full
                                        h-12
                                        px-4
                                        rounded-xl
                                        border
                                        border-gray-200
                                        bg-gray-50
                                        text-gray-800
                                        outline-none
                                        transition
                                        focus:bg-white
                                        focus:border-blue-500
                                        focus:ring-4
                                        focus:ring-blue-50
                                    "
                                    placeholder="Téléphone"
                                />

                            </div>


                            {/* EMAIL */}

                            <div>

                                <label className="
                                    flex
                                    items-center
                                    gap-2
                                    text-sm
                                    font-semibold
                                    text-gray-700
                                    mb-2
                                ">

                                    <Mail
                                        size={16}
                                        className="text-blue-600"
                                    />

                                    Email

                                </label>


                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    className="
                                        w-full
                                        h-12
                                        px-4
                                        rounded-xl
                                        border
                                        border-gray-200
                                        bg-gray-50
                                        text-gray-800
                                        outline-none
                                        transition
                                        focus:bg-white
                                        focus:border-blue-500
                                        focus:ring-4
                                        focus:ring-blue-50
                                    "
                                    placeholder="Email"
                                />

                            </div>


                            {/* ADRESSE */}

                            <div className="md:col-span-2">

                                <label className="
                                    flex
                                    items-center
                                    gap-2
                                    text-sm
                                    font-semibold
                                    text-gray-700
                                    mb-2
                                ">

                                    <MapPin
                                        size={16}
                                        className="text-blue-600"
                                    />

                                    Adresse

                                </label>


                                <textarea
                                    value={adresse}
                                    onChange={(e) =>
                                        setAdresse(
                                            e.target.value
                                        )
                                    }
                                    rows="3"
                                    className="
                                        w-full
                                        px-4
                                        py-3
                                        rounded-xl
                                        border
                                        border-gray-200
                                        bg-gray-50
                                        text-gray-800
                                        outline-none
                                        transition
                                        resize-none
                                        focus:bg-white
                                        focus:border-blue-500
                                        focus:ring-4
                                        focus:ring-blue-50
                                    "
                                    placeholder="Adresse"
                                />

                            </div>

                        </div>


                        {/* =====================================
                            BOUTONS
                        ===================================== */}

                        <div className="
                            border-t
                            border-gray-200
                            mt-7
                            pt-6
                        ">

                            <div className="
                                flex
                                flex-col-reverse
                                sm:flex-row
                                sm:justify-end
                                gap-3
                            ">


                                {/* ANNULER */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/admin/doctors"
                                        )
                                    }
                                    className="
                                        w-full
                                        sm:w-auto
                                        px-6
                                        h-12
                                        rounded-xl
                                        border
                                        border-gray-200
                                        bg-white
                                        text-gray-600
                                        font-semibold
                                        hover:bg-gray-50
                                        hover:border-gray-300
                                        transition
                                    "
                                >

                                    Annuler

                                </button>


                                {/* MODIFIER */}

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="
                                        w-full
                                        sm:w-auto
                                        px-6
                                        h-12
                                        rounded-xl
                                        bg-blue-700
                                        hover:bg-blue-800
                                        active:bg-blue-900
                                        disabled:bg-gray-400
                                        disabled:cursor-not-allowed
                                        text-white
                                        font-semibold
                                        shadow-sm
                                        hover:shadow-md
                                        transition
                                        flex
                                        items-center
                                        justify-center
                                        gap-2
                                    "
                                >

                                    {saving ? (

                                        <>

                                            <span className="
                                                w-5
                                                h-5
                                                border-2
                                                border-white/40
                                                border-t-white
                                                rounded-full
                                                animate-spin
                                            " />

                                            Modification...

                                        </>

                                    ) : (

                                        <>

                                            <Save size={18} />

                                            Enregistrer les modifications

                                        </>

                                    )}

                                </button>

                            </div>

                        </div>

                    </form>

                </div>

            </div>

        </div>
    );
}

export default EditDoctor;
