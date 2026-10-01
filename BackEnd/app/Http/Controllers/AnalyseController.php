<?php

namespace App\Http\Controllers;

use App\Models\Analyse;
use App\Models\Patient;
use Illuminate\Http\Request;

class AnalyseController extends Controller
{
    public function index()
    {
        $analyses = Analyse::all();

        return response()->json($analyses);
    }

    public function mesAnalyses(Request $request)
    {
        $user = $request->user();

        $patient = !empty($user->patient_id)
            ? Patient::find($user->patient_id)
            : Patient::where('email', $user->email)->first();

        if (!$patient) {
            return response()->json(['message' => 'Patient non trouvé.'], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | Uniquement les analyses du praticien du cabinet du patient
        |--------------------------------------------------------------------------
        |
        | Le patient ne voit que les examens prescrits par le praticien
        | rattaché à son cabinet (cabinet du patient → medecin.cabinet_id).
        | Les analyses sans médecin rattaché restent visibles.
        | Si le patient n'a pas de cabinet, aucune restriction n'est appliquée.
        |
        */
        $query = Analyse::where('patient_id', $patient->id);

        if (!empty($patient->cabinet_id)) {
            $query->where(function ($q) use ($patient) {
                $q->whereNull('medecin_id')
                    ->orWhereHas('medecin', function ($sub) use ($patient) {
                        $sub->where('cabinet_id', $patient->cabinet_id);
                    });
            });
        }

        $analyses = $query
            ->orderByDesc('date_examen')
            ->get();

        return response()->json([
            'success' => true,
            'analyses' => $analyses,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'medecin_id' => 'nullable|exists:medecin,id',
            'type' => 'required|string|max:255',
            'nom' => 'nullable|string|max:255',
            'date_examen' => 'required|date',
            'statut' => 'nullable|in:en_attente,valide,annule',
            'resultat' => 'nullable|string',
        ]);

        $analyse = Analyse::create([
            'patient_id' => $validated['patient_id'],
            'medecin_id' => $validated['medecin_id'] ?? null,
            'type' => $validated['type'],
            'nom' => $validated['nom'] ?? null,
            'date_examen' => $validated['date_examen'],
            'statut' => $validated['statut'] ?? 'en_attente',
            'resultat' => $validated['resultat'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Fiche d\'analyse créée avec succès.',
            'data' => $analyse,
        ], 201);
    }
}
