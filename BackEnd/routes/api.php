<?php

use Illuminate\Support\Facades\Route;

// =====================================================
// CONTROLLERS
// =====================================================
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\SecretaireMessageController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\MedecinController;
use App\Http\Controllers\Api\MedecinProfilController;
use App\Http\Controllers\Api\SecretaireProfilController;
use App\Http\Controllers\Api\SpecialiteController;
use App\Http\Controllers\Api\RendezVousController;
use App\Http\Controllers\Api\PaiementController;
use App\Http\Controllers\Api\AdminNotificationController;
use App\Http\Controllers\Api\CabinetController;
use App\Http\Controllers\Api\SecretaireController;
use App\Http\Controllers\Api\HoraireController;
use App\Http\Controllers\Api\FermetureController;
use App\Http\Controllers\Api\ProfilController;
use App\Http\Controllers\Api\OrdonnanceController;
use App\Http\Controllers\AnalyseController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\Api\PatientDashboardController;
use App\Http\Controllers\PatientMessageController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\UserNotificationController;
use App\Http\Controllers\RendezVousExportController;
use App\Http\Controllers\APi\PatientConsultationVideoController;
use App\Http\Controllers\Api\AdminCabinetAbonnementController;
use App\Http\Controllers\Api\StaffMessageController;


// =====================================================
// AUTHENTIFICATION PUBLIQUE
// =====================================================

Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// =====================================================
// ROUTES PROTÉGÉES (AUTH SANCTUM)
// =====================================================

