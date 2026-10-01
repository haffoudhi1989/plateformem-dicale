import { useEffect, useState, useCallback } from "react";
import {
  Trash2,
  User,
  Search,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Helper pour récupérer le token
  const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

  // Charger la liste des utilisateurs depuis l'API Laravel
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const response = await api.get("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Gestion des structures de réponse Laravel ($response.data ou $response.data.data)
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      setUsers(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Impossible de charger la liste des utilisateurs."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Supprimer un utilisateur et synchroniser avec le serveur
  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      return;
    }

    setDeletingId(id);
    setError("");

    try {
      const token = getToken();
      await api.delete(`/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // FORCER LA REQUÊTE GET POUR GARANTIR LA SYNCHRONISATION AVEC LA BDD
      await fetchUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de la suppression de l'utilisateur."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Utilisateurs & Rôles
          </h1>
          <p className="text-sm text-gray-500">
            {users.length} utilisateur(s) en base de données
          </p>
        </div>

        {/* Action + Barre de recherche */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={loading}
            title="Rafraîchir"
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all w-64"
            />
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mb-6 flex items-center gap-2 p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Contenu principal */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
            <p className="text-sm">Chargement des données...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <User size={40} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucun utilisateur trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Utilisateur</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Rôle</th>
                  <th className="py-3.5 px-6">Statut</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Nom + ID */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                          <User size={18} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {u.name}
                          </div>
                          <div className="text-xs text-gray-400">ID #{u.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-6 text-gray-600 font-medium">
                      {u.email}
                    </td>

                    {/* Rôle */}
                    <td className="py-4 px-6">
                      <RoleBadge role={u.role} />
                    </td>

                    {/* Statut (Toujours Actif - Pas de désactivation) */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                        Actif
                      </span>
                    </td>

                    {/* Actions (Uniquement suppression) */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deletingId === u.id || u.role === "admin"}
                        title={
                          u.role === "admin"
                            ? "Impossible de supprimer un administrateur"
                            : "Supprimer"
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 border border-rose-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {deletingId === u.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        <span>Supprimer</span>
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
  );
}

// Badge de couleur selon le rôle
function RoleBadge({ role }) {
  const normalizedRole = role?.toLowerCase() || "";

  const styles = {
    admin: "bg-rose-50 text-rose-600 border-rose-100",
    medecin: "bg-sky-50 text-sky-600 border-sky-100",
    secretaire: "bg-purple-50 text-purple-600 border-purple-100",
    patient: "bg-emerald-50 text-emerald-600 border-emerald-100",
    cabinet: "bg-amber-50 text-amber-600 border-amber-100",
  };

  const currentStyle =
    styles[normalizedRole] || "bg-gray-50 text-gray-600 border-gray-100";

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${currentStyle} capitalize`}
    >
      {role || "Utilisateur"}
    </span>
  );
}