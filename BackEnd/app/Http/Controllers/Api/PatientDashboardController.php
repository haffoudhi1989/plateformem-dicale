<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\RendezVous;
use App\Models\Medecin;
use App\Models\Paiement;
use App\Models\Ordonnance;
use App\Models\Analyse;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class PatientDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Utilisateur non authentifié.'
            ], 401);
        }

        /*
        |--------------------------------------------------------------------------
        | Trouver le patient connecté
        |--------------------------------------------------------------------------
        */

        $patient = null;

        if (!empty($user->patient_id)) {
            $patient = Patient::find($user->patient_id);
        }

        if (!$patient && !empty($user->email)) {
            $patient = Patient::where(
                'email',
                $user->email
            )->first();
        }

        if (!$patient) {
            return response()->json([
                'message' => 'Patient non trouvé.'
            ], 404);
        }


        /*
        |--------------------------------------------------------------------------
        | RENDEZ-VOUS
        |--------------------------------------------------------------------------
        */

        $rendezVous = RendezVous::with('medecin')
            ->where('patient_id', $patient->id)
            ->orderBy('date_rdv', 'desc')
            ->orderBy('heure_rdv', 'asc')
            ->get();


        /*
        |--------------------------------------------------------------------------
        | MEDECINS
        |--------------------------------------------------------------------------
        */

        $medecins = Medecin::whereHas(
            'rendezVous',
            function ($query) use ($patient) {
                $query->where(
                    'patient_id',
                    $patient->id
                );
            }
        )
        ->distinct()
        ->get();


        /*
        |--------------------------------------------------------------------------
        | PAIEMENTS
        |--------------------------------------------------------------------------
        */

        $paiements = Paiement::where(
            'patient_id',
            $patient->id
        )->get();


        /*
        |--------------------------------------------------------------------------
        | ORDONNANCES
        |--------------------------------------------------------------------------
        */

        $ordonnances = Ordonnance::where(
            'patient_id',
            $patient->id
        )->get();


        /*
        |--------------------------------------------------------------------------
        | ANALYSES
        |--------------------------------------------------------------------------
        */

        $analyses = Analyse::where(
            'patient_id',
            $patient->id
        )->get();


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([

            'patient' => [
                'id' => $patient->id,
                'user_id' => $user->id,
                'prenom' => $patient->prenom,
                'nom' => $patient->nom,
                'email' => $patient->email,
            ],

            'statistiques' => [

                'rendez_vous' => $rendezVous->count(),

                'medecins' => $medecins->count(),

                'paiements' => $paiements->count(),

                'ordonnances' => $ordonnances->count(),

                'analyses' => $analyses->count(),

            ],

            'rendez_vous' => $rendezVous,

        ]);
    }
    public function medecinsDisponibles(Request $request)
{
    $user = $request->user();

    if (!$user) {
        return response()->json([
            'message' => 'Utilisateur non authentifié.',
            'data' => []
        ], 401);
    }

    // Recherche du patient connecté
    $patient = null;

    if (!empty($user->patient_id)) {
        $patient = Patient::find($user->patient_id);
    }

    if (!$patient && !empty($user->email)) {
        $patient = Patient::where(
            'email',
            $user->email
        )->first();
    }

    if (!$patient) {
        return response()->json([
            'message' => 'Patient non trouvé.',
            'data' => []
        ], 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Tous les médecins de la plateforme (prise de rendez-vous)
    |--------------------------------------------------------------------------
    |
    | La page "Prendre rendez-vous" doit permettre de choisir n'importe
    | quel médecin (et pas seulement ceux déjà liés par un RDV).
    | La page "Mes médecins" conserve sa propre logique de liens.
    |
    */

    $medecins = Medecin::with('specialite')
        ->orderBy('nom')
        ->orderBy('prenom')
        ->get();

    return response()->json([
        'patient_id' => $patient->id,
        'data' => $medecins
    ]);
}
public function prendreRendezVous(Request $request)
{
    $user = $request->user();

    if (!$user) {
        return response()->json([
            'message' => 'Utilisateur non authentifié.'
        ], 401);
    }

    // Recherche du patient connecté
    $patient = null;

    if (!empty($user->patient_id)) {
        $patient = Patient::find($user->patient_id);
    }

    if (!$patient && !empty($user->email)) {
        $patient = Patient::where(
            'email',
            $user->email
        )->first();
    }

    if (!$patient) {
        return response()->json([
            'message' => 'Patient non trouvé.'
        ], 404);
    }

    $data = $request->validate([
        'medecin_id' => 'required|exists:medecin,id',
        'date_rdv' => 'required|date',
        'heure_rdv' => 'required',
        'motif' => 'nullable|string|max:500',
    ]);

    // Vérifier que le médecin choisi fait bien partie des médecins du patient.
    // Règle de repli : si le patient n'a encore aucun médecin (aucun RDV),
    // il peut prendre rendez-vous avec n'importe quel médecin.
    $patientARdv = $patient->rendezVous()->exists();

    if ($patientARdv) {
        $medecinAutorise = $patient->rendezVous()
            ->where('medecin_id', $data['medecin_id'])
            ->exists();

        if (!$medecinAutorise) {
            return response()->json([
                'message' => 'Ce médecin ne fait pas partie de vos médecins.',
            ], 422);
        }
    }

    // Le patient_id vient du compte connecté
    // et non de React
    $rdv = RendezVous::create([
        'patient_id' => $patient->id,
        'medecin_id' => $data['medecin_id'],
        'date_rdv' => $data['date_rdv'],
        'heure_rdv' => $data['heure_rdv'],
        'motif' => $data['motif'] ?? null,
        'statut' => 'En attente',
    ]);

    $rdv->load([
        'patient',
        'medecin'
    ]);

    // Notification au médecin : nouvelle demande de rendez-vous.
    // Sans cet appel, aucune notification n'était créée lors d'une prise
    // de rendez-vous par un patient (seules les annulations notifiaient).
    if ($rdv->medecin_id) {
        $patientNom = trim(($patient->prenom ?? '') . ' ' . ($patient->nom ?? ''))
            ?: 'Un patient';

        NotificationService::notifyMedecin(
            (int) $rdv->medecin_id,
            'Nouvelle demande de rendez-vous',
            "{$patientNom} a demandé un rendez-vous le "
                . \Illuminate\Support\Carbon::parse($rdv->date_rdv)->format('d/m/Y')
                . ' à ' . substr((string) $rdv->heure_rdv, 0, 5) . '.'
        );
    }

    return response()->json([
        'message' => 'Demande de rendez-vous envoyée avec succès.',
        'data' => $rdv
    ], 201);
}
}