Route::middleware('auth:sanctum')->group(function () {

    // Authentification & Profil
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/profil', [ProfilController::class, 'show']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/admin/users', [UserController::class, 'store']);
    // Mise à jour avec envoi de photo (multipart/form-data) : PHP ne décode
    // pas le multipart sur PUT, on expose donc une route POST dédiée.
    Route::post('/patients/{patient}', [PatientController::class, 'update']);
    Route::post('/medecins/{medecin}', [MedecinController::class, 'update']);

    // Ressources métier
    Route::apiResource('medecins', MedecinController::class);
    Route::get('/medecins', [MedecinController::class, 'index']);

  

    Route::apiResource('patients', PatientController::class);
    Route::get('/patients/{patientId}/paiements', [PatientController::class, 'paiements']);
    Route::apiResource('specialites', SpecialiteController::class);
    Route::apiResource('rendez-vous', RendezVousController::class);
    Route::get('/rendez-vous/calendrier', [RendezVousController::class, 'calendrier']);

    Route::apiResource('paiements', PaiementController::class);
    Route::apiResource('cabinets', CabinetController::class);
    Route::get('/cabinets/{cabinet}/medecins', [CabinetController::class, 'medecins']);
    Route::get('/cabinets/{cabinet}/patients', [CabinetController::class, 'patients']);
    Route::get('/cabinets/{cabinet}/secretaires', [CabinetController::class, 'secretaires']);
    Route::patch('/cabinets/{cabinet}/statut', [CabinetController::class, 'statut']);

    // Espace Cabinet
    Route::get('/cabinet/dashboard', [DashboardController::class, 'cabinet']);
    Route::put('/cabinet/profil', [CabinetController::class, 'updateProfil']);
    Route::get('/cabinet/abonnement', [CabinetController::class, 'abonnement']);
    Route::put('/cabinet/abonnement', [CabinetController::class, 'updateAbonnement']);
    Route::post('/cabinet/contact', [CabinetController::class, 'sendMessage']);

    Route::apiResource('secretaires', SecretaireController::class);
    Route::patch('/secretaires/{id}/toggle', [SecretaireController::class, 'toggle']);

    Route::apiResource('ordonnances', OrdonnanceController::class);
    Route::get('/patients/{patientId}/ordonnances', [OrdonnanceController::class, 'patient']);

    // Contacts & Messages généraux
    Route::get('/contacts', [ContactController::class, 'getContacts']);
    Route::get('/mes-contacts', [ContactController::class, 'mesContacts']);
    Route::get('/messages/conversations', [MessageController::class, 'conversations']);
    Route::post('/messages/conversations', [MessageController::class, 'createConversation']);
    Route::get('/messages/conversations/{conversationId}', [MessageController::class, 'showConversation']);
    Route::post('/messages/conversations/{conversationId}', [MessageController::class, 'sendMessage']);
    Route::get('/messages/conversation/{receiverId}', [MessageController::class, 'getConversation']);
    Route::post('/messages/send', [MessageController::class, 'sendMessage']);
    // Marquage « lu » d'un message reçu (appelé à l'ouverture d'une discussion)
    Route::post('/messages/{id}/read', [MessageController::class, 'markAsRead']);

    // Espace Patient
    Route::get('/patient/dashboard', [PatientDashboardController::class, 'index']);
    Route::get('/medecin/dashboard', [DashboardController::class, 'medecinDashboard']);
    // Espace Médecin - Profil : affichage de la fiche + envoi de la photo
    // (POST car le multipart/form-data n'est pas décodé par PHP sur PUT).
    Route::get('/medecin/profil', [MedecinProfilController::class, 'show']);
    Route::post('/medecin/profil', [MedecinProfilController::class, 'update']);
    Route::get('/patient/mes-rendez-vous', [RendezVousController::class, 'mesRendezVous']);
    Route::get('/patient/mes-medecins', [RendezVousController::class, 'mesMedecins']);
    Route::get('/patient/medecins-disponibles', [PatientDashboardController::class, 'medecinsDisponibles']);
    Route::post('/patient/prendre-rendez-vous', [PatientDashboardController::class, 'prendreRendezVous']);
    Route::get('/patient/mes-paiements', [PaiementController::class, 'mesPaiements']);
    // Espace Médecin - Paiements (consultation + encaissement)
    Route::get('/medecin/paiements', [PaiementController::class, 'medecinIndex']);
    Route::post('/medecin/paiements', [PaiementController::class, 'medecinStore']);
    Route::get('/patient/ordonnances', [OrdonnanceController::class, 'mesOrdonnances']);
    Route::get('/patient/analyses', [AnalyseController::class, 'mesAnalyses']);
    Route::get('/patient/messages', [PatientMessageController::class, 'index']);
    Route::post('/patient/messages', [PatientMessageController::class, 'store']);

Route::get('/patient/consultations-video', [
    PatientConsultationVideoController::class,
    'index'
]);

Route::get('/patient/consultations-video/historique', [
    PatientConsultationVideoController::class,
    'historique'
]);

Route::get('/patient/consultations-video/stats', [
    PatientConsultationVideoController::class,
    'stats'
]);

Route::post('/patient/consultations-video/{id}/agora-token', [
    PatientConsultationVideoController::class,
    'agoraToken'
]);

Route::post('/patient/consultations-video/{id}/end', [
    PatientConsultationVideoController::class,
    'end'
]);
    // Divers
    Route::get('/mes-medecins', [RendezVousController::class, 'mesMedecins']);
    Route::get('/analyses', [AnalyseController::class, 'index']);
    Route::post('/analyses', [AnalyseController::class, 'store']);
     Route::get('/horaires', [HoraireController::class, 'index']);
        Route::post('/horaires', [HoraireController::class, 'store']);
        Route::put('/horaires/{horaire}', [HoraireController::class, 'update']);
        Route::delete('/horaires/{horaire}', [HoraireController::class, 'destroy']);
        Route::patch('/horaires/{horaire}/valider', [HoraireController::class, 'valider']);
        Route::patch('/horaires/{horaire}/refuser', [HoraireController::class, 'refuser']);

        // Fermetures & absences (jours fériés, médecin, patient)
        Route::get('/fermetures', [FermetureController::class, 'index']);
        Route::post('/fermetures', [FermetureController::class, 'store']);
        Route::delete('/fermetures/{fermeture}', [FermetureController::class, 'destroy']);
        Route::get(
        '/rendez-vous/export/excel',
        [RendezVousExportController::class, 'excel']
    );

    Route::get(
        '/rendez-vous/export/pdf',
        [RendezVousExportController::class, 'pdf']
    );

    // Notifications in-app (patient / médecin)
    Route::get('/notifications', [UserNotificationController::class, 'index']);
    Route::put('/notifications/read-all', [UserNotificationController::class, 'markAllAsRead']);
    Route::put('/notifications/{id}/read', [UserNotificationController::class, 'markAsRead']);

    // Messagerie interne du personnel (médecin / secrétaire / admin)
    Route::prefix('staff/messages')->group(function () {
        Route::get('/contacts', [StaffMessageController::class, 'contacts']);
        Route::get('/conversation', [StaffMessageController::class, 'conversation']);
        // Total des messages non lus, toutes messageries confondues
        Route::get('/non-lus', [StaffMessageController::class, 'totalNonLus']);
        Route::post('/send', [StaffMessageController::class, 'send']);
    });
    });



// =====================================================
// PREFIX ADMIN (AUTH SANCTUM)
// =====================================================

