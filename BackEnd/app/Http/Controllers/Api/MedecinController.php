<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medecin;
use App\Models\Secretaire;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MedecinController extends Controller
{
    /**
     * Supprime le fichier de la photo actuelle (si présent).
     */
    private function supprimerPhoto($medecin): void
    {
        if ($medecin->photo && Storage::disk('public')->exists($medecin->photo)) {
            Storage::disk('public')->delete($medecin->photo);
        }
    }

    /**
     * Liste des médecins
     *
     * Filtrage : le compte cabinet et la secrétaire ne voient que
     * le(s) médecin(s) de leur cabinet (règle métier : un cabinet =
     * un seul médecin). L'admin et les patients voient tout.
     */
    public function index(Request $request)
    {
        $query = Medecin::with('specialite');

        $user = $request->user('sanctum');

        // Compte cabinet : uniquement les médecins de son cabinet
        if ($user instanceof User && ($user->role ?? null) === 'cabinet') {
            $query->where('cabinet_id', $user->cabinet_id);
        }

        // Secrétaire : uniquement le médecin associé à son cabinet.
        // `0` ne correspond à aucune fiche : une secrétaire sans cabinet
        // obtient donc une liste vide (elle doit être rattachée).
        if ($user instanceof Secretaire) {
            $query->where('cabinet_id', $user->cabinet_id ?? 0);
        }

        $medecins = $query->get();

        return response()->json([
            'success' => true,
            'data' => $medecins
        ], 200);
    }

    /**
     * Ajouter un médecin
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'telephone' => 'nullable|string|max:30',
            'email' => 'required|email|max:255|unique:medecin,email|unique:users,email',
            'adresse' => 'nullable|string',
            'specialite_id' => 'nullable|exists:specialite,id',
            'cabinet_id' => 'nullable|exists:cabinets,id', // ✅ ajouté (table réelle : cabinets)
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
            'password' => 'required|string|min:8',
        ]);

        // Photo de profil (facultative)
        $photo = $request->hasFile('photo')
            ? $request->file('photo')->store('medecins', 'public')
            : null;

        // Règle métier : un cabinet = plusieurs patients + UN SEUL médecin.
        if (!empty($validated['cabinet_id'])) {
            $occupant = Medecin::where('cabinet_id', $validated['cabinet_id'])
                ->first();

            if ($occupant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce cabinet possède déjà un médecin (un seul médecin par cabinet).',
                ], 422);
            }
        }

        $result = DB::transaction(function () use ($validated, $photo) {

            // 1. Créer le médecin
            $medecin = Medecin::create([
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'telephone' => $validated['telephone'] ?? null,
                'email' => $validated['email'],
                'adresse' => $validated['adresse'] ?? null,
                'specialite_id' => $validated['specialite_id'] ?? null,
                'cabinet_id' => $validated['cabinet_id'] ?? null, // ✅ ajouté
                'photo' => $photo,
            ]);

            // 2. Créer son compte
            $user = User::create([
                'name' => $validated['prenom'] . ' ' . $validated['nom'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'medecin',
            ]);

            return [
                'medecin' => $medecin,
                'user' => $user,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Médecin et compte de connexion créés avec succès.',
            'data' => $result['medecin']->load('specialite'),
            'login' => [
                'email' => $result['user']->email,
                'role' => $result['user']->role,
            ]
        ], 201);
    }

    /**
     * Afficher un médecin
     */
    public function show($id)
    {
        $medecin = Medecin::with('specialite')->find($id);

        if (!$medecin) {
            return response()->json([
                'success' => false,
                'message' => 'Médecin introuvable'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $medecin
        ], 200);
    }

    /**
     * Modifier un médecin
     */
    public function update(Request $request, $id)
    {
        $medecin = Medecin::find($id);

        if (!$medecin) {
            return response()->json([
                'success' => false,
                'message' => 'Médecin introuvable'
            ], 404);
        }

        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'prenom' => 'sometimes|required|string|max:255',
            'telephone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:255',
            'adresse' => 'nullable|string',
            'specialite_id' => 'nullable|exists:specialite,id',
            'cabinet_id' => 'nullable|exists:cabinets,id', // ✅ ajouté
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        // Règle métier : un cabinet = plusieurs patients + UN SEUL médecin.
        if (!empty($validated['cabinet_id'])) {
            $occupant = Medecin::where('cabinet_id', $validated['cabinet_id'])
                ->where('id', '!=', $medecin->id)
                ->first();

            if ($occupant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce cabinet possède déjà un médecin (un seul médecin par cabinet).',
                ], 422);
            }
        }

        // « photo » doit sortir du tableau validé : il contient l'objet
        // UploadedFile, dont la conversion en chaîne écraserait le chemin
        // du fichier stocké par le chemin du fichier temporaire PHP.
        unset($validated['photo']);

        // Suppression explicite de la photo existante
        if ($request->boolean('remove_photo')) {
            $this->supprimerPhoto($medecin);
            $medecin->photo = null;
        }

        // Nouvelle photo envoyée
        if ($request->hasFile('photo')) {
            $this->supprimerPhoto($medecin);
            $medecin->photo = $request->file('photo')->store('medecins', 'public');
        }

        $medecin->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Médecin modifié avec succès',
            'data' => $medecin->load('specialite')
        ], 200);
    }

    /**
     * Supprimer un médecin
     */
    public function destroy($id)
    {
        $medecin = Medecin::find($id);

        if (!$medecin) {
            return response()->json([
                'success' => false,
                'message' => 'Médecin introuvable'
            ], 404);
        }

        $medecin->delete();

        return response()->json([
            'success' => true,
            'message' => 'Médecin supprimé avec succès'
        ], 200);
    }
}