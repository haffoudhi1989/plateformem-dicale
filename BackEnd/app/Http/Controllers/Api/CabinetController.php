<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cabinet;
use App\Models\Medecin;
use App\Models\Patient;
use App\Models\Secretaire;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CabinetController extends Controller
{
    /**
     * Liste des cabinets
     */
    public function index(): JsonResponse
    {
        $cabinets = Cabinet::with([
            'medecins.specialite',
            'patients',
            'secretaires',
        ])
        ->orderBy('id', 'desc')
        ->get();

        foreach ($cabinets as $cabinet) {
            /*
             * Seuls les patients réellement rattachés au cabinet
             * (patients.cabinet_id). Les patients simplement liés par un
             * rendez-vous à un médecin du cabinet ne sont plus inclus.
             */
            $cabinet->setRelation(
                'patients',
                Patient::where('cabinet_id', $cabinet->id)->get()
            );
        }

        return response()->json([
            'success' => true,
            'data' => $cabinets
        ]);
    }

    /**
     * Créer un cabinet avec plusieurs membres
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',

            'adresse' => 'nullable|string|max:500',

            'telephone' => 'nullable|string|max:50',

            'email' => 'nullable|email|max:255',

            'description' => 'nullable|string',

            'actif' => 'nullable|boolean',

            /*
             * Règle métier : un cabinet = plusieurs patients + PLUSIEURS médecins.
             * Les médecins du cabinet sont ceux parmi lesquels on choisit, pour
             * chaque patient, ceux qui le suivent.
             */
            'medecin_ids' => 'required|array|min:1',

            'medecin_ids.*' => [
                'integer',
                'exists:medecin,id'
            ],

            /*
             * Plusieurs patients (optionnel)
             */
            'patient_ids' => 'nullable|array',

            'patient_ids.*' => [
                'integer',
                'exists:patients,id'
            ],

            /*
             * Médecins associés à chaque patient.
             * Format : { "41": [7, 21], "42": [7] }
             */
            'patient_medecins' => 'nullable|array',

            'patient_medecins.*' => 'array',

            'patient_medecins.*.*' => [
                'integer',
                'exists:medecin,id'
            ],

            /*
             * Plusieurs secrétaires
             */
            'secretaire_ids' => 'required|array|min:1',

            'secretaire_ids.*' => [
                'integer',
                'exists:secretaires,id'
            ],
        ], [
            'medecin_ids.min' => 'Un cabinet doit contenir au moins un médecin.',
        ]);

        try {

            DB::beginTransaction();

            /*
             * Création du cabinet
             */
            $cabinet = Cabinet::create([
                'nom' => $validated['nom'],

                'adresse' =>
                    $validated['adresse'] ?? null,

                'telephone' =>
                    $validated['telephone'] ?? null,

                'email' =>
                    $validated['email'] ?? null,

                'description' =>
                    $validated['description'] ?? null,

                'actif' =>
                    $request->boolean('actif', true),
            ]);

            /*
             * Affecter les médecins
             */
            Medecin::whereIn(
                'id',
                $validated['medecin_ids']
            )->update([
                'cabinet_id' => $cabinet->id
            ]);

            /*
             * Affecter les patients si fournis
             */
            if (!empty($validated['patient_ids'])) {
                Patient::whereIn(
                    'id',
                    $validated['patient_ids']
                )->update([
                    'cabinet_id' => $cabinet->id
                ]);
            }

            /*
             * Médecins associés à chaque patient
             */
            $this->syncPatientMedecins(
                $validated['patient_medecins'] ?? []
            );

            /*
             * Affecter les secrétaires
             */
            Secretaire::whereIn(
                'id',
                $validated['secretaire_ids']
            )->update([
                'cabinet_id' => $cabinet->id
            ]);

            DB::commit();

            /*
             * Recharger avec les membres
             */
            $cabinet->load([
                'medecins.specialite',
                'patients',
                'secretaires'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Cabinet créé avec succès.',
                'data' => $cabinet
            ], 201);

        } catch (\Throwable $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du cabinet.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function statut(Request $request, $cabinet): JsonResponse
    {
        $cabinetModel = ($cabinet instanceof Cabinet) ? $cabinet : Cabinet::findOrFail($cabinet);

        if ($request->has('actif')) {
            $cabinetModel->actif = $request->boolean('actif');
            $cabinetModel->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Statut du cabinet mis à jour avec succès.',
            'actif' => (bool) $cabinetModel->actif,
            'data' => $cabinetModel
        ]);
    }
    /**
     * Afficher un cabinet
     */
    public function show(Cabinet $cabinet): JsonResponse
    {
        $cabinet->load([
            'medecins.specialite',
            'patients',
            'secretaires'
        ]);

        // Seuls les patients réellement rattachés au cabinet.
        $allPatients = Patient::where('cabinet_id', $cabinet->id)->get();

        $cabinet->setRelation('patients', $allPatients);

        /*
         * Médecins associés à chaque patient, pour pré-remplir le formulaire.
         * Format : { "41": [7, 21], "42": [7] }
         */
        $patientMedecins = [];

        foreach ($allPatients as $patient) {
            $patientMedecins[(string) $patient->id] =
                $patient->medecins()->pluck('medecin.id')->all();
        }

        $cabinet->patient_medecins = $patientMedecins;

        return response()->json([
            'success' => true,
            'data' => $cabinet
        ]);
    }

    /**
     * Enregistre les médecins associés à chaque patient
     * (relation plusieurs-à-plusieurs via la table « medecin_patient »).
     *
     * Format attendu : [ patient_id => [medecin_id, ...] ]
     *
     * Un patient absent du tableau conserve ses médecins.
     * Un patient présent avec un tableau vide est détaché de tous ses médecins.
     */
    private function syncPatientMedecins(array $mapping): void
    {
        foreach ($mapping as $patientId => $medecinIds) {
            $patient = Patient::find((int) $patientId);

            if (!$patient) {
                continue;
            }

            $patient->medecins()->sync(
                collect((array) $medecinIds)
                    ->map(fn ($id) => (int) $id)
                    ->filter()
                    ->unique()
                    ->values()
                    ->all()
            );
        }
    }

    /**
     * Modifier un cabinet et ses membres
     */
    public function update(
        Request $request,
        Cabinet $cabinet
    ): JsonResponse {

        $validated = $request->validate([
            'nom' => 'required|string|max:255',

            'adresse' => 'nullable|string|max:500',

            'telephone' => 'nullable|string|max:50',

            'email' => 'nullable|email|max:255',

            'description' => 'nullable|string',

            'actif' => 'nullable|boolean',

            /*
             * Règle métier : un cabinet = plusieurs patients + PLUSIEURS médecins.
             */
            'medecin_ids' => 'required|array|min:1',

            'medecin_ids.*' => [
                'integer',
                'exists:medecin,id'
            ],

            'patient_ids' => 'nullable|array',

            'patient_ids.*' => [
                'integer',
                'exists:patients,id'
            ],

            /*
             * Médecins associés à chaque patient.
             * Format : { "41": [7, 21], "42": [7] }
             */
            'patient_medecins' => 'nullable|array',

            'patient_medecins.*' => 'array',

            'patient_medecins.*.*' => [
                'integer',
                'exists:medecin,id'
            ],

            'secretaire_ids' => 'required|array',

            'secretaire_ids.*' => [
                'integer',
                'exists:secretaires,id'
            ],
        ], [
            'medecin_ids.min' => 'Un cabinet doit contenir au moins un médecin.',
        ]);

        try {

            DB::beginTransaction();

            /*
             * Informations du cabinet
             */
            $cabinet->update([
                'nom' => $validated['nom'],

                'adresse' =>
                    $validated['adresse'] ?? null,

                'telephone' =>
                    $validated['telephone'] ?? null,

                'email' =>
                    $validated['email'] ?? null,

                'description' =>
                    $validated['description'] ?? null,

                'actif' =>
                    $request->has('actif')
                        ? $request->boolean('actif')
                        : (bool) $cabinet->actif,
            ]);

            /*
             * Retirer les médecins
             * qui ne sont plus sélectionnés
             */
            Medecin::where('cabinet_id', $cabinet->id)
                ->whereNotIn(
                    'id',
                    $validated['medecin_ids']
                )
                ->update([
                    'cabinet_id' => null
                ]);

            /*
             * Ajouter les médecins sélectionnés
             */
            Medecin::whereIn(
                'id',
                $validated['medecin_ids']
            )->update([
                'cabinet_id' => $cabinet->id
            ]);

            /*
             * Patients du cabinet.
             *
             * On ne synchronise que si le client a réellement transmis la clé.
             * Un tableau vide est une demande explicite de tout détacher
             * (le formulaire fait foi), mais une clé ABSENTE ne doit rien
             * modifier : c'est ce qui provoquait un détachement massif et
             * silencieux de tous les patients du cabinet.
             */
            if (array_key_exists('patient_ids', $validated)) {
                $patientIds = $validated['patient_ids'];

                /*
                 * Retirer les patients non sélectionnés
                 */
                Patient::where('cabinet_id', $cabinet->id)
                    ->whereNotIn('id', $patientIds)
                    ->update([
                        'cabinet_id' => null
                    ]);

                /*
                 * Ajouter les patients sélectionnés
                 */
                Patient::whereIn('id', $patientIds)
                    ->update([
                        'cabinet_id' => $cabinet->id
                    ]);
            }

            /*
             * Médecins associés à chaque patient
             */
            $this->syncPatientMedecins(
                $validated['patient_medecins'] ?? []
            );

            /*
             * Retirer les secrétaires
             */
            Secretaire::where('cabinet_id', $cabinet->id)
                ->whereNotIn(
                    'id',
                    $validated['secretaire_ids']
                )
                ->update([
                    'cabinet_id' => null
                ]);

            /*
             * Ajouter les secrétaires
             */
            Secretaire::whereIn(
                'id',
                $validated['secretaire_ids']
            )->update([
                'cabinet_id' => $cabinet->id
            ]);

            DB::commit();

            $cabinet->load([
                'medecins.specialite',
                'patients',
                'secretaires'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Cabinet modifié avec succès.',
                'data' => $cabinet
            ]);

        } catch (\Throwable $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Médecins d'un cabinet
     */
    public function medecins(Cabinet $cabinet): JsonResponse
    {
        $cabinet->load('medecins.specialite');

        return response()->json([
            'success' => true,
            'data' => $cabinet->medecins ?? [],
        ]);
    }

    /**
     * Patients d'un cabinet
     */
    public function patients(Cabinet $cabinet): JsonResponse
    {
        // Seuls les patients réellement rattachés au cabinet.
        $patients = Patient::where('cabinet_id', $cabinet->id)->get();

        return response()->json([
            'success' => true,
            'data' => $patients,
        ]);
    }

    /**
     * Secrétaires d'un cabinet
     */
    public function secretaires(Cabinet $cabinet): JsonResponse
    {
        $cabinet->load('secretaires');

        return response()->json([
            'success' => true,
            'data' => $cabinet->secretaires ?? [],
        ]);
    }

    /**
     * Mise à jour du profil du cabinet connecté (espace cabinet).
     *
     * URL : PUT /api/cabinet/profil
     */
    public function updateProfil(Request $request): JsonResponse
    {
        $user = $request->user();
        $cabinetId = $user->cabinet_id ?? null;

        if (!$cabinetId) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun cabinet associé à ce compte.',
            ], 404);
        }

        $cabinet = Cabinet::find($cabinetId);

        if (!$cabinet) {
            return response()->json([
                'success' => false,
                'message' => 'Cabinet introuvable.',
            ], 404);
        }

        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'adresse' => 'nullable|string|max:500',
            'telephone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'description' => 'nullable|string',
        ]);

        $cabinet->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profil du cabinet mis à jour avec succès.',
            'data' => $cabinet,
        ]);
    }

    /**
     * Prix mensuels des plans (en TND).
     */
    private const PLANS = [
        'Basic' => 49,
        'Pro' => 99,
        'Premium' => 199,
    ];

    /**
     * Abonnement actuel du cabinet connecté (espace cabinet).
     *
     * URL : GET /api/cabinet/abonnement
     */
    public function abonnement(Request $request): JsonResponse
    {
        $user = $request->user();

        $cabinetId = $user->cabinet_id ?? null;

        /*
         * Espace médecin : le rattachement au cabinet se fait via la fiche
         * médecin (users.cabinet_id n'est pas toujours renseigné), comme
         * ailleurs dans l'application (même convention que PaiementController,
         * StaffMessageController, ContactController...).
         */
        if (!$cabinetId && ($user->role ?? null) === 'medecin') {
            $medecin = !empty($user->medecin_id)
                ? Medecin::find($user->medecin_id)
                : Medecin::where('email', $user->email)->first();

            $cabinetId = $medecin->cabinet_id ?? null;
        }

        if (!$cabinetId) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun cabinet associé à ce compte.',
            ], 404);
        }

        $cabinet = Cabinet::find($cabinetId);

        if (!$cabinet) {
            return response()->json([
                'success' => false,
                'message' => 'Cabinet introuvable.',
            ], 404);
        }

        $joursRestants = null;
        if ($cabinet->date_fin_abonnement) {
            $joursRestants = max(0, now()->startOfDay()->diffInDays(
                \Carbon\Carbon::parse($cabinet->date_fin_abonnement)->startOfDay()
            ));
        }

        // Statut auto : expire si la date de fin est dépassée
        $statut = $cabinet->statut_abonnement;
        if ($cabinet->date_fin_abonnement
            && $cabinet->date_fin_abonnement < now()->toDateString()
            && $statut === 'actif') {
            $statut = 'expire';
        }

        return response()->json([
            'success' => true,
            'data' => [
                'plan' => $cabinet->plan ?? 'Basic',
                'statut' => $statut,
                'date_debut' => $cabinet->date_debut_abonnement,
                'date_fin' => $cabinet->date_fin_abonnement,
                'jours_restants' => $joursRestants,
                'prix_mensuel' => self::PLANS[$cabinet->plan] ?? self::PLANS['Basic'],
                'plans' => self::PLANS,
            ],
        ]);
    }

    /**
     * Changer / souscrire à un abonnement (espace cabinet).
     *
     * URL : PUT /api/cabinet/abonnement
     * Body : plan (Basic|Pro|Premium), duree (1|3|12 mois)
     */
    public function updateAbonnement(Request $request): JsonResponse
    {
        $user = $request->user();
        $cabinetId = $user->cabinet_id ?? null;

        if (!$cabinetId) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun cabinet associé à ce compte.',
            ], 404);
        }

        $cabinet = Cabinet::find($cabinetId);

        if (!$cabinet) {
            return response()->json([
                'success' => false,
                'message' => 'Cabinet introuvable.',
            ], 404);
        }

        $validated = $request->validate([
            'plan' => 'required|string|in:Basic,Pro,Premium',
            'duree' => 'required|integer|in:1,3,12',
        ]);

        $plan = $validated['plan'];
        $duree = (int) $validated['duree'];
        $prixMensuel = self::PLANS[$plan];
        $montant = $prixMensuel * $duree;

        $debut = now()->toDateString();
        $fin = now()->addMonths($duree)->toDateString();

        $cabinet->update([
            'plan' => $plan,
            'date_debut_abonnement' => $debut,
            'date_fin_abonnement' => $fin,
            'statut_abonnement' => 'actif',
        ]);

        \App\Models\CabinetAbonnement::create([
            'cabinet_id' => $cabinet->id,
            'plan' => $plan,
            'montant' => $montant,
            'duree_mois' => $duree,
            'date_debut' => $debut,
            'date_fin' => $fin,
            'mode_paiement' => 'En ligne',
            'statut' => 'Payé',
            'date_paiement' => now()->toDateString(),
            'reference' => 'ABO-' . now()->format('Ymd') . '-' . strtoupper(\Illuminate\Support\Str::random(4)),
            'notes' => 'Souscription effectuée depuis l\'espace cabinet.',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Abonnement {$plan} activé avec succès.",
            'data' => [
                'plan' => $plan,
                'statut' => 'actif',
                'date_debut' => $debut,
                'date_fin' => $fin,
                'duree_mois' => $duree,
                'prix_mensuel' => $prixMensuel,
                'montant_total' => $montant,
            ],
        ]);
    }

    /**
     * Envoyer un message de contact à l'admin (espace cabinet).
     *
     * URL : POST /api/cabinet/contact
     */
    public function sendMessage(Request $request): JsonResponse
    {
        $user = $request->user();
        $cabinetId = $user->cabinet_id ?? null;

        if (!$cabinetId) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun cabinet associé à ce compte.',
            ], 404);
        }

        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'sujet' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        \App\Models\CabinetMessage::create([
            'cabinet_id' => $cabinetId,
            'nom' => $validated['nom'],
            'email' => $validated['email'],
            'sujet' => $validated['sujet'],
            'message' => $validated['message'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Message envoyé avec succès.',
        ]);
    }

    /**
     * Supprimer un cabinet
     */
    public function destroy(Cabinet $cabinet): JsonResponse
    {
        try {

            DB::beginTransaction();

            /*
             * Libérer les membres
             */
            Medecin::where(
                'cabinet_id',
                $cabinet->id
            )->update([
                'cabinet_id' => null
            ]);

            Patient::where(
                'cabinet_id',
                $cabinet->id
            )->update([
                'cabinet_id' => null
            ]);

            Secretaire::where(
                'cabinet_id',
                $cabinet->id
            )->update([
                'cabinet_id' => null
            ]);

            $cabinet->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Cabinet supprimé avec succès.'
            ]);

        } catch (\Throwable $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
