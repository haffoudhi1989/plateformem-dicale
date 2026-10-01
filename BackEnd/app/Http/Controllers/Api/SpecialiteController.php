<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Specialite;
use Illuminate\Http\Request;

class SpecialiteController extends Controller
{
    // Liste des spécialités
    public function index()
    {
        $specialites = Specialite::orderBy('nom', 'asc')->get();

        return response()->json($specialites);
    }

    // Ajouter une spécialité
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100|unique:specialite,nom',
            'description' => 'nullable|string',
        ]);

        $specialite = Specialite::create($validated);

        return response()->json([
            'message' => 'Spécialité ajoutée avec succès',
            'data' => $specialite
        ], 201);
    }

    // Afficher une spécialité
    public function show($id)
    {
        $specialite = Specialite::findOrFail($id);

        return response()->json($specialite);
    }

    // Modifier une spécialité
    public function update(Request $request, $id)
    {
        $specialite = Specialite::findOrFail($id);

        $validated = $request->validate([
            'nom' => 'required|string|max:100|unique:specialite,nom,' . $id,
            'description' => 'nullable|string',
        ]);

        $specialite->update($validated);

        return response()->json([
            'message' => 'Spécialité modifiée avec succès',
            'data' => $specialite
        ]);
    }

    // Supprimer une spécialité
    public function destroy($id)
    {
        $specialite = Specialite::findOrFail($id);

        $specialite->delete();

        return response()->json([
            'message' => 'Spécialité supprimée avec succès'
        ]);
    }
}
