<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Patient;
use App\Models\Medecin;
use App\Models\RendezVous;
use Illuminate\Http\Request;

class PaiementController extends Controller
{
    /**
     * =========================================================
     * PATIENT CONNECTÉ
     * =========================================================
     */
    private function getPatient()
    {
        $user = auth()->user();

        if (!$user) {
            return null;
        }

        return Patient::where('email', $user->email)->first();
    }

    /**
     * =========================================================
     * ADMIN - LISTE
     * GET /api/admin/paiements
     * =========================================================
     */
    public function adminIndex()
    {
        $paiements = Paiement::with('patient')
            ->orderByDesc('date_paiement')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $paiements,
        ]);
    }
/**
 * =========================================================
 * ADMIN - AJOUTER UN PAIEMENT
 * =========================================================
 */
public function store(Request $request)
{
    $validated = $request->validate([
        'patient_id' => 'required|exists:patients,id',
        'montant' => 'required|numeric|min:0',
        'mode_paiement' => 'required|string|max:100',
        'statut' => 'required|string|max:100',
        'date_paiement' => 'nullable|date',
        'description' => 'nullable|string',
    ]);

    $paiement = Paiement::create($validated);

    $paiement->load('patient');

    return response()->json([
        'success' => true,
        'message' => 'Paiement créé avec succès.',
        'data' => $paiement,
    ], 201);
}
    /**
     * =========================================================
     * ADMIN - AFFICHER
     * GET /api/admin/paiements/{id}
     * =========================================================
     */
public function adminShow($id)
{
    \Log::info('ID PAIEMENT RECU', [
        'id' => $id
    ]);

    $paiement = Paiement::with('patient')->find($id);

    \Log::info('PAIEMENT TROUVE', [
        'paiement' => $paiement
    ]);

    if (!$paiement) {
        return response()->json([
            'success' => false,
            'message' => 'Paiement introuvable.',
            'id_recu' => $id,
            'ids_existants' => Paiement::pluck('id'),
        ], 404);
    }

    return response()->json([
        'success' => true,
        'data' => $paiement,
    ]);
}

    /**
     * =========================================================
     * ADMIN - MODIFIER
     * PUT /api/admin/paiements/{id}
     * =========================================================
     */
    public function adminUpdate(Request $request, $id)
    {
        $paiement = Paiement::find($id);

        if (!$paiement) {
            return response()->json([
                'success' => false,
                'message' => 'Paiement introuvable.',
            ], 404);
        }

        $validated = $request->validate([
            'montant' => 'required|numeric|min:0',
            'mode_paiement' => 'required|string|max:100',
            'statut' => 'required|string|max:100',
            'date_paiement' => 'nullable|date',
            'description' => 'nullable|string',
        ]);

        $paiement->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Paiement modifié avec succès.',
            'data' => $paiement->load('patient'),
        ]);
    }

    /**
     * =========================================================
     * ADMIN - SUPPRIMER
     * DELETE /api/admin/paiements/{id}
     * =========================================================
     */
    public function adminDestroy($id)
    {
        $paiement = Paiement::find($id);

        if (!$paiement) {
            return response()->json([
                'success' => false,
                'message' => 'Paiement introuvable.',
            ], 404);
        }

        $paiement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Paiement supprimé avec succès.',
        ]);
    }

    /**
     * =========================================================
     * PATIENT - LISTE
     * =========================================================
     */
    public function index()
    {
        $patient = $this->getPatient();

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient non trouvé.',
            ], 404);
        }

        $paiements = Paiement::where('patient_id', $patient->id)
            ->orderByDesc('date_paiement')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'patient_id' => $patient->id,
            'patient' => [
                'id' => $patient->id,
                'nom' => $patient->nom,
                'prenom' => $patient->prenom,
                'email' => $patient->email,
            ],
            'data' => $paiements,
        ]);
    }

    /**
     * =========================================================
     * PATIENT - AFFICHER
     * =========================================================
    */
    public function show($id)
    {
        $patient = $this->getPatient();

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient non trouvé.',
            ], 404);
        }

        $paiement = Paiement::where('patient_id', $patient->id)
            ->where('id', $id)
            ->first();

        if (!$paiement) {
            return response()->json([
                'success' => false,
                'message' => 'Paiement introuvable.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'patient_id' => $patient->id,
            'data' => $paiement,
        ]);
    }
    public function mesPaiements()
{
    $patient = $this->getPatient();

    if (!$patient) {
        return response()->json([
            'success' => false,
            'message' => 'Patient non trouvé.',
        ], 404);
    }

    $paiements = Paiement::where('patient_id', $patient->id)
        ->orderByDesc('date_paiement')
        ->orderByDesc('id')
        ->get();

    return response()->json([
        'success' => true,
        'patient' => [
            'id' => $patient->id,
            'nom' => $patient->nom,
            'prenom' => $patient->prenom,
            'email' => $patient->email,
        ],
        'data' => $paiements,
    ]);
}

    /**
     * =========================================================
     * MÉDECIN CONNECTÉ - IDENTIFICATION
     * =========================================================
     */
    private function getMedecin()
    {
        $user = auth()->user();

        if (!$user) {
            return null;
        }

        return !empty($user->medecin_id)
            ? Medecin::find($user->medecin_id)
            : Medecin::where('email', $user->email)->first();
    }

    /**
     * =========================================================
     * MÉDECIN - LISTE DES PAIEMENTS DE SES CONSULTATIONS
     * GET /api/medecin/paiements
     * =========================================================
     */
    public function medecinIndex()
    {
        $medecin = $this->getMedecin();

        if (!$medecin) {
            return response()->json([
                'success' => false,
                'message' => 'Médecin non trouvé.',
            ], 404);
        }

        $paiements = Paiement::with(['patient', 'rendezVous'])
            ->whereHas('rendezVous', function ($q) use ($medecin) {
                $q->where('medecin_id', $medecin->id);
            })
            ->orderByDesc('date_paiement')
            ->orderByDesc('id')
            ->get();

        // Paiements du mois courant
        $debutMois = now()->startOfMonth()->toDateString();
        $finMois = now()->endOfMonth()->toDateString();

        $moisCourant = $paiements->filter(function ($p) use ($debutMois, $finMois) {
            $date = optional($p->date_paiement)->toDateString()
                ?? optional($p->created_at)->toDateString();
            return $date && $date >= $debutMois && $date <= $finMois;
        });

        $enAttente = $paiements->filter(function ($p) {
            $s = mb_strtolower(trim((string) $p->statut));
            return str_contains($s, 'attente');
        });

        return response()->json([
            'success' => true,
            'medecin' => [
                'id' => $medecin->id,
                'nom' => $medecin->nom,
                'prenom' => $medecin->prenom,
            ],
            'stats' => [
                'total' => $paiements->count(),
                'total_montant' => round((float) $paiements->sum('montant'), 2),
                'mois_total' => $moisCourant->count(),
                'mois_montant' => round((float) $moisCourant->sum('montant'), 2),
                'en_attente_montant' => round((float) $enAttente->sum('montant'), 2),
            ],
            'data' => $paiements->values(),
        ]);
    }

    /**
     * =========================================================
     * MÉDECIN - ENCAISSER UN PAIEMENT POUR UN DE SES RDV
     * POST /api/medecin/paiements
     * =========================================================
     */
    public function medecinStore(Request $request)
    {
        $medecin = $this->getMedecin();

        if (!$medecin) {
            return response()->json([
                'success' => false,
                'message' => 'Médecin non trouvé.',
            ], 404);
        }

        $validated = $request->validate([
            'rendez_vous_id' => 'required|exists:rendez_vous,id',
            'montant' => 'required|numeric|min:0',
            'mode_paiement' => 'required|string|max:100',
            'statut' => 'required|string|max:100',
            'date_paiement' => 'nullable|date',
            'description' => 'nullable|string',
        ]);

        $rdv = RendezVous::with('patient')
            ->where('id', $validated['rendez_vous_id'])
            ->where('medecin_id', $medecin->id)
            ->first();

        if (!$rdv) {
            return response()->json([
                'success' => false,
                'message' => "Ce rendez-vous n'appartient pas à vos consultations.",
            ], 403);
        }

        $paiement = Paiement::create([
            'patient_id' => $rdv->patient_id,
            'rendez_vous_id' => $rdv->id,
            'montant' => $validated['montant'],
            'mode_paiement' => $validated['mode_paiement'],
            'statut' => $validated['statut'],
            'date_paiement' => $validated['date_paiement'] ?? now()->toDateString(),
            'description' => $validated['description'] ?? null,
        ]);

        $paiement->load(['patient', 'rendezVous']);

        return response()->json([
            'success' => true,
            'message' => 'Paiement enregistré avec succès.',
            'data' => $paiement,
        ], 201);
    }
}