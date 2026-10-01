import { useNavigate } from "react-router-dom";
import { HeartPulse, LogOut } from "lucide-react";

/**
 * Coquille commune pour les pages de tableau de bord (placeholder).
 * Chaque espace (Patient / Médecin / Secrétaire / Admin) l'utilise
 * avec sa propre couleur d'accent, son icône et son libellé.
 */
function DashboardShell({ spaceLabel, Icon, accentClass = "from-blue-600 to-indigo-600" }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("space");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("space");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* En-tête */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 bg-gradient-to-tr ${accentClass} text-white rounded-xl flex items-center justify-center shadow`}>
            <HeartPulse size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">MedPlatform</p>
            <p className="text-xs text-slate-400 font-medium leading-tight">Espace {spaceLabel}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50 cursor-pointer"
        >
          <LogOut size={15} />
          <span>Déconnexion</span>
        </button>
      </header>

      {/* Contenu placeholder */}
      <main className="flex flex-col items-center justify-center text-center px-4 py-24">
        <div className={`w-16 h-16 bg-gradient-to-tr ${accentClass} text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg`}>
          <Icon size={30} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Tableau de bord — {spaceLabel}
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-sm font-medium">
          Cet espace est en cours de construction. Le contenu spécifique à ce rôle sera ajouté ici.
        </p>
      </main>
    </div>
  );
}

export default DashboardShell;
