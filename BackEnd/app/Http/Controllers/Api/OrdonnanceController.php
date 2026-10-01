<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ordonnance;
use App\Models\Patient;
use Illuminate\Http\Request;

class OrdonnanceController extends Controller
{
    /**
     * Liste de toutes les ordonnances
     */
    public function index()
    {
        $ordonnances = Ordonnance::with([
            'patient',
            'medecin',
            'lignes'
        ])
        ->orderBy('date_ordonnance', 'desc')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $ordonnances
        ]);
    }

    /**
     * Ordonnances d'un patient
     */
 public function patient($patientId)
{
    $ordonnances = Ordonnance::with([
        'lignes',
        'medecin',
    ])
    ->where('patient_id', $patientId)
    ->orderBy('date_ordonnance', 'desc')
    ->get();

    return response()->json([
        'success' => true,
        'ordonnances' => $ordonnances,
    ]);
}

    /**
     * Ordonnances du patient actuellement authentifié.
     */
    public function mesOrdonnances(Request $request)
    {
        $user = $request->user();

        $patient = !empty($user->patient_id)
            ? Patient::find($user->patient_id)
            : Patient::where('email', $user->email)->first();

        if (!$patient) {
            return response()->json([
                'message' => 'Patient non trouvé.'
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | Uniquement les ordonnances du praticien du cabinet du patient
        |--------------------------------------------------------------------------
        |
        | Le patient ne voit que les prescriptions délivrées par le praticien
        | rattaché à son cabinet (cabinet du patient → medecin.cabinet_id).
        | Si le patient n'est rattaché à aucun cabinet, on n'applique pas de
        | restriction supplémentaire : ses propres ordonnances restent visibles.
        |
        */
        $query = Ordonnance::with([
            'medecin.specialite',
            'medecin.cabinet',
            'patient',
            'lignes'
        ])
            ->where('patient_id', $patient->id);

        if (!empty($patient->cabinet_id)) {
            $query->whereHas('medecin', function ($q) use ($patient) {
                $q->where('cabinet_id', $patient->cabinet_id);
            });
        }

        $ordonnances = $query
            ->orderBy('date_ordonnance', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'ordonnances' => $ordonnances,
        ]);
    }

    /**
     * Afficher une ordonnance
     */
    public function show($id)
    {
        $ordonnance = Ordonnance::with([
            'patient',
            'medecin',
            'lignes'
        ])->find($id);

        if (!$ordonnance) {
            return response()->json([
                'success' => false,
                'message' => 'Ordonnance introuvable'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $ordonnance
        ]);
    }

    /**
     * Créer une ordonnance
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'medecin_id' => 'required|exists:medecin,id',
            'date_ordonnance' => 'required|date',
            'statut' => 'nullable|string|max:50',
            'notes' => 'nullable|string',

            'lignes' => 'nullable|array',

            'lignes.*.medicament' => 'required|string|max:255',
            'lignes.*.dosage' => 'nullable|string|max:255',
            'lignes.*.frequence' => 'nullable|string|max:255',
            'lignes.*.duree' => 'nullable|string|max:255',
            'lignes.*.quantite' => 'nullable|integer',
            'lignes.*.instructions' => 'nullable|string',
        ]);

        $ordonnance = Ordonnance::create([
            'patient_id' => $validated['patient_id'],
            'medecin_id' => $validated['medecin_id'],
            'date_ordonnance' => $validated['date_ordonnance'],
            'statut' => $validated['statut'] ?? 'active',
            'notes' => $validated['notes'] ?? null,
        ]);

        if (!empty($validated['lignes'])) {

            foreach ($validated['lignes'] as $ligne) {

                $ordonnance->lignes()->create([
                    'medicament' => $ligne['medicament'],
                    'dosage' => $ligne['dosage'] ?? null,
                    'frequence' => $ligne['frequence'] ?? null,
                    'duree' => $ligne['duree'] ?? null,
                    'quantite' => $ligne['quantite'] ?? null,
                    'instructions' => $ligne['instructions'] ?? null,
                ]);
            }
        }

        $ordonnance->load([
            'patient',
            'medecin',
            'lignes'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ordonnance créée avec succès',
            'data' => $ordonnance
        ], 201);
    }

    /**
     * Modifier une ordonnance
     */
    public function update(Request $request, $id)
    {
        $ordonnance = Ordonnance::find($id);

        if (!$ordonnance) {
            return response()->json([
                'success' => false,
                'message' => 'Ordonnance introuvable'
            ], 404);
        }

        $validated = $request->validate([
            'patient_id' => 'sometimes|exists:patients,id',
            'medecin_id' => 'sometimes|exists:medecin,id',
            'date_ordonnance' => 'sometimes|date',
            'statut' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
        ]);

        $ordonnance->update($validated);

        $ordonnance->load([
            'patient',
            'medecin',
            'lignes'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ordonnance modifiée avec succès',
            'data' => $ordonnance
        ]);
    }

    /**
     * Supprimer une ordonnance
     */
    public function destroy($id)
    {
        $ordonnance = Ordonnance::find($id);

        if (!$ordonnance) {
            return response()->json([
                'success' => false,
                'message' => 'Ordonnance introuvable'
            ], 404);
        }

        $ordonnance->lignes()->delete();

        $ordonnance->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ordonnance supprimée avec succès'
        ]);
    }
}
