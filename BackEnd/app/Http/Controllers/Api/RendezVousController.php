<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RendezVous;
use App\Models\Patient;
use App\Models\Medecin;
use App\Models\Ordonnance;
use App\Models\Secretaire;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class RendezVousController extends Controller
{
    /**
     * Liste des rendez-vous
     *
     * Restriction : un secrétaire ne voit que les RDV des médecins
     * de son cabinet (cabinet_id). L'admin (sans token) voit tout.
     */
    public function index(Request $request)
    {
        $query = RendezVous::with([
            'patient',
            'medecin'
        ]);

        $user = $request->user('sanctum');

        if ($user instanceof Secretaire) {

            if (empty($user->cabinet_id)) {
                // Secrétaire sans cabinet : aucun RDV à afficher
                return response()->json([
                    'data' => []
                ]);
            }

            $query->whereHas(
                'medecin',
                function ($q) use ($user) {
                    $q->where('cabinet_id', $user->cabinet_id);
                }
            );
        }

        // Compte cabinet : uniquement les RDV des médecins de son cabinet
        if ($user instanceof User && ($user->role ?? null) === 'cabinet') {
            $query->whereHas(
                'medecin',
                function ($q) use ($user) {
                    $q->where('cabinet_id', $user->cabinet_id);
                }
            );
        }

        $rdvs = $query
            ->orderBy('date_rdv', 'desc')
            ->orderBy('heure_rdv', 'asc')
            ->get();

        return response()->json([
            'data' => $rdvs
        ]);
    }

    /**
     * =====================================================
     * MES MEDECINS
     * Médecins liés au patient connecté
     * =====================================================
     *
     * Un praticien est « lié » au patient s'il apparaît dans :
     *   - un de ses rendez-vous,
     *   - une de ses ordonnances,
     *   - ou s'il exerce dans le cabinet du patient.
     *
     * La liste complète des praticiens de la plateforme reste disponible
     * via /patient/medecins-disponibles (prise de rendez-vous).
     */
    public function mesMedecins(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Utilisateur non authentifié.',
                'data' => []
            ], 401);
        }

        /*
        |--------------------------------------------------------------------------
        | Fiche patient liée au compte connecté (liaison par e-mail)
        |--------------------------------------------------------------------------
        */
        $patient = Patient::where('email', $user->email)->first();

        if (!$patient) {
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Identifiants des praticiens liés au dossier
        |--------------------------------------------------------------------------
        */
        $idsLies = RendezVous::where('patient_id', $patient->id)
            ->pluck('medecin_id')
            ->merge(
                Ordonnance::where('patient_id', $patient->id)
                    ->pluck('medecin_id')
            )
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $cabinetId = $patient->cabinet_id;

        if (empty($idsLies) && empty($cabinetId)) {
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }

        $medecins = Medecin::with('specialite')
            ->where(function ($query) use ($idsLies, $cabinetId) {
                if (!empty($idsLies)) {
                    $query->whereIn('id', $idsLies);
                }

                if (!empty($cabinetId)) {
                    $query->orWhere('cabinet_id', $cabinetId);
                }
            })
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $medecins
        ]);
    }

    /**
     * Calendrier
     */
    public function calendrier()
    {
        $rdvs = RendezVous::with([
            'patient',
            'medecin'
        ])
        ->orderBy('date_rdv', 'asc')
        ->orderBy('heure_rdv', 'asc')
        ->get();

        return response()->json([
            'data' => $rdvs
        ]);
    }

    /**
     * Ajouter un rendez-vous
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'medecin_id' => 'required|exists:medecin,id',
            'date_rdv' => 'required|date',
            'heure_rdv' => 'required',
            'motif' => 'nullable|string',
            'statut' => 'nullable|string',
            'mode' => 'nullable|in:presentiel,video',
            'notes' => 'nullable|string',
        ]);

        $rdv = RendezVous::create($data);
if (($rdv->mode ?? 'presentiel') === 'video') {
    $rdv->consultationVideo()->create([
        'status' => 'scheduled',
    ]);
}
        $rdv->load([
            'patient',
            'medecin'
        ]);

        // Notification au médecin : nouveau rendez-vous ajouté
        // (secrétariat, cabinet ou administration).
        if ($rdv->medecin_id) {
            $patientNom = trim(($rdv->patient->prenom ?? '') . ' ' . ($rdv->patient->nom ?? ''))
                ?: 'Un patient';

            NotificationService::notifyMedecin(
                (int) $rdv->medecin_id,
                'Nouveau rendez-vous',
                "Nouveau rendez-vous avec {$patientNom} le "
                    . \Illuminate\Support\Carbon::parse($rdv->date_rdv)->format('d/m/Y')
                    . ' à ' . substr((string) $rdv->heure_rdv, 0, 5) . '.'
            );
        }

        return response()->json([
            'message' => 'Rendez-vous ajouté avec succès',
            'data' => $rdv
        ], 201);
    }

    /**
     * Voir détail
     */
    public function show($id)
    {
        $rdv = RendezVous::with([
            'patient',
            'medecin'
        ])->findOrFail($id);

        return response()->json([
            'data' => $rdv
        ]);
    }

    /**
     * Modifier
     */
    public function update(Request $request, $id)
    {
        $rdv = RendezVous::findOrFail($id);

        $data = $request->validate([
            'patient_id' => 'sometimes|exists:patients,id',
            'medecin_id' => 'sometimes|exists:medecin,id',
            'date_rdv' => 'sometimes|date',
            'heure_rdv' => 'sometimes',
            'motif' => 'nullable|string',
            'statut' => 'nullable|string',
            'mode' => 'sometimes|in:presentiel,video',
            'notes' => 'nullable|string',
        ]);

        $ancienStatut = strtolower((string) $rdv->statut);
        $nouveauStatut = strtolower((string) ($data['statut'] ?? $rdv->statut));

        $rdv->update($data);

        $rdv->load([
            'patient',
            'medecin'
        ]);

        // Notification in-app quand un RDV passe à « Annulé »
        if (
            !str_contains($ancienStatut, 'annul') &&
            str_contains($nouveauStatut, 'annul')
        ) {
            $this->notifierAnnulation($rdv);
        }

        return response()->json([
            'message' => 'Rendez-vous modifié avec succès',
            'data' => $rdv
        ]);
    }

    /**
     * Supprimer
     */
    public function destroy($id)
    {
        $rdv = RendezVous::findOrFail($id);

        $rdv->load([
            'patient',
            'medecin'
        ]);

        // Notification in-app : une suppression équivaut à une annulation
        $this->notifierAnnulation($rdv);

        $rdv->delete();

        return response()->json([
            'message' => 'Rendez-vous supprimé avec succès'
        ]);
    }

    /**
     * Notifie le patient et le médecin qu'un rendez-vous a été annulé.
     */
    private function notifierAnnulation(RendezVous $rdv): void
    {
        $date = $rdv->date_rdv
            ? \Illuminate\Support\Carbon::parse($rdv->date_rdv)->format('d/m/Y')
            : '—';
        $heure = $rdv->heure_rdv ? substr($rdv->heure_rdv, 0, 5) : '—';

        $medecinNom = $rdv->medecin
            ? 'Dr ' . trim(($rdv->medecin->prenom ?? '') . ' ' . ($rdv->medecin->nom ?? ''))
            : 'le médecin';

        $patientNom = $rdv->patient
            ? trim(($rdv->patient->prenom ?? '') . ' ' . ($rdv->patient->nom ?? '')) ?: 'le patient'
            : 'le patient';

        if ($rdv->patient_id) {
            NotificationService::notifyPatient(
                $rdv->patient_id,
                'Rendez-vous annulé',
                "Votre rendez-vous du {$date} à {$heure} avec {$medecinNom} a été annulé."
            );
        }

        if ($rdv->medecin_id) {
            NotificationService::notifyMedecin(
                $rdv->medecin_id,
                'Rendez-vous annulé',
                "Le rendez-vous du {$date} à {$heure} avec {$patientNom} a été annulé."
            );
        }
    }
    public function mesRendezVous(Request $request)
{
    $user = $request->user();

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

    $rdvs = RendezVous::with([
        'medecin',
        'medecin.specialite'
    ])
    ->where('patient_id', $patient->id)
    ->orderBy('date_rdv', 'desc')
    ->orderBy('heure_rdv', 'asc')
    ->get();

    return response()->json([
        'patient' => $patient,
        'data' => $rdvs
    ]);
}
}