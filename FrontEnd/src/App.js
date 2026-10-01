import React from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

// =====================================================
// AUTHENTIFICATION
// =====================================================

import Login from "./pages/login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// =====================================================
// LAYOUT ADMIN
// =====================================================

import AdminLayout from "./layouts/AdminLayout";
import CabinetLayout from "./layouts/CabinetLayout";
import SecretaireLayout from "./layouts/SecretaireLayout";
import PatientLayout from "./layouts/PatientLayout";
import MedecinLayout from "./layouts/MedecinLayout";


// =====================================================
// DASHBOARD ADMIN
// =====================================================

import Dashboard from "./admin/Dashboard";

// =====================================================
// DASHBOARD PATIENT
// =====================================================

import PatientDashboard from "./pages/dashboards/patient/PatientDashboard";
import PatientRendezVous from "./pages/dashboards/patient/PatientRendezVous";
import PatientMedecins from "./pages/dashboards/patient/PatientMedecins";
import PrendreRendezVous from "./pages/dashboards/patient/PrendreRendezVous";
import PatientPaiements from "./pages/dashboards/patient/PatientPaiements";
import PatientOrdonnances from "./pages/dashboards/patient/PatientOrdonnances";
import PatientAnalyses from "./pages/dashboards/patient/PatientAnalyses";
import PatientProfil from "./pages/dashboards/patient/PatientProfil";
import PatientMessages from "./pages/dashboards/patient/Messages";

// =====================================================
// DASHBOARD MEDECIN
// =====================================================

import MedecinDashboard from "./pages/dashboards/medecin/MedecinDashboard";
import MedecinPatients from "./pages/dashboards/medecin/MedecinPatients";
import MedecinRendezVous from "./pages/dashboards/medecin/MedecinRendezVous";
import MedecinProfil from "./pages/dashboards/medecin/MedecinProfil";
import MedecinAjouterOrdonnance from "./pages/dashboards/medecin/MedecinAjouterOrdonnance";
import MedecinFicheAnalyse from "./pages/dashboards/medecin/MedecinFicheAnalyse";
import MedecinPaiements from "./pages/dashboards/medecin/MedecinPaiements";
import MedecinMessages from "./pages/dashboards/medecin/Messages";

// =====================================================
// ESPACE SECRETAIRE
// =====================================================

import SecretaireDashboard from "./pages/dashboards/secretaire/SecretaireDashboard";
import SecretaireRendezVous from "./pages/dashboards/secretaire/RendezVous";
import Patients from "./pages/dashboards/secretaire/Patients";
import AjouterPatient from "./pages/dashboards/secretaire/AjouterPatient";
import Medecin from "./pages/dashboards/secretaire/Medecin";
import SecretaireMessages from "./pages/dashboards/secretaire/Messages";
import MonProfil from "./pages/dashboards/secretaire/MonProfil";

// =====================================================
// ESPACE CABINET
// =====================================================

import CabinetDashboard from "./pages/dashboards/cabinet/CabinetDashboard";
import CabinetMedecins from "./pages/dashboards/cabinet/CabinetMedecins";
import CabinetPatients from "./pages/dashboards/cabinet/CabinetPatients";
import CabinetSecretaires from "./pages/dashboards/cabinet/CabinetSecretaires";
import CabinetRendezVous from "./pages/dashboards/cabinet/CabinetRendezVous";
import CabinetHorairesCabinet from "./pages/dashboards/cabinet/CabinetHoraires";
import CabinetParametres from "./pages/dashboards/cabinet/CabinetParametres";
import CabinetProfil from "./pages/dashboards/cabinet/CabinetProfil";
import CabinetApropos from "./pages/dashboards/cabinet/CabinetApropos";
import CabinetContact from "./pages/dashboards/cabinet/CabinetContact";
import ConsultationVideo from "./pages/dashboards/patient/ConsultationVideo";
import NotificationsPage from "./pages/dashboards/NotificationsPage";


// =====================================================
// MEDECINS - ADMIN
// =====================================================

import Doctors from "./admin/doctors";
import EditDoctor from "./admin/EditDoctor";
import DoctorDetails from "./admin/DoctorDetails";

// =====================================================
// PATIENTS - ADMIN
// =====================================================

import PatientsList from "./admin/patients/PatientsList";
import AddPatient from "./admin/patients/AddPatient";
import PatientDetails from "./admin/patients/PatientDetails";
import EditPatient from "./admin/patients/EditPatient";

// =====================================================
// RENDEZ-VOUS - ADMIN
// =====================================================

import RdvList from "./admin/RDV/RdvList";

// =====================================================
// SPECIALITES - ADMIN
// =====================================================

import SpecialitesList from "./admin/specialites/SpecialitesList";
import AddSpecialite from "./admin/specialites/AddSpecialite";
import EditSpecialite from "./admin/specialites/EditSpecialite";

// =====================================================
// PAIEMENTS - ADMIN
// =====================================================

import PaymentsList from "./admin/payments/PaymentsList";

// =====================================================
// CABINET - ADMIN
// =====================================================