Route::middleware('auth:sanctum')
    ->prefix('admin')
    ->group(function () {

        // Dashboard & config
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/parametres', [AdminController::class, 'getParametres']);
        // POST pour l'envoi de la photo (multipart/form-data) : PHP ne décode
        // pas le multipart sur PUT. PUT conservé pour un envoi JSON sans fichier.
        Route::post('/parametres', [AdminController::class, 'updateParametres']);
        Route::put('/parametres', [AdminController::class, 'updateParametres']);
        Route::put('/users/{id}/reset-password', [AdminController::class, 'resetUserPassword']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::patch('/users/{id}/role', [AdminController::class, 'updateUserRole']);
        Route::patch('/users/{user}/disable', [UserController::class, 'disable']);
        Route::patch('/users/{user}/activate', [UserController::class, 'activate']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
        // Notifications
        Route::get('/notifications', [AdminNotificationController::class, 'index']);
        Route::post('/notifications', [AdminNotificationController::class, 'store']);
        Route::put('/notifications/read-all', [AdminNotificationController::class, 'markAllAsRead']);
        Route::put('/notifications/{id}/read', [AdminNotificationController::class, 'markAsRead']);
        Route::delete('/notifications/{id}', [AdminNotificationController::class, 'destroy']);

        // Messages cabinet (contact)
        Route::get('/messages/cabinet', [AdminController::class, 'cabinetMessages']);
        Route::patch('/messages/cabinet/{id}/read', [AdminController::class, 'markMessageRead']);
        Route::delete('/messages/cabinet/{id}', [AdminController::class, 'deleteCabinetMessage']);

        // Paiements Admin (Consultations Patients)
        Route::get('/paiements', [PaiementController::class, 'adminIndex']);
        Route::post('/paiements', [PaiementController::class, 'store']);
        Route::get('/paiements/{id}', [PaiementController::class, 'adminShow']);
        Route::put('/paiements/{id}', [PaiementController::class, 'adminUpdate']);
        Route::delete('/paiements/{id}', [PaiementController::class, 'adminDestroy']);

        // Abonnements & Paiements Cabinets Admin
        Route::get('/cabinet-abonnements', [AdminCabinetAbonnementController::class, 'index']);
        Route::post('/cabinet-abonnements', [AdminCabinetAbonnementController::class, 'store']);
        Route::get('/cabinet-abonnements/cabinets', [AdminCabinetAbonnementController::class, 'cabinetsList']);
        Route::get('/cabinet-abonnements/{id}', [AdminCabinetAbonnementController::class, 'show']);
        Route::put('/cabinet-abonnements/{id}', [AdminCabinetAbonnementController::class, 'update']);
        Route::delete('/cabinet-abonnements/{id}', [AdminCabinetAbonnementController::class, 'destroy']);

        // Conversations Admin
        Route::get('/conversations', [MessageController::class, 'conversations']);
        Route::get('/conversations/{conversationId}', [MessageController::class, 'showConversation']);
        Route::post('/conversations', [MessageController::class, 'createConversation']);
        Route::post('/messages', [MessageController::class, 'sendMessage']);

        // Messages Secrétaires
        Route::get('/secretaires/messages', [SecretaireMessageController::class, 'secretaires']);
        Route::get('/secretaires/conversations', [SecretaireMessageController::class, 'conversations']);
        Route::post('/secretaires/conversations', [SecretaireMessageController::class, 'createConversation']);
        Route::get('/secretaires/conversations/{conversationId}', [SecretaireMessageController::class, 'showConversation']);
        Route::post('/secretaires/conversations/{conversationId}/messages', [SecretaireMessageController::class, 'sendMessage']);

        // Horaires (CRUD + validation) — consolidated here
    
 }); 
// =====================================================
// PREFIX SECRETAIRE (AUTH SANCTUM)
// =====================================================

Route::middleware('auth:sanctum')
    ->prefix('secretaire')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'secretaire']);
        // Espace Secrétariat - Profil : affichage de la fiche + envoi de la photo
        // (POST car le multipart/form-data n'est pas décodé par PHP sur PUT).
        Route::get('/profil', [SecretaireProfilController::class, 'show']);
        Route::post('/profil', [SecretaireProfilController::class, 'update']);
        Route::get('/conversations', [SecretaireMessageController::class, 'secretaireConversations']);
        Route::get('/conversations/{conversationId}', [SecretaireMessageController::class, 'secretaireMessages']);
        Route::post('/conversations/{conversationId}', [SecretaireMessageController::class, 'sendMessage']);
        Route::post('/conversations/{conversationId}/messages', [SecretaireMessageController::class, 'sendMessage']);
    });