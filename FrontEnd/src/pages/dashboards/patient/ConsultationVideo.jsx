import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Video,
  CalendarDays,
  Clock3,
  Stethoscope,
  UserRound,
  History,
  Activity,
  Timer,
} from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

const ConsultationVideo = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("available");

  const [consultations, setConsultations] = useState([]);
  const [history, setHistory] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    totalDuration: 0,
    averageDuration: 0,
  });

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  const token = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const headers = () => ({
    Authorization: `Bearer ${token()}`,
    Accept: "application/json",
  });

  const handleAuthError = (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      navigate("/login");
      return true;
    }
    return false;
  };

  // =========================================================
  // CHARGER LES CONSULTATIONS DISPONIBLES
  // =========================================================
  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        setLoading(true);
        setError("");

        if (!token()) {
          navigate("/login");
          return;
        }

        const response = await axios.get(
          `${API_URL}/patient/consultations-video`,
          { headers: headers() }
        );

        const data = response.data;

        if (Array.isArray(data)) {
          setConsultations(data);
        } else if (Array.isArray(data?.data)) {
          setConsultations(data.data);
        } else if (Array.isArray(data?.consultations)) {
          setConsultations(data.consultations);
        } else {
          setConsultations([]);
        }
      } catch (err) {
        console.error(
          "Erreur chargement consultations vidéo :",
          err
        );

        if (!handleAuthError(err)) {
          setError(
            "Impossible de charger les consultations vidéo."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConsultations();
  }, []);

  // =========================================================
  // CHARGER HISTORIQUE + STATS
  // =========================================================
  useEffect(() => {
    if (activeTab !== "history") {
      return;
    }

    const fetchHistory = async () => {
      try {
        setHistoryLoading(true);

        const [historyResponse, statsResponse] =
          await Promise.all([
            axios.get(
              `${API_URL}/patient/consultations-video/historique`,
              { headers: headers() }
            ),
            axios.get(
              `${API_URL}/patient/consultations-video/stats`,
              { headers: headers() }
            ),
          ]);

        const historyData = historyResponse.data;
        const statsData = statsResponse.data;

        if (Array.isArray(historyData)) {
          setHistory(historyData);
        } else if (Array.isArray(historyData?.data)) {
          setHistory(historyData.data);
        } else if (
          Array.isArray(historyData?.historique)
        ) {
          setHistory(historyData.historique);
        } else {
          setHistory([]);
        }

        const receivedStats =
          statsData?.data || statsData || {};

        setStats({
          total: Number(
            receivedStats.total ??
              receivedStats.totalConsultations ??
              0
          ),
          totalDuration: Number(
            receivedStats.totalDuration ??
              receivedStats.dureeTotale ??
              0
          ),
          averageDuration: Number(
            receivedStats.averageDuration ??
              receivedStats.dureeMoyenne ??
              0
          ),
        });
      } catch (err) {
        console.error(
          "Erreur chargement historique vidéo :",
          err
        );
        handleAuthError(err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [activeTab]);

  // =========================================================
  // FORMAT DATE
  // =========================================================
  const formatDate = (date) => {
    if (!date) {
      return "Date non définie";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // =========================================================
  // FORMAT HEURE
  // =========================================================
  const formatTime = (date) => {
    if (!date) {
      return "--:--";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "--:--";
    }

    return parsedDate.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // FORMAT DUREE
  // =========================================================
  const formatDuration = (duration) => {
    const value = Number(duration) || 0;

    if (value <= 0) {
      return "0 min";
    }

    // Si la valeur est en secondes
    if (value >= 60) {
      const minutes = Math.floor(value / 60);
      const seconds = value % 60;

      if (seconds === 0) {
        return `${minutes} min`;
      }

      return `${minutes} min ${seconds} sec`;
    }

    return `${value} sec`;
  };

  // =========================================================
  // NOM DU MEDECIN
  // =========================================================
  const getDoctorName = (consultation) => {
    const medecin =
      consultation?.rendez_vous?.medecin ||
      consultation?.medecin;

    if (medecin?.prenom || medecin?.nom) {
      return `Dr. ${medecin.prenom || ""} ${
        medecin.nom || ""
      }`.replace(/\s+/g, " ").trim();
    }

    if (medecin?.nom) {
      return `Dr. ${medecin.nom}`;
    }

    if (consultation?.doctor?.name) {
      return `Dr. ${consultation.doctor.name}`;
    }

    if (consultation?.medecinNom) {
      return `Dr. ${consultation.medecinNom}`;
    }

    if (consultation?.doctorName) {
      return `Dr. ${consultation.doctorName}`;
    }

    return "Médecin";
  };

  // =========================================================
  // SPECIALITE
  // =========================================================
  const getSpecialty = (consultation) => {
    const specialite =
      consultation?.rendez_vous?.medecin?.specialite?.nom ||
      consultation?.medecin?.specialite?.nom ||
      consultation?.medecin?.specialite ||
      consultation?.doctor?.specialty ||
      consultation?.specialite ||
      consultation?.specialty;

    return specialite || "Médecine générale";
  };

  // =========================================================
  // DATE DE CONSULTATION
  // =========================================================
  const getConsultationDate = (consultation) => {
    const rdv = consultation?.rendez_vous;

    if (rdv?.date_rdv) {
      const datePart = rdv.date_rdv;
      const timePart = rdv.heure_rdv || "00:00";
      return `${datePart}T${timePart}`;
    }

    return (
      consultation?.date ||
      consultation?.dateConsultation ||
      consultation?.scheduledAt ||
      consultation?.dateHeure ||
      consultation?.startAt
    );
  };

  // =========================================================
  // MOTIF
  // =========================================================
  const getReason = (consultation) => {
    return (
      consultation?.rendez_vous?.motif ||
      consultation?.motif ||
      consultation?.reason ||
      consultation?.motifConsultation ||
      "Consultation médicale"
    );
  };

  // =========================================================
  // LANCER APPEL
  // =========================================================
  /*
   * L'appel vidéo passe par Google Meet (lien partagé au patient
   * lors de la réservation). L'intégration Agora (token, channel)
   * pourra remplacer ce lien à une étape ultérieure.
   */

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <div className="bg-[#FAF9F6] p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-72 rounded-lg bg-[#EDE8DD]" />

            <div className="h-16 rounded-2xl bg-white shadow-sm" />

            <div className="grid gap-5 md:grid-cols-2">
              <div className="h-64 rounded-2xl bg-white shadow-sm" />
              <div className="h-64 rounded-2xl bg-white shadow-sm" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="bg-[#FAF9F6] p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#EEF2F6] px-4 py-2 text-sm font-medium text-[#881337]">
              <Video size={16} />
              Téléconsultation
            </div>

            <h1 className="font-serif text-3xl font-bold text-[#1C1B19] md:text-4xl">
              Consultations vidéo
            </h1>

            <p className="mt-2 max-w-2xl text-[#777064]">
              Consultez votre médecin à distance dans un
              espace sécurisé et confortable.
            </p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#881337] text-white shadow-sm">
            <Video size={26} />
          </div>
        </div>

        {/* ERREUR */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* TABS */}
        <div className="mb-8 rounded-2xl border border-[#EDE8DD] bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("available")}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === "available"
                  ? "bg-[#881337] text-white"
                  : "text-[#777064] hover:bg-[#F6F3EE]"
              }`}
            >
              <Video size={18} />
              Consultations disponibles
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === "history"
                  ? "bg-[#881337] text-white"
                  : "text-[#777064] hover:bg-[#F6F3EE]"
              }`}
            >
              <History size={18} />
              Historique
            </button>
          </div>
        </div>

        {/* =====================================================
            CONSULTATIONS DISPONIBLES
        ====================================================== */}
        {activeTab === "available" && (
          <div>
            {consultations.length === 0 ? (
              <div className="rounded-2xl border border-[#EDE8DD] bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF2F6] text-[#881337]">
                  <Video size={28} />
                </div>

                <h2 className="font-serif text-xl font-bold text-[#1C1B19]">
                  Aucune consultation disponible
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-[#777064]">
                  Vous n'avez actuellement aucune
                  consultation vidéo programmée.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {consultations.map((consultation, index) => {
                  const consultationDate =
                    getConsultationDate(consultation);

                  return (
                    <div
                      key={
                        consultation?.id ||
                        consultation?._id ||
                        index
                      }
                      className="overflow-hidden rounded-2xl border border-[#EDE8DD] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {/* CARD HEADER */}
                      <div className="border-b border-[#EDE8DD] px-6 py-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF2F6] text-[#881337]">
                              <UserRound size={22} />
                            </div>

                            <div>
                              <h3 className="font-serif text-lg font-bold text-[#1C1B19]">
                                {getDoctorName(
                                  consultation
                                )}
                              </h3>

                              <div className="mt-1 flex items-center gap-2 text-sm text-[#777064]">
                                <Stethoscope size={15} />
                                {getSpecialty(
                                  consultation
                                )}
                              </div>
                            </div>
                          </div>

                          <span className="rounded-full bg-[#EEF2F6] px-3 py-1 text-xs font-semibold text-[#881337]">
                            Vidéo
                          </span>
                        </div>
                      </div>

                      {/* CARD BODY */}
                      <div className="space-y-4 px-6 py-5">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl bg-[#F6F3EE] p-4">
                            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#777064]">
                              <CalendarDays size={15} />
                              Date
                            </div>

                            <p className="text-sm font-semibold text-[#1C1B19]">
                              {formatDate(
                                consultationDate
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-[#F6F3EE] p-4">
                            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#777064]">
                              <Clock3 size={15} />
                              Heure
                            </div>

                            <p className="text-sm font-semibold text-[#1C1B19]">
                              {formatTime(
                                consultationDate
                              )}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#777064]">
                            Motif
                          </p>

                          <p className="text-sm leading-6 text-[#1C1B19]">
                            {getReason(consultation)}
                          </p>
                        </div>
                      </div>

                      {/* CARD FOOTER */}
                      <div className="border-t border-[#EDE8DD] bg-[#FAF9F6] px-6 py-4">
                        <a
                          href="https://meet.google.com/"
                          target="_blank"
                          rel="noreferrer"
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#881337] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1F354B]"
                        >
                          <Video size={17} />
                          Rejoindre la visio (Google Meet)
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            HISTORIQUE
        ====================================================== */}
        {activeTab === "history" && (
          <div>
            {historyLoading ? (
              <div className="animate-pulse space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="h-32 rounded-2xl bg-white" />
                  <div className="h-32 rounded-2xl bg-white" />
                  <div className="h-32 rounded-2xl bg-white" />
                </div>

                <div className="h-64 rounded-2xl bg-white" />
              </div>
            ) : (
              <>
                {/* STATS */}
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                  {/* TOTAL */}
                  <div className="rounded-2xl border border-[#EDE8DD] bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF2F6] text-[#881337]">
                        <Activity size={21} />
                      </div>

                      <span className="text-xs font-medium text-[#777064]">
                        Total
                      </span>
                    </div>

                    <p className="font-serif text-3xl font-bold text-[#1C1B19]">
                      {stats.total}
                    </p>

                    <p className="mt-1 text-sm text-[#777064]">
                      consultations vidéo
                    </p>
                  </div>

                  {/* DUREE TOTALE */}
                  <div className="rounded-2xl border border-[#EDE8DD] bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F6F3EE] text-[#881337]">
                        <Timer size={21} />
                      </div>

                      <span className="text-xs font-medium text-[#777064]">
                        Temps total
                      </span>
                    </div>

                    <p className="font-serif text-3xl font-bold text-[#1C1B19]">
                      {formatDuration(
                        stats.totalDuration
                      )}
                    </p>

                    <p className="mt-1 text-sm text-[#777064]">
                      de consultation
                    </p>
                  </div>

                  {/* MOYENNE */}
                  <div className="rounded-2xl border border-[#EDE8DD] bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF2F6] text-[#881337]">
                        <Clock3 size={21} />
                      </div>

                      <span className="text-xs font-medium text-[#777064]">
                        Moyenne
                      </span>
                    </div>

                    <p className="font-serif text-3xl font-bold text-[#1C1B19]">
                      {formatDuration(
                        stats.averageDuration
                      )}
                    </p>

                    <p className="mt-1 text-sm text-[#777064]">
                      par consultation
                    </p>
                  </div>
                </div>

                {/* LISTE HISTORIQUE */}
                {history.length === 0 ? (
                  <div className="rounded-2xl border border-[#EDE8DD] bg-white px-6 py-14 text-center shadow-sm">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF2F6] text-[#881337]">
                      <History size={28} />
                    </div>

                    <h2 className="font-serif text-xl font-bold text-[#1C1B19]">
                      Aucun historique
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm text-[#777064]">
                      Vos consultations vidéo terminées
                      apparaîtront ici.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-[#EDE8DD] bg-white shadow-sm">
                    <div className="border-b border-[#EDE8DD] px-6 py-5">
                      <h2 className="font-serif text-xl font-bold text-[#1C1B19]">
                        Historique des consultations
                      </h2>

                      <p className="mt-1 text-sm text-[#777064]">
                        Retrouvez vos précédentes
                        consultations vidéo.
                      </p>
                    </div>

                    <div className="divide-y divide-[#EDE8DD]">
                      {history.map((consultation, index) => {
                        const consultationDate =
                          getConsultationDate(
                            consultation
                          );

                        return (
                          <div
                            key={
                              consultation?.id ||
                              consultation?._id ||
                              index
                            }
                            className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF2F6] text-[#881337]">
                                <Video size={19} />
                              </div>

                              <div>
                                <h3 className="font-semibold text-[#1C1B19]">
                                  {getDoctorName(
                                    consultation
                                  )}
                                </h3>

                                <p className="mt-1 text-sm text-[#777064]">
                                  {getSpecialty(
                                    consultation
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-5 text-sm">
                              <div className="flex items-center gap-2 text-[#777064]">
                                <CalendarDays size={16} />
                                {formatDate(
                                  consultationDate
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-[#777064]">
                                <Clock3 size={16} />
                                {formatTime(
                                  consultationDate
                                )}
                              </div>

                              <div className="rounded-lg bg-[#F6F3EE] px-3 py-2 font-medium text-[#881337]">
                                {formatDuration(
                                  consultation?.duration ??
                                    consultation?.duree ??
                                    consultation?.durationSeconds ??
                                    0
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationVideo;