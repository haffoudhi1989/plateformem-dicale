<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Horaire;
use Illuminate\Http\Request;

class HoraireController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'cabinet_id' => 'required|exists:cabinets,id',
        ]);

        return response()->json(
            Horaire::where('cabinet_id', $request->cabinet_id)
                ->orderBy('id')
                ->get()
        );
    }
public function statut(Request $request, Horaire $horaire)
{
    $validated = $request->validate([
        'actif' => 'required|boolean',
    ]);

    $horaire->update([
        'actif' => $validated['actif'],
    ]);

    return response()->json([
        'message' => 'Statut de l’horaire modifié avec succès.',
        'data' => $horaire,
    ]);
}
public function store(Request $request)
{
    $validated = $request->validate([
        'cabinet_id' => 'required|exists:cabinets,id',

        'jour' => [
            'required',
            'in:Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi,Dimanche'
        ],

        'heure_ouverture' => 'nullable|date_format:H:i',
        'heure_fermeture' => 'nullable|date_format:H:i',

        'actif' => 'boolean',
    ]);

    $horaire = Horaire::create($validated);

    return response()->json([
        'message' => 'Horaire enregistré avec succès.',
        'data' => $horaire,
    ], 201);
}
       

    public function update(Request $request, Horaire $horaire)
    {
        $validated = $request->validate([
            'heure_ouverture' => 'nullable|date_format:H:i',
            'heure_fermeture' => 'nullable|date_format:H:i',
            'actif' => 'boolean',
        ]);

        $horaire->update($validated);

        return response()->json([
            'message' => 'Horaire modifié avec succès.',
            'data' => $horaire,
        ]);
    }

    public function valider(Horaire $horaire)
    {
        $horaire->update([
            'statut' => 'valide',
        ]);

        return response()->json([
            'message' => 'Horaire validé avec succès.',
            'data' => $horaire,
        ]);
    }

    public function refuser(Horaire $horaire)
    {
        $horaire->update([
            'statut' => 'refuse',
        ]);

        return response()->json([
            'message' => 'Horaire refusé.',
            'data' => $horaire,
        ]);
    }

    public function destroy(Horaire $horaire)
    {
        $horaire->delete();

        return response()->json([
            'message' => 'Horaire supprimé avec succès.',
        ]);
    }
}