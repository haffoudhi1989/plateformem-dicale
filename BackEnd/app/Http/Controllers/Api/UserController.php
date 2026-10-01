<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medecin;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function disable(User $user): JsonResponse
    {
        if ($user->role === 'admin') {
            return response()->json([
                'message' => 'Impossible de désactiver un administrateur.',
            ], 403);
        }

        $user->update([
            'is_active' => false,
        ]);

        return response()->json([
            'message' => 'Utilisateur désactivé avec succès.',
            'data' => $user,
        ]);
    }

    public function activate(User $user): JsonResponse
    {
        if ($user->role === 'admin') {
            return response()->json([
                'message' => 'Un administrateur est toujours actif.',
            ], 403);
        }

        $user->update([
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Utilisateur activé avec succès.',
            'data' => $user,
        ]);
    }
    public function destroy(User $user): JsonResponse
    {
        if ($user->role === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer un administrateur.',
            ], 403);
        }

        try {
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur supprimé avec succès.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'utilisateur : ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
            ],

            'role' => [
                'required',
                Rule::in([
                    'admin',
                    'medecin',
                    'patient',
                    'secretaire',
                    'cabinet',
                ]),
            ],

            'cabinet_id' => [
                'nullable',
                'required_if:role,cabinet',
                'exists:cabinets,id',
            ],
        ], [
            'cabinet_id.required_if' => 'Veuillez associer un cabinet au compte (rôle Cabinet).',
        ]);

        $user = User::create($validated);

        /*
        |--------------------------------------------------------------------------
        | FICHE MÉTIER DU MÉDECIN
        |--------------------------------------------------------------------------
        | L'espace médecin identifie le praticien en comparant medecin.email
        | avec l'email du compte connecté (DashboardController::medecinDashboard).
        | Sans fiche correspondante, tous les endpoints /medecin/* répondent 404
        | et l'espace reste vide : on la crée donc automatiquement ici, comme le
        | fait déjà la création d'un cabinet pour le rattachement médecins.
        */
        if ($user->role === 'medecin') {
            $this->assurerFicheMedecin($user, $validated['cabinet_id'] ?? null);
        }

        return response()->json([
            'message' => 'Utilisateur créé avec succès.',
            'user' => $user,
        ], 201);
    }

    /**
     * Garantit qu'un compte « médecin » possède sa fiche dans la table
     * `medecin` (clé de liaison : l'email).
     *
     * - fiche absente  → création (prénom / nom déduits du nom du compte) ;
     * - fiche existante → on ne réécrit pas son identité, on la rattache
     *   simplement au cabinet choisi si elle n'en a pas encore.
     */
    private function assurerFicheMedecin(User $user, ?int $cabinetId = null): Medecin
    {
        $existante = Medecin::where('email', $user->email)->first();

        if ($existante) {
            if ($cabinetId && !$existante->cabinet_id) {
                $existante->update(['cabinet_id' => $cabinetId]);
            }

            return $existante;
        }

        $parties = preg_split('/\s+/', trim((string) $user->name)) ?: [];
        $prenom = array_shift($parties) ?: (string) $user->name;
        $nom = implode(' ', $parties) ?: $prenom;

        return Medecin::create([
            'prenom' => $prenom,
            'nom' => $nom,
            'email' => $user->email,
            'cabinet_id' => $cabinetId,
        ]);
    }
}
