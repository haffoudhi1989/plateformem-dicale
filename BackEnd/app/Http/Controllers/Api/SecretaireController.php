<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Secretaire;
use App\Models\Cabinet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use App\Models\User;
class SecretaireController extends Controller
{
    /**
     * =====================================================
     * LISTE DES SECRÉTAIRES
     * =====================================================
     */
    public function index()
    {
        try {
            $secretaires = Secretaire::with('cabinet')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $secretaires,
            ]);

        } catch (\Throwable $e) {

            return response()->json([
                'success' => false,
                'message' => 'Impossible de récupérer les secrétaires.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * =====================================================
     * AFFICHER UNE SECRÉTAIRE
     * =====================================================
     */
    public function show($id)
    {
        try {

            $secretaire = Secretaire::with([
                'cabinet',
            ])->find($id);

            if (!$secretaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Secrétaire introuvable.',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $secretaire,
            ]);

        } catch (\Throwable $e) {

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la secrétaire.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * =====================================================
     * CRÉER UNE SECRÉTAIRE
     * =====================================================
     */
    /**
 * =====================================================
 * CRÉER UNE SECRÉTAIRE
 * =====================================================
 */
public function store(Request $request)
{
    $validated = $request->validate([
        'prenom' => [
            'required',
            'string',
            'max:100',
        ],

        'nom' => [
            'required',
            'string',
            'max:100',
        ],

        'email' => [
            'required',
            'email',
            'max:255',
            'unique:secretaires,email',
            'unique:users,email',
        ],

        'telephone' => [
            'nullable',
            'string',
            'max:30',
        ],

        'password' => [
            'required',
            'string',
            'min:8',
        ],

        'cabinet_id' => [
            'nullable',
            'integer',
            'exists:cabinets,id',
        ],

        'actif' => [
            'nullable',
            'boolean',
        ],
    ]);

    // =====================================================
    // CRÉER LA SECRÉTAIRE
    // =====================================================

    $secretaire = Secretaire::create([
        'prenom' => $validated['prenom'],
        'nom' => $validated['nom'],
        'email' => $validated['email'],
        'telephone' => $validated['telephone'] ?? null,
        'password' => Hash::make($validated['password']),
        'cabinet_id' => $validated['cabinet_id'] ?? null,
        'actif' => $validated['actif'] ?? true,
    ]);

    // =====================================================
    // CRÉER SON COMPTE UTILISATEUR
    // =====================================================

    $user = User::create([
        'name' => $validated['prenom'] . ' ' . $validated['nom'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
        'role' => 'secretaire',
    ]);

    // Charger le cabinet
    $secretaire->load('cabinet');

    return response()->json([
        'success' => true,
        'message' => 'Secrétaire et compte de connexion créés avec succès.',
        'data' => $secretaire,
        'login' => [
            'email' => $user->email,
            'role' => $user->role,
        ]
    ], 201);
}

    /**
     * =====================================================
     * MODIFIER UNE SECRÉTAIRE
     * =====================================================
     */
    public function update(Request $request, $id)
    {
        $secretaire = Secretaire::find($id);

        if (!$secretaire) {
            return response()->json([
                'success' => false,
                'message' => 'Secrétaire introuvable.',
            ], 404);
        }


        $validated = $request->validate([
            'prenom' => [
                'required',
                'string',
                'max:100',
            ],

            'nom' => [
                'required',
                'string',
                'max:100',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('secretaires', 'email')
                    ->ignore($secretaire->id),
            ],

            'telephone' => [
                'nullable',
                'string',
                'max:30',
            ],

            'password' => [
                'nullable',
                'string',
                'min:6',
            ],

            'cabinet_id' => [
                'nullable',
                'integer',
                'exists:cabinets,id',
            ],

            'actif' => [
                'nullable',
                'boolean',
            ],
        ]);


        $secretaire->prenom = $validated['prenom'];
        $secretaire->nom = $validated['nom'];
        $secretaire->email = $validated['email'];
        $secretaire->telephone = $validated['telephone'] ?? null;
        $secretaire->cabinet_id = $validated['cabinet_id'] ?? null;

        if (array_key_exists('actif', $validated)) {
            $secretaire->actif = $validated['actif'];
        }


        if (!empty($validated['password'])) {
            $secretaire->password = Hash::make(
                $validated['password']
            );
        }


        $secretaire->save();

        $secretaire->load('cabinet');


        return response()->json([
            'success' => true,
            'message' => 'Secrétaire modifiée avec succès.',
            'data' => $secretaire,
        ]);
    }


    /**
     * =====================================================
     * SUPPRIMER UNE SECRÉTAIRE
     * =====================================================
     */
    public function destroy($id)
    {
        $secretaire = Secretaire::find($id);

        if (!$secretaire) {
            return response()->json([
                'success' => false,
                'message' => 'Secrétaire introuvable.',
            ], 404);
        }


        $secretaire->delete();


        return response()->json([
            'success' => true,
            'message' => 'Secrétaire supprimée avec succès.',
        ]);
    }


    /**
     * =====================================================
     * MÉDECINS DU CABINET DE LA SECRÉTAIRE
     * =====================================================
     *
     * Cette méthode permet au frontend d'obtenir
     * les médecins associés au cabinet.
     *
     * URL :
     * GET /api/secretaires/{id}/medecins
     */
    public function medecins($id)
    {
        try {

            $secretaire = Secretaire::find($id);

            if (!$secretaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Secrétaire introuvable.',
                ], 404);
            }


            if (!$secretaire->cabinet_id) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'message' => 'Cette secrétaire n\'est associée à aucun cabinet.',
                ]);
            }


            $cabinet = Cabinet::with('medecins')
                ->find($secretaire->cabinet_id);


            if (!$cabinet) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                ]);
            }


            return response()->json([
                'success' => true,
                'data' => $cabinet->medecins ?? [],
            ]);

        } catch (\Throwable $e) {

            return response()->json([
                'success' => false,
                'message' => 'Impossible de récupérer les médecins.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}