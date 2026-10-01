import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  ArrowLeft,
  AlertCircle,
  Loader2,
  HeartPulse,
  CheckCircle2,
  Calendar,
  UserCheck,
  ShieldCheck,
  Bell,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await axios.post(`${API_BASE_URL}/api/forgot-password`, {
        email: email.trim(),
      });
      setMessage(
        "Si cette adresse existe, un lien de réinitialisation vous sera envoyé."
      );
    } catch (err) {
      if (!err.response) {
        setError("Connexion au serveur impossible.");
      } else {
        setMessage(
          "Si cette adresse existe, un lien de réinitialisation vous sera envoyé."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-white font-sans text-[#12213D]">
      <div className="grid h-full lg:grid-cols-[56.5%_43.5%]">

        {/* =====================================================
            PANNEAU GAUCHE — Points de fonctionnalités
            ===================================================== */}
        <section className="relative hidden h-full overflow-hidden bg-[#F4FAFF] lg:block">
          <div
            aria-hidden="true"
            className="absolute -left-[24%] -top-[27%] h-[82%] w-[105%] rounded-full bg-[#E6F3FF]"
          />

          <div
            aria-hidden="true"
            className="absolute left-[39%] top-[13%] h-24 w-24 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(circle, #8DBCF7 2px, transparent 2.2px)",
              backgroundSize: "21px 21px",
            }}
          />

          {/* Logo */}
          <div className="relative z-20 px-[6%] pt-[12%]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-[#1769E8] shadow-[0_8px_20px_rgba(23,105,232,0.22)]">
                <HeartPulse
                  size={27}
                  className="text-white"
                  strokeWidth={2.2}
                />
              </div>

              <div>
                <div className="text-[28px] font-bold leading-none tracking-[-1.2px] text-[#12213D]">
                  Med<span className="text-[#1769E8]">Plateform</span>
                </div>
                <p className="mt-1.5 text-[14px] font-semibold text-[#334967]">
                  Votre santé, notre priorité
                </p>
              </div>
            </div>
          </div>

          {/* Titre */}
          <div className="relative z-20 ml-[7%] mt-[1%] w-[60%]">
            <h1 className="text-[32px] font-bold leading-[1.25] tracking-[-1.2px] text-[#10213F]">
              Vos rendez-vous médicaux
              <br />
              simples et accessibles
            </h1>
          </div>

          {/* Liste sous forme de points clés */}
          <div className="relative z-30 ml-[7%] mt-6 w-[48%] space-y-4">
            <Feature
              icon={Calendar}
              title="Prise de RDV 24h/7j"
              text="Réservez en ligne en quelques clics."
            />

            <Feature
              icon={UserCheck}
              title="Médecins vérifiés"
              text="Trouvez des professionnels de confiance."
            />

            <Feature
              icon={ShieldCheck}
              title="Données sécurisées"
              text="Vos informations confidentielles sont protégées."
            />

            <Feature
              icon={Bell}
              title="Rappels automatiques"
              text="Recevez des notifications pour chaque RDV."
            />
          </div>

          {/* Image Médecin */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 right-[-2%] z-10 h-[60%] w-[46%] overflow-hidden rounded-[48%_0_0_48%]"
          >
            <img
              src="/medireserve-doctor.png"
              alt="Médecin en consultation"
              className="h-full w-full object-cover object-[54%_47%]"
            />
          </div>

          {/* Cœur ECG */}
          <div
            aria-hidden="true"
            className="absolute right-[12%] top-[13%] z-20 flex h-20 w-24 items-center justify-center rounded-[45%] bg-[#A8D6FF]/80"
          >
            <HeartPulse
              size={52}
              className="text-white"
              strokeWidth={1.8}
            />
          </div>
        </section>

        {/* =====================================================
            PANNEAU DROIT — Formulaire
            ===================================================== */}
        <main className="relative flex h-full items-start justify-center bg-white px-5 py-6 sm:px-10 lg:px-12 xl:px-16 pt-24 overflow-y-auto">
          <div className="w-full max-w-[550px]">
            <div
              className="rounded-[18px] bg-white px-2 py-2 sm:px-6 sm:py-6"
              style={{ animation: "fadeUp .45s ease-out both" }}
            >
              <div className="text-center">
                <h2 className="text-[32px] font-bold tracking-[-1px] text-[#10213F]">
                  Mot de passe oublié
                </h2>

                <p className="mt-2 text-[17px] text-[#50627C]">
                  Entrez votre adresse e-mail
                </p>

                <div className="mx-auto mt-4 h-[4px] w-[60px] rounded-full bg-[#1769E8]" />
              </div>

              {/* Message de succès */}
              {message && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mt-4 flex items-start gap-2 rounded-xl border border-[#10B981]/20 bg-[#10B981]/5 px-3.5 py-2.5 text-sm text-[#059669]"
                >
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {/* Message d'erreur */}
              {error && (
                <div
                  id="form-error"
                  role="alert"
                  aria-live="polite"
                  className="mt-4 flex items-start gap-2 rounded-xl border border-[#C94B55]/20 bg-[#C94B55]/5 px-3.5 py-2.5 text-sm text-[#8D2932]"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                noValidate
                className="mt-6 space-y-5"
              >
                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-[15px] font-semibold text-[#15233C]"
                  >
                    Adresse e-mail
                  </label>

                  <div className="relative">
                    <Mail
                      size={22}
                      strokeWidth={1.7}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7E8DA3]"
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="exemple@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      autoComplete="email"
                      required
                      disabled={loading}
                      aria-invalid={!!error}
                      aria-describedby={error ? "form-error" : undefined}
                      className="w-full rounded-[10px] border border-[#D6DEE8] bg-white py-[14px] pl-12 pr-4 text-[16px] text-[#17243B] outline-none transition-all placeholder:text-[#96A3B5] hover:border-[#BFCAD7] focus:border-[#1769E8] focus:ring-4 focus:ring-[#1769E8]/15 disabled:bg-[#F6F8FA]"
                    />
                  </div>
                </div>

                {/* BOUTON D'ENVOI */}
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-[9px] bg-[#1769E8] hover:bg-[#0F5ED8] py-[15px] text-[17px] font-semibold text-white shadow-[0_8px_18px_rgba(23,105,232,0.18)] transition-all hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <Loader2 size={19} className="animate-spin" />
                      <span>Envoi...</span>
                    </>
                  ) : (
                    <span>Envoyer le lien</span>
                  )}
                </button>
              </form>

              {/* Retour à la connexion */}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-6 flex w-full items-center justify-center gap-2 text-[15px] font-medium text-[#1769E8] transition hover:text-[#0F5ED8] py-2"
              >
                <ArrowLeft size={18} />
                Retour à la connexion
              </button>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function Feature({ icon: Icon, title, text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[11px] border border-white/70 bg-white/70 shadow-[0_4px_15px_rgba(80,130,190,0.08)]">
        <Icon
          size={22}
          strokeWidth={2}
          className="text-[#1769E8]"
        />
      </div>

      <div className="pt-0.5">
        <h3 className="text-[15px] font-bold text-[#12213D]">
          {title}
        </h3>
        <p className="text-[13px] text-[#314763]">
          {text}
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
