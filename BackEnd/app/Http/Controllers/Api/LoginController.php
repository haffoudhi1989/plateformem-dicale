<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Secretaire;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
            'space' => ['required', 'in:patient,medecin,secretaire,admin'],
        ]);

        $email = trim($request->email);
        $password = $request->password;
        $space = $request->space;

        /*
        |--------------------------------------------------------------------------
        | SECRETAIRE
        |--------------------------------------------------------------------------
        */

        if ($space === 'secretaire') {

            $secretaire = Secretaire::where('email', $email)->first();

            if (!$secretaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Secrétaire introuvable.',
                ], 401);
            }

            if (!$secretaire->actif) {
                return response()->json([
                    'success' => false,
                    'message' => 'Compte secrétaire désactivé.',
                ], 403);
            }

            if (!Hash::check($password, $secretaire->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email ou mot de passe incorrect.',
                ], 401);
            }

            // Supprimer les anciens tokens
            $secretaire->tokens()->delete();

            // Créer un nouveau token Sanctum
            $token = $secretaire->createToken(
                'secretaire-token'
            )->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Connexion secrétaire réussie.',
                'token' => $token,
                'space' => 'secretaire',
                'user' => $secretaire,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | USER : PATIENT / MEDECIN / ADMIN
        |--------------------------------------------------------------------------
        */

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur introuvable.',
            ], 401);
        }

        if (!Hash::check($password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email ou mot de passe incorrect.',
            ], 401);
        }

        if ($user->role !== $space) {
            return response()->json([
                'success' => false,
                'message' => 'Cet utilisateur n’appartient pas à cet espace.',
            ], 403);
        }

        $user->tokens()->delete();

        $token = $user->createToken(
            'auth-token'
        )->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Connexion réussie.',
            'token' => $token,
            'space' => $space,
            'user' => $user,
        ]);
    }
public function me(Request $request)
{
    $user = $request->user();

    if (!$user) {
        return response()->json([
            'success' => false,
            'message' => 'Utilisateur non authentifié.'
        ], 401);
    }

    return response()->json([
        'success' => true,
        'user' => $user
    ]);
}

}
