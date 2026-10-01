import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
    CalendarDays,
    MessageSquare,
    Search,
    Send,
    X
} from "lucide-react";
import { signalerLectureMessages } from "../services/messagesNonLus";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

const GROUPE_ORDER = ["Médecins", "Secrétaires", "Administration"];

const GROUPE_COLORS = {
    Médecins: "bg-blue-100 text-blue-700",
    Secrétaires: "bg-purple-100 text-purple-700",
    Administration: "bg-amber-100 text-amber-700"
};

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

function nomComplet(c) {
    const prenom = c?.prenom || "";
    const nom = c?.nom || c?.name || "";
    return `${prenom} ${nom}`.trim() || "Contact";
}

function initiale(c) {
    const full = nomComplet(c);
    return (full.charAt(0) || "C").toUpperCase();
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
        year: "numeric"
    });
}

/**
 * Messagerie interne du personnel :
 *  - secrétaire : médecins de son cabinet + administration
 *  - médecin    : secrétaires de son cabinet + administration
 * Filtrage des messages par date.
 */
export default function StaffMessenger({ groupes = null }) {
    const [contacts, setContacts] = useState([]);
    const [me, setMe] = useState(null);
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState("");
    const [messages, setMessages] = useState([]);
    const [dateFilter, setDateFilter] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [loadingThread, setLoadingThread] = useState(false);
    const [sending, setSending] = useState(false);
    const threadEndRef = useRef(null);

    /* ---------- Chargement des contacts ---------- */
    const loadContacts = useCallback(async (silent = false) => {
        if (!silent) setLoadingContacts(true);
        try {
            const res = await axios.get(`${API_URL}/staff/messages/contacts`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = Array.isArray(res.data?.data) ? res.data.data : [];
            setContacts(data);
            setMe(res.data?.me || null);
            if (data.length > 0) {
                setSelected((prev) => prev || data[0]);
            }
        } catch (error) {
            console.error("Erreur chargement contacts internes :", error);
        } finally {
            setLoadingContacts(false);
        }
    }, []);

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    // Rafraîchissement discret des non-lus (sans écran de chargement)
    useEffect(() => {
        const interval = setInterval(() => loadContacts(true), 20000);
        return () => clearInterval(interval);
    }, [loadContacts]);

    /* ---------- Chargement du fil (filtre date côté serveur) ---------- */
    const loadThread = useCallback(async () => {
        if (!selected) {
            setMessages([]);
            return;
        }
        setLoadingThread(true);
        try {
            const params = {
                other_type: selected.type,
                other_id: selected.id
            };
            if (dateFilter) params.date = dateFilter;

            const res = await axios.get(`${API_URL}/staff/messages/conversation`, {
                params,
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = Array.isArray(res.data?.data) ? res.data.data : [];
            setMessages(data);

            // L'ouverture de la discussion vient de marquer ses messages
            // comme lus : les compteurs de non-lus se rafraîchissent aussitôt.
            signalerLectureMessages();
        } catch (error) {
            console.error("Erreur chargement conversation :", error);
            setMessages([]);
        } finally {
            setLoadingThread(false);
        }
    }, [selected, dateFilter]);

    useEffect(() => {
        loadThread();
    }, [loadThread]);

    // Défilement automatique en bas du fil
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
                `${API_URL}/staff/messages/send`,
                {
                    receiver_type: selected.type,
                    receiver_id: selected.id,
                    content
                },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            const sent = res.data?.data;
            if (sent) {
                setMessages((prev) => (dateFilter ? prev : [...prev, sent]));
            }
            setNewMessage("");

            // Le destinataire a un nouveau message non lu
            signalerLectureMessages();
        } catch (error) {
            console.error("Erreur envoi message interne :", error);
        } finally {
            setSending(false);
        }
    };

    /* ---------- Groupes de contacts ---------- */
    const groupesActifs =
        Array.isArray(groupes) && groupes.length > 0 ? groupes : GROUPE_ORDER;

    const groupedContacts = groupesActifs
        .map((groupe) => {
            const duGroupe = contacts.filter((c) => c.groupe === groupe);

            const items = duGroupe
                .filter((c) => {
                    const q = search.trim().toLowerCase();
                    return !q || nomComplet(c).toLowerCase().includes(q);
                })
                .slice()
                .sort((a, b) => {
                    const da = a.last_at ? new Date(a.last_at).getTime() : 0;
                    const db = b.last_at ? new Date(b.last_at).getTime() : 0;
                    if (db !== da) return db - da;
                    return nomComplet(a).localeCompare(nomComplet(b), "fr");
                });

            const unread = duGroupe.reduce(
                (total, c) => total + (c.unread || 0),
                0
            );

            return { groupe, items, unread };
        })
        .filter((g) => g.items.length > 0);

    /* Seuls les contacts réellement affichés sont comptés : un message d'un
       groupe masqué (ex. l'administration quand elle n'est pas exposée) ne
       doit pas gonfler la pastille sans pouvoir être ouvert. */
    const totalUnread = groupedContacts
        .flatMap((groupe) => groupe.items)
        .reduce((total, c) => total + (c.unread || 0), 0);

    const hasAnyContact = groupedContacts.some((g) => g.items.length > 0);

    const isMine = (msg) =>
        me &&
        msg.sender_type === me.type &&
        Number(msg.sender_id) === Number(me.id);

    const isSameContact = (a, b) =>
        a && b && a.type === b.type && Number(a.id) === Number(b.id);

    const groupeBadge = (c) =>
        GROUPE_COLORS[c.groupe] || "bg-slate-100 text-slate-600";

    return (
        <div className="flex h-full">
            {/* ============ LISTE DES CONTACTS ============ */}
            <div className="w-2/5 min-w-[220px] bg-white border-r border-slate-200 flex flex-col h-full">
                <div className="p-3 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="font-bold text-slate-700 text-sm">
                            Messagerie interne
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
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingContacts ? (
                        <p className="p-4 text-center text-xs text-slate-400">
                            Chargement des contacts...
                        </p>
                    ) : !hasAnyContact ? (
                        <p className="p-4 text-center text-xs text-slate-400">
                            Aucun contact disponible.
                        </p>
                    ) : (
                        groupedContacts.map((g) => (
                            <div key={g.groupe}>
                                <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                    <span>{g.groupe}</span>
                                    {g.unread > 0 && (
                                        <span className="px-1.5 py-px rounded-full bg-slate-200 text-slate-600 text-[9px]">
                                            {g.unread}
                                        </span>
                                    )}
                                </p>
                                {g.items.map((c) => {
                                    const active = isSameContact(selected, c);
                                    return (
                                        <button
                                            key={`${c.type}-${c.id}`}
                                            type="button"
                                            onClick={() => {
                                                setSelected(c);
                                                setContacts((prev) =>
                                                    prev.map((x) =>
                                                        x.type === c.type &&
                                                        Number(x.id) ===
                                                            Number(c.id)
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
                                                            c.unread
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
                                                    {c.last_message ? (
                                                        <p
                                                            className={`text-[10px] truncate ${
                                                                c.unread
                                                                    ? "text-slate-600 font-medium"
                                                                    : "text-slate-400"
                                                            }`}
                                                        >
                                                            {c.last_message}
                                                        </p>
                                                    ) : (
                                                        <span
                                                            className={`inline-block px-1.5 py-px rounded-full text-[9px] font-bold ${groupeBadge(c)}`}
                                                        >
                                                            {c.groupe}
                                                        </span>
                                                    )}

                                                    {c.unread > 0 && (
                                                        <span className="shrink-0 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                                                            {c.unread}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ))
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
                        {/* Filtre date (identité du contact non affichée) */}
                        <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-end gap-3">
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

                        {/* Messages */}
                        <div className="flex-1 px-4 py-3 overflow-y-auto space-y-2.5">
                            {loadingThread ? (
                                <p className="text-center text-xs text-slate-400 py-6">
                                    Chargement des messages...
                                </p>
                            ) : messages.length === 0 ? (
                                <p className="text-center text-xs text-slate-400 py-6">
                                    {dateFilter
                                        ? "Aucun message à cette date."
                                        : "Aucun message échangé. Écrivez le premier message !"}
                                </p>
                            ) : (
                                messages.map((msg, idx) => {
                                    const mine = isMine(msg);
                                    const heure = (msg.created_at || "")
                                        .split("T")[1]
                                        ?.slice(0, 5);
                                    const jour = jourLabel(msg.created_at);
                                    const jourPrecedent =
                                        idx > 0
                                            ? jourLabel(
                                                  messages[idx - 1].created_at
                                              )
                                            : null;
                                    const nouveauJour =
                                        jour && jour !== jourPrecedent;

                                    return (
                                        <React.Fragment
                                            key={
                                                msg.id ||
                                                `${msg.created_at}-${idx}`
                                            }
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
                                                    mine
                                                        ? "justify-end"
                                                        : "justify-start"
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