import Cabinet from "./admin/cabinet/Cabinet";
import CabinetList from "./admin/cabinet/CabinetList";
import CabinetHoraires from "./admin/cabinet/horaire";
import CabinetAbonnement from "./pages/dashboards/cabinet/CabinetAbonnement";


// =====================================================
// SECRETARIAT - ADMIN
// =====================================================

import SecretairesList from "./admin/cabinet/secretaires/SecretairesList";
import AddSecretaire from "./admin/cabinet/secretaires/AddSecretaire";
import EditSecretaire from "./admin/cabinet/secretaires/EditSecretaire";
import SecretaireDetails from "./admin/cabinet/secretaires/SecretaireDetails";

// =====================================================
// MESSAGES
// =====================================================

import Messages from "./admin/Messages";

// =====================================================
// NOTIFICATIONS
// =====================================================

import Notifications from "./admin/Notifications";
import UsersList from "./admin/users/UsersList";
import UsersAdd from "./admin/users/usersadd";

// =====================================================
// PARAMETRES
// =====================================================

import Parametres from "./admin/parametres/Parametres";


function App() {

    return (
        <BrowserRouter>

            <Routes>

                {/* ================================================= */}
                {/* AUTHENTIFICATION */}
                {/* ================================================= */}

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />

                <Route
                    path="/reset-password"
                    element={<ResetPassword />}
                />


                {/* ================================================= */}
                {/* ESPACE PATIENT */}
                {/* ================================================= */}

                <Route
                    path="/patient/dashboard"
                    element={<PatientDashboard />}
                />

                <Route
                    path="/patient"
                    element={<PatientLayout />}
                >
                    {/* /patient → /patient/dashboard */}
                    <Route
                        index
                        element={
                            <Navigate
                                to="dashboard"
                                replace
                            />
                        }
                    />

                    <Route
                        path="rendez-vous"
                        element={<PatientRendezVous />}
                    />

                    <Route
                        path="medecins"
                        element={<PatientMedecins />}
                    />

                    <Route
                        path="rendez-vous/nouveau"
                        element={<PrendreRendezVous />}
                    />

                    <Route
                        path="paiements"
                        element={<PatientPaiements />}
                    />

                    <Route
                        path="ordonnances"
                        element={<PatientOrdonnances />}
                    />

                    <Route
                        path="analyses"
                        element={<PatientAnalyses />}
                    />

                    <Route
                        path="messages"
                        element={<PatientMessages />}
                    />

                    <Route
                        path="profil"
                        element={<PatientProfil />}
                    />

                    <Route
                        path="consultations-video"
                        element={<ConsultationVideo />}
                    />

                    <Route
                        path="notifications"
                        element={<NotificationsPage role="patient" />}
                    />
                </Route>


                {/* ================================================= */}
                {/* ESPACE MEDECIN */}
                {/* ================================================= */}

                <Route
                    path="/medecin/dashboard"
                    element={<MedecinDashboard />}
                />

                <Route
                    path="/medecin"
                    element={<MedecinLayout />}
                >
                    {/* /medecin → /medecin/dashboard */}
                    <Route
                        index
                        element={
                            <Navigate
                                to="dashboard"
                                replace
                            />
                        }
                    />

                    <Route
                        path="patients"
                        element={<MedecinPatients />}
                    />

                    <Route
                        path="messages"
                        element={<MedecinMessages />}
                    />

                    <Route
                        path="rendez-vous"
                        element={<MedecinRendezVous />}
                    />

                    <Route
                        path="paiements"
                        element={<MedecinPaiements />}
                    />

                    <Route
                        path="ordonnances/nouvelle"
                        element={<MedecinAjouterOrdonnance />}
                    />

                    <Route
                        path="analyses"
                        element={<MedecinFicheAnalyse />}
                    />

                    <Route
                        path="notifications"
                        element={<NotificationsPage role="medecin" />}
                    />

                    <Route
                        path="profil"
                        element={<MedecinProfil />}
                    />
                </Route>


                {/* ================================================= */}
                {/* ESPACE SECRETAIRE */}
                {/* ================================================= */}

                <Route
                    path="/secretaire/dashboard"
                    element={<SecretaireDashboard />}
                />

                <Route
                    path="/secretaire"
                    element={<SecretaireLayout />}
                >
                    {/* /secretaire → /secretaire/dashboard */}
                    <Route
                        index
                        element={
                            <Navigate
                                to="dashboard"
                                replace
                            />
                        }
                    />

                    <Route
                        path="rendez-vous"
                        element={<SecretaireRendezVous />}
                    />

                    <Route
                        path="patients"
                        element={<Patients />}
                    />

                    {/* Ajout d'un patient (secrétariat) */}
                    <Route
                        path="patients/ajouter"
                        element={<AjouterPatient />}
                    />

                    <Route
                        path="medecins"
                        element={<Medecin />}
                    />

                    <Route
                        path="messages"
                        element={<SecretaireMessages />}
                    />

                    <Route
                        path="profil"
                        element={<MonProfil />}
                    />

                    {/* Horaires du cabinet (gestion complète par la secrétaire) */}
                    <Route
                        path="horaires"
                        element={<CabinetHoraires />}
                    />
                </Route>


                {/* ================================================= */}
                {/* ESPACE CABINET */}
                {/* ================================================= */}

{/* ================================================= */}
{/* ESPACE CABINET */}
{/* ================================================= */}

<Route
    path="/cabinet"
    element={<CabinetLayout />}
>
    {/* /cabinet → /cabinet/dashboard */}
    <Route
        index
        element={
            <Navigate
                to="dashboard"
                replace
            />
        }
    />

    {/* Tableau de bord */}
    <Route
        path="dashboard"
        element={<CabinetDashboard />}
    />

    {/* Médecins */}
    <Route
        path="medecins"
        element={<CabinetMedecins />}
    />

    {/* Patients */}
    <Route
        path="patients"
        element={<CabinetPatients />}
    />

    {/* Secrétaires */}
    <Route
        path="secretaires"
        element={<CabinetSecretaires />}
    />

    {/* Rendez-vous */}
    <Route
        path="rendez-vous"
        element={<CabinetRendezVous />}
    />

    {/* Horaires */}
    <Route
        path="horaires"
        element={<CabinetHorairesCabinet />}
    />

    {/* Abonnement */}
    <Route
        path="abonnement"
        element={<CabinetAbonnement />}
    />


    {/* Profil */}
    <Route
        path="profil"
        element={<CabinetProfil />}
    />

    {/* Paramètres */}
    <Route
        path="parametres"
        element={<CabinetParametres />}
    />

    {/* À propos */}
    <Route
        path="apropos"
        element={<CabinetApropos />}
    />

    {/* Contact */}
    <Route
        path="contact"
        element={<CabinetContact />}
    />
</Route>




                {/* ================================================= */}
                {/* ESPACE ADMIN */}
                {/* ================================================= */}

                <Route
                    path="/admin"
                    element={<AdminLayout />}
                >

                    {/* DASHBOARD */}

                    <Route
                        index
                        element={
                            <Navigate
                                to="dashboard"
                                replace
                            />
                        }
                    />

                    <Route
                        path="dashboard"
                        element={<Dashboard />}
                    />


                    {/* MEDECINS */}

                    <Route
                        path="doctors"
                        element={<Doctors />}
                    />

                    <Route
                        path="doctors/edit/:id"
                        element={<EditDoctor />}
                    />

                    <Route
                        path="doctors/:id"
                        element={<DoctorDetails />}
                    />


                    {/* PATIENTS */}

                    <Route
                        path="patients"
                        element={<PatientsList />}
                    />

                    <Route
                        path="patients/add"
                        element={<AddPatient />}
                    />

                    <Route
                        path="patients/edit/:id"
                        element={<EditPatient />}
                    />

                    <Route
                        path="patients/:id"
                        element={<PatientDetails />}
                    />


                    {/* RENDEZ-VOUS */}

                    <Route
                        path="rdv"
                        element={<RdvList />}
                    />

                    {/* SPECIALITES */}

                    <Route
                        path="specialities"
                        element={<SpecialitesList />}
                    />

                    <Route
                        path="specialities/add"
                        element={<AddSpecialite />}
                    />

                    <Route
                        path="specialities/edit/:id"
                        element={<EditSpecialite />}
                    />


                    {/* PAIEMENTS */}

                    <Route
                        path="payments"
                        element={<PaymentsList />}
                    />

                    
                    {/* CABINET ADMIN */}

                    <Route
                        path="cabinet"
                        element={<Cabinet />}
                    />

                    <Route
                        path="cabinet/liste"
                        element={<CabinetList />}
                    />

                    <Route
                        path="cabinet/horaires"
                        element={<CabinetHoraires />}
                    />


                    {/* SECRETARIAT ADMIN */}

                    <Route
                        path="cabinet/secretaires"
                        element={<SecretairesList />}
                    />

                    <Route
                        path="cabinet/secretaires/add"
                        element={<AddSecretaire />}
                    />

                    <Route
                        path="cabinet/secretaires/edit/:id"
                        element={<EditSecretaire />}
                    />

                    <Route
                        path="cabinet/secretaires/:id"
                        element={<SecretaireDetails />}
                    />


                    {/* MESSAGES */}

                    <Route
                        path="messages"
                        element={<Messages />}
                    />


                    {/* NOTIFICATIONS */}

                    <Route
                        path="notifications"
                        element={<Notifications />}
                    />


                    {/* PARAMETRES */}

                    <Route
                        path="parametres"
                        element={<Parametres />}
                    />


                    {/* UTILISATEURS */}

                    <Route
                        path="users"
                        element={<UsersList />}
                    />

                    <Route
                        path="useradd"
                        element={<UsersAdd />}
                    />

                </Route>


                {/* ================================================= */}
                {/* ROUTE PAR DEFAUT */}
                {/* ================================================= */}

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />


                {/* ================================================= */}
                {/* ROUTE INCONNUE */}
                {/* ================================================= */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;
