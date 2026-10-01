import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
    CalendarDays,
    MessageSquare,
    MessageSquarePlus,
    MessageCircle,
    Search,
    Send,
    X,
    AlertCircle,
} from "lucide-react";
import { signalerLectureMessages } from "../services/messagesNonLus";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

/* ------------------------------------------------------------------
   Jeton d'authentification (localStorage PUIS sessionStorage)
------------------------------------------------------------------ */
function getToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("auth_token") ||
        localStorage.getItem("userToken") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("access_token")
    );
}

function authHeaders() {
    return {
        Authorization: `Bearer ${getToken()}`,
        Accept: "application/json",
    };
}

/* ------------------------------------------------------------------
   Utilitaires d'affichage
------------------------------------------------------------------ */
function nomComplet(c) {
    if (!c) return "Contact";
    const nom = c.name || `${c.prenom || ""} ${c.nom || ""}`.trim();
    return nom || c.email || "Contact";
}

function initiale(c) {
    const full = nomComplet(c);
    return (full.charAt(0) || "C").toUpperCase();
}

const ROLE_LABELS = {
    medecin: "Médecin",
    médecin: "Médecin",
    doctor: "Médecin",
    patient: "Patient",
    secretaire: "Secrétaire",
    secrétaire: "Secrétaire",
    secretary: "Secrétaire",
    admin: "Administration",
    administrateur: "Administration",
    administration: "Administration",
};

function roleLabel(role) {
    if (!role) return "";
    const key = String(role).toLowerCase().trim();
    return ROLE_LABELS[key] || (key.charAt(0).toUpperCase() + key.slice(1));
}

const ROLE_COLORS = {
    Médecin: "bg-emerald-100 text-emerald-700",
    Patient: "bg-sky-100 text-sky-700",
    Secrétaire: "bg-purple-100 text-purple-700",
    Administration: "bg-amber-100 text-amber-700",
};

function roleBadge(role) {
    return ROLE_COLORS[roleLabel(role)] || "bg-slate-100 text-slate-600";
}

function tempsRelatif(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";

    const maintenant = new Date();
    const minutes = Math.floor((maintenant - d) / 60000);
    const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes()
    ).padStart(2, "0")}`;

    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    if (d.toDateString() === maintenant.toDateString()) return hhmm;

    const hier = new Date(maintenant);
    hier.setDate(maintenant.getDate() - 1);
    if (d.toDateString() === hier.toDateString()) return `hier ${hhmm}`;

    return `${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1
    ).padStart(2, "0")}`;
}

function jourLabel(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";

    const aujourdhui = new Date();
    const hier = new Date();
    hier.setDate(aujourdhui.getDate() - 1);

    if (d.toDateString() === aujourdhui.toDateString()) return "Aujourd'hui";
    if (d.toDateString() === hier.toDateString()) return "Hier";

    return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

/* Clé locale YYYY-MM-DD (indépendante du fuseau pour le filtre date) */
function dateKey(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;
}

/* Date du dernier message d'un contact, SI l'API la fournit (champ optionnel).
   L'API /mes-contacts documentée ne renvoie que { id, name, email, role } :
   en l'absence de ces champs, aucune date de dernier message n'est connue. */
function dateDernierMessage(c) {
    if (!c) return "";
    return (
        c.last_at ||
        c.last_message_at ||
        c.last_message?.created_at ||
        c.dernier_message?.created_at ||
        ""
    );
}

function tempsDernierMessage(c) {
    const raw = dateDernierMessage(c);
    if (!raw) return 0;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

/* Contact considéré comme patient : role/type explicite, sinon contact sans
   rôle (liste de contacts de l'espace médecin -> patients). */
function estPatient(c) {
    if (!c) return false;
    const role = String(c.role || c.type || "").toLowerCase().trim();
    if (!role) return true;
    return role.includes("patient");
}

/**
 * Messagerie interne réutilisable (médecin <-> patient).
 *  - contacts : GET  /mes-contacts
 *  - fil       : GET  /messages/conversation/{contactUserId}
 *  - envoi     : POST /messages/send  { receiver_id, content }
 * Filtre des messages par date (côté client).
 *
 * `filtreRoles` : rôles à conserver dans la liste des contacts
 * (ex. ["patient"] n'affiche que les patients). null = tous les contacts
 * renvoyés par l'API, ce qui permet à un même espace de séparer ses
 * canaux (patients d'un côté, secrétariat de l'autre).
 */
export default function MessagerieInterne({
    titre = "Messagerie",
    filtreRoles = null,
}) {
    const [contacts, setContacts] = useState([]);
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState("");
    const [messages, setMessages] = useState([]);
    const [dateFilter, setDateFilter] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [loadingThread, setLoadingThread] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [pickerOpen, setPickerOpen] = useState(false);
    const [recherchePatient, setRecherchePatient] = useState("");
    const [afficherTout, setAfficherTout] = useState(false);

    const threadEndRef = useRef(null);
    const attemptedReadRef = useRef(new Set());

    /* ---------- Chargement des contacts ---------- */
    const loadContacts = useCallback(async (silent = false) => {
        if (!silent) setLoadingContacts(true);
        try {
            const res = await axios.get(`${API_URL}/mes-contacts`, {
                headers: authHeaders(),
            });
            const data = Array.isArray(res.data?.data)
                ? res.data.data
                : Array.isArray(res.data)
                ? res.data
                : [];
            setContacts(data);
            setError("");
            if (data.length > 0) {
                setSelected((prev) => prev || data[0]);
            }
        } catch (err) {
            console.error("Erreur chargement des contacts :", err);
            if (!silent) {
                setError(
                    err.response?.data?.message ||
                        "Impossible de charger vos contacts."
                );
            }
        } finally {
            if (!silent) setLoadingContacts(false);
        }
    }, []);

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    /* ---------- Marquage « lu » (best effort, ignoré si non supporté) ---------- */
    const marquerCommeLu = useCallback((liste, contactId) => {
        if (!Array.isArray(liste) || !contactId) return;
        liste
            .filter(
                (m) =>
                    Number(m.sender_id) === Number(contactId) &&
                    m.is_read !== undefined &&
                    !m.is_read &&
                    !attemptedReadRef.current.has(m.id)
            )
            .forEach((m) => {
                attemptedReadRef.current.add(m.id);
                axios
                    .post(
                        `${API_URL}/messages/${m.id}/read`,
                        {},
                        { headers: authHeaders() }
                    )
                    .catch(() => {
                        /* API non disponible : on ignore silencieusement */
                    });
            });

        // Les messages reçus viennent d'être marqués comme lus :
        // les compteurs de non-lus se rafraîchissent immédiatement.
        signalerLectureMessages();
    }, []);

    /* ---------- Chargement du fil ---------- */
    const loadThread = useCallback(
        async (silent = false) => {
            if (!selected) {
                setMessages([]);
                return;
            }
            if (!silent) setLoadingThread(true);
            try {
                const res = await axios.get(
                    `${API_URL}/messages/conversation/${selected.id}`,
                    { headers: authHeaders() }
                );
                const data = Array.isArray(res.data?.data)
                    ? res.data.data
                    : Array.isArray(res.data)
                    ? res.data
                    : [];
                setMessages(data);
                setError("");
                marquerCommeLu(data, selected.id);
            } catch (err) {
                console.error("Erreur chargement de la conversation :", err);
                if (!silent) {
                    setError(
                        err.response?.data?.message ||
                            "Impossible de charger la conversation."
                    );
                    setMessages([]);
                }
            } finally {
                if (!silent) setLoadingThread(false);
            }
        },
        [selected, marquerCommeLu]
    );

    useEffect(() => {
        loadThread();
    }, [loadThread]);

    /* ---------- Rechargement automatique toutes les 15 s ---------- */
    useEffect(() => {
        if (!selected) return undefined;
        const interval = setInterval(() => loadThread(true), 15000);
        return () => clearInterval(interval);
    }, [selected, loadThread]);

    /* ---------- Défilement automatique ---------- */
    useEffect(() => {
        if (threadEndRef.current) {
            threadEndRef.current.scrollIntoView({ block: "end" });
        }
    }, [messages, selected]);

    /* ---------- Envoi ---------- */
    const handleSend = async (e) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content || !selected || sending) return;

        setSending(true);
        try {
            const res = await axios.post(
                `${API_URL}/messages/send`,
                { receiver_id: selected.id, content },
                { headers: authHeaders() }
            );

            const sent = res.data?.data;
            if (sent) {
                setMessages((prev) =>
                    dateFilter && dateKey(sent.created_at) !== dateFilter
                        ? prev
                        : [...prev, sent]
                );
            } else {
                await loadThread(true);
            }
            setNewMessage("");
            setError("");

            // Le destinataire a un nouveau message non lu
            signalerLectureMessages();
        } catch (err) {
            console.error("Erreur envoi message :", err);
            setError(
                err.response?.data?.message ||
                    "L'envoi du message a échoué."
            );
        } finally {
            setSending(false);
        }
    };

    /* ---------- Contacts visibles (filtre par rôle optionnel) ---------- */
    const contactsVisibles =
        Array.isArray(filtreRoles) && filtreRoles.length > 0
            ? contacts.filter((c) => {
                  const role = String(c.role || c.type || "")
                      .toLowerCase()
                      .trim();
                  return filtreRoles.some((r) =>
                      role.includes(String(r).toLowerCase())
                  );
              })
            : contacts;

    /* ---------- Contacts filtrés / triés ---------- */
    const contactsFiltres = contactsVisibles
        .filter((c) => {
            const q = search.trim().toLowerCase();
            if (!q) return true;
            return (
                nomComplet(c).toLowerCase().includes(q) ||
                (c.email || "").toLowerCase().includes(q)
            );
        })
        .slice()
        .sort((a, b) =>
            nomComplet(a).localeCompare(nomComplet(b), "fr")
        );

    /* ---------- Patients (sélecteur « Nouvelle discussion ») ---------- */
    const patients = contactsVisibles.filter(estPatient);

    const patientsFiltres = patients
        .filter((p) => {
            const q = recherchePatient.trim().toLowerCase();
            if (!q) return true;
            return (
                nomComplet(p).toLowerCase().includes(q) ||
                (p.email || "").toLowerCase().includes(q)
            );
        })
        .sort((a, b) => nomComplet(a).localeCompare(nomComplet(b), "fr"));

    /* ---------- Discussions : tri, filtre date, limite à 5 ---------- */
    /* La date du dernier message n'existe QUE si l'API fournit un de ces
       champs optionnels ; sinon on garde l'ordre existant (5 premiers). */
    const aDateDernier = contactsVisibles.some((c) => dateDernierMessage(c));

    const discussionsTriees = aDateDernier
        ? contactsFiltres
              .slice()
              .sort((a, b) => tempsDernierMessage(b) - tempsDernierMessage(a))
        : contactsFiltres;

    const discussionsAffichees = afficherTout
        ? discussionsTriees
        : discussionsTriees.slice(0, 5);

    const ouvrirDiscussion = (p) => {
        if (!p) return;
        setSelected(p);
        setContacts((prev) =>
            prev.map((x) =>
                Number(x.id) === Number(p.id) ? { ...x, unread: 0 } : x
            )
        );
        setPickerOpen(false);
        setRecherchePatient("");
        setDateFilter("");
    };

    const totalUnread = contactsVisibles.reduce(
        (total, c) => total + (Number(c.unread) || 0),
        0
    );

    /* Messages entrants = envoyés par le contact sélectionné */
    const isMine = (msg) =>
        selected && Number(msg.sender_id) !== Number(selected.id);

    /* Filtre par date (client) */
    const messagesAffiches = dateFilter
        ? messages.filter((m) => dateKey(m.created_at) === dateFilter)
        : messages;

    const isSameContact = (a, b) =>
        a && b && Number(a.id) === Number(b.id);

    return (
        <div className="flex h-full">
            {/* ============ LISTE DES CONTACTS ============ */}
            <div className="w-2/5 min-w-[220px] bg-white border-r border-slate-200 flex flex-col h-full">
                <div className="p-3 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                            <MessageCircle size={14} className="text-blue-600" />
                            {titre}
                        </h3>
                        {totalUnread > 0 && (
                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                                {totalUnread} non lu{totalUnread > 1 ? "s" : ""}
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <Search
                            size={13}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un contact..."
                            className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Bouton « Nouvelle discussion » */}
                    <button
                        type="button"
                        onClick={() => {
                            setPickerOpen((v) => !v);
                            setRecherchePatient("");
                        }}
                        className="mt-2 w-full inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer"
                    >
                        <MessageSquarePlus size={14} />
                        Nouvelle discussion
                    </button>

                    {pickerOpen && (
                        <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="px-2.5 py-2 border-b border-slate-100">
                                <p className="text-[11px] font-semibold text-slate-600 mb-1.5">
                                    Choisir un patient
                                </p>
                                <div className="relative">
                                    <Search
                                        size={12}
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        type="text"
                                        value={recherchePatient}
                                        onChange={(e) =>
                                            setRecherchePatient(e.target.value)
                                        }
                                        placeholder="Rechercher un patient..."
                                        className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-emerald-600"
                                    />
                                </div>
                            </div>
                            <div className="max-h-52 overflow-y-auto">
                                {patients.length === 0 ? (
                                    <p className="px-3 py-3 text-center text-[11px] text-slate-400">
                                        Aucun patient disponible.
                                    </p>
                                ) : patientsFiltres.length === 0 ? (
                                    <p className="px-3 py-3 text-center text-[11px] text-slate-400">
                                        Aucun patient ne correspond.
                                    </p>
                                ) : (
                                    patientsFiltres.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => ouvrirDiscussion(p)}
                                            className="w-full px-3 py-2 flex items-center gap-2 text-left transition hover:bg-emerald-50 cursor-pointer"
                                        >
                                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 bg-emerald-100 text-emerald-700">
                                                {initiale(p)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold text-slate-800 truncate">
                                                    {nomComplet(p)}
                                                </p>
                                                {p.email && (
                                                    <p className="text-[10px] text-slate-400 truncate">
                                                        {p.email}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Discussions affichées : 5 dernières par défaut */}
                {!loadingContacts && discussionsTriees.length > 0 && (
                    <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-white">
                        <span className="text-[10px] text-slate-400">
                            {afficherTout
                                ? "Toutes les discussions"
                                : "5 dernières discussions"}
                        </span>
                        {discussionsTriees.length > 5 && (
                            <button
                                type="button"
                                onClick={() => setAfficherTout((v) => !v)}
                                className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                            >
                                {afficherTout
                                    ? "Voir les 5 dernières"
                                    : "Voir toutes les discussions"}
                            </button>
                        )}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    {loadingContacts ? (
                        <p className="p-4 text-center text-xs text-slate-400">
                            Chargement des contacts...
                        </p>
                    ) : discussionsAffichees.length === 0 ? (
                        <p className="p-4 text-center text-xs text-slate-400">
                            Aucun contact disponible.
                        </p>
                    ) : (
                        discussionsAffichees.map((c) => {
                            const active = isSameContact(selected, c);
                            const unread = Number(c.unread) || 0;
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                        setSelected(c);
                                        setContacts((prev) =>
                                            prev.map((x) =>
                                                Number(x.id) === Number(c.id)
                                                    ? { ...x, unread: 0 }
                                                    : x
                                            )
                                        );
                                    }}
                                    className={`w-full px-3 py-2 flex items-center gap-2.5 text-left transition hover:bg-slate-50 cursor-pointer ${
                                        active ? "bg-blue-50/70" : ""
                                    }`}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                            active
                                                ? "bg-blue-600 text-white"
                                                : "bg-slate-200 text-slate-600"
                                        }`}
                                    >
                                        {initiale(c)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p
                                                className={`text-xs truncate ${
                                                    unread
                                                        ? "font-bold text-slate-900"
                                                        : "font-semibold text-slate-800"
                                                }`}
                                            >
                                                {nomComplet(c)}
                                            </p>
                                            {c.last_at && (
                                                <span className="shrink-0 text-[9px] text-slate-400">
                                                    {tempsRelatif(c.last_at)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mt-0.5">
                                            {c.role ? (
                                                <span
                                                    className={`inline-block px-1.5 py-px rounded-full text-[9px] font-bold ${roleBadge(
                                                        c.role
                                                    )}`}
                                                >
                                                    {roleLabel(c.role)}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 truncate">
                                                    {c.email || ""}
                                                </span>
                                            )}
                                            {unread > 0 && (
                                                <span className="shrink-0 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                                                    {unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ============ FIL DE DISCUSSION ============ */}
            <div className="flex-1 h-full flex flex-col bg-slate-50 min-w-0">
                {!selected ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <MessageSquare size={30} className="text-slate-300" />
                        <p className="text-sm">
                            Sélectionnez un contact pour démarrer la discussion.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* En-tête de conversation + filtre par date */}
                        <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">
                                    {nomComplet(selected)}
                                </p>
                                {selected.role && (
                                    <p className="text-[10px] text-slate-400">
                                        {roleLabel(selected.role)}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <CalendarDays size={14} className="text-slate-400" />
                                <input
                                    type="date"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    title="Filtrer les messages par date"
                                    className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-xs text-slate-600 outline-none focus:border-blue-500 cursor-pointer"
                                />
                                {dateFilter && (
                                    <button
                                        type="button"
                                        onClick={() => setDateFilter("")}
                                        title="Effacer le filtre de date"
                                        className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Bandeau d'erreur discret */}
                        {error && (
                            <div className="px-4 py-2 bg-rose-50 border-b border-rose-100 flex items-center gap-2 text-[11px] font-medium text-rose-700">
                                <AlertCircle size={13} />
                                <span className="flex-1">{error}</span>
                                <button
                                    type="button"
                                    onClick={() => setError("")}
                                    className="text-rose-400 hover:text-rose-600 cursor-pointer"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 px-4 py-3 overflow-y-auto space-y-2.5">
                            {loadingThread ? (
                                <p className="text-center text-xs text-slate-400 py-6">
                                    Chargement des messages...
                                </p>
                            ) : messagesAffiches.length === 0 ? (
                                <p className="text-center text-xs text-slate-400 py-6">
                                    {dateFilter
                                        ? "Aucun message à cette date."
                                        : "Aucun message échangé. Écrivez le premier message !"}
                                </p>
                            ) : (
                                messagesAffiches.map((msg, idx) => {
                                    const mine = isMine(msg);
                                    const heure = dateKey(msg.created_at)
                                        ? `${String(
                                              new Date(msg.created_at).getHours()
                                          ).padStart(2, "0")}:${String(
                                              new Date(msg.created_at).getMinutes()
                                          ).padStart(2, "0")}`
                                        : "";
                                    const jour = jourLabel(msg.created_at);
                                    const jourPrecedent =
                                        idx > 0
                                            ? jourLabel(
                                                  messagesAffiches[idx - 1].created_at
                                              )
                                            : null;
                                    const nouveauJour =
                                        jour && jour !== jourPrecedent;

                                    return (
                                        <React.Fragment
                                            key={msg.id || `${msg.created_at}-${idx}`}
                                        >
                                            {nouveauJour && (
                                                <div className="flex items-center gap-3 py-2">
                                                    <span className="flex-1 h-px bg-slate-200" />
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                        {jour}
                                                    </span>
                                                    <span className="flex-1 h-px bg-slate-200" />
                                                </div>
                                            )}

                                            <div
                                                className={`flex ${
                                                    mine ? "justify-end" : "justify-start"
                                                }`}
                                            >
                                                <div
                                                    className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm shadow-sm ${
                                                        mine
                                                            ? "bg-blue-600 text-white rounded-br-sm"
                                                            : "bg-white text-slate-700 border border-slate-200 rounded-bl-sm"
                                                    }`}
                                                >
                                                    <p className="whitespace-pre-wrap break-words">
                                                        {msg.content}
                                                    </p>
                                                    {heure && (
                                                        <p
                                                            className={`mt-1 text-[10px] ${
                                                                mine
                                                                    ? "text-blue-100"
                                                                    : "text-slate-400"
                                                            }`}
                                                        >
                                                            {heure}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })
                            )}
                            <div ref={threadEndRef} />
                        </div>

                        {/* Saisie */}
                        <form
                            onSubmit={handleSend}
                            className="p-3 bg-white border-t border-slate-200 flex gap-2"
                        >
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Écrivez un message..."
                                className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                            />
                            <button
                                type="submit"
                                disabled={sending || !newMessage.trim()}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <Send size={14} />
                                Envoyer
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
