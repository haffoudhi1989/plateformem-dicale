<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Secretaire;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * LOGIN
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'space' => 'nullable|string|in:patient,medecin,secretaire,admin,cabinet',
        ]);

        // Le champ "space" envoyé par le client est purement cosmétique
        // (onglet choisi à l'écran). Le rôle réel est TOUJOURS déterminé
        // par le serveur à partir du compte authentifié.

        /*
        |--------------------------------------------------------------------------
        | 1) COMPTE SECRÉTAIRE (table secretaires)
        |--------------------------------------------------------------------------
        */

        $secretaire = Secretaire::where(
            'email',
            $request->email
        )->first();

        if ($secretaire) {

            if (!$secretaire->actif) {
                return response()->json([
                    'success' => false,
                    'message' => 'Votre compte secrétaire est désactivé.'
                ], 403);
            }

            if (!Hash::check(
                $request->password,
                $secretaire->password
            )) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email ou mot de passe incorrect.'
                ], 401);
            }

            /*
            |--------------------------------------------------------------------------
            | SUPPRIMER LES ANCIENS TOKENS
            |--------------------------------------------------------------------------
            */

            $secretaire->tokens()->delete();

            /*
            |--------------------------------------------------------------------------
            | CREER TOKEN SANCTUM SECRETAIRE
            |--------------------------------------------------------------------------
            */

            $token = $secretaire
                ->createToken('react-secretaire')
                ->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Connexion secrétaire réussie.',
                'token' => $token,
                'user' => [
                    'id' => $secretaire->id,
                    'name' => trim(
                        $secretaire->prenom . ' ' . $secretaire->nom
                    ),
                    'prenom' => $secretaire->prenom,
                    'nom' => $secretaire->nom,
                    'email' => $secretaire->email,
                    'role' => 'secretaire',
                    'space' => 'secretaire',
                    // Photo de la fiche secrétaire (table secretaires) :
                    // affichée dans la barre latérale, au-dessus de
                    // « Déconnexion », comme pour l'espace médecin.
                    'photo' => $secretaire->photo,
                    'photo_url' => $secretaire->photo
                        ? asset('storage/' . $secretaire->photo)
                        : null,
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | 2) AUTRES COMPTES — le rôle réel est lu dans la table users
        |--------------------------------------------------------------------------
        */

        $user = User::where(
            'email',
            $request->email
        )->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Email ou mot de passe incorrect.'
            ], 401);
        }

        if (($user->is_active ?? true) === false) {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte est désactivé.'
            ], 403);
        }

        if (!Hash::check(
            $request->password,
            $user->password
        )) {
            return response()->json([
                'success' => false,
                'message' => 'Email ou mot de passe incorrect.'
            ], 401);
        }

        // L'espace est déterminé UNIQUEMENT par le rôle en base :
        // le choix d'onglet du client est ignoré.
        $roleToSpace = match ($user->role ?? null) {
            'admin' => 'admin',
            'medecin' => 'medecin',
            'patient' => 'patient',
            'cabinet' => 'cabinet',
            'secretaire' => 'secretaire',
            default => null,
        };

        if ($roleToSpace === null) {
            return response()->json([
                'success' => false,
                'message' => 'Ce compte ne possède pas de rôle valide.'
            ], 403);
        }

        $user->tokens()->delete();

        $token = $user
            ->createToken('react-' . $roleToSpace)
            ->plainTextToken;

        $payload = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'telephone' => $user->telephone,
            'photo' => $user->photo,
            'photo_url' => $user->photo
                ? asset('storage/' . $user->photo)
                : null,
            'role' => $user->role,
            'space' => $roleToSpace,
        ];

        // Espace médecin : le nom affiché (avatar de la barre latérale,
        // bannière d'accueil, profil) provient de la fiche médecin
        // (table medecin, liée par e-mail), et non du compte de connexion :
        // sans cela, renommer une fiche créait deux noms différents à l'écran.
        if ($roleToSpace === 'medecin') {

            $medecin = \App\Models\Medecin::where('email', $user->email)->first();

            if ($medecin) {
                $payload['prenom'] = $medecin->prenom;
                $payload['nom'] = $medecin->nom;
                $payload['name'] = trim($medecin->prenom . ' ' . $medecin->nom);

                // Idem pour la photo : elle est enregistrée sur la fiche
                // médecin (colonnes photo de medecin), pas sur le compte
                // de connexion. Sans cela, l'avatar de la barre latérale
                // restait vide après connexion.
                if (!empty($medecin->photo)) {
                    $payload['photo'] = $medecin->photo;
                    $payload['photo_url'] = asset('storage/' . $medecin->photo);
                }
            }
        }

        if ($roleToSpace === 'cabinet') {
            $payload['cabinet_id'] = $user->cabinet_id;
            $payload['cabinet'] = $user->cabinet ? $user->cabinet->nom : null;
        }

        return response()->json([
            'success' => true,
            'message' => 'Connexion réussie.',
            'space' => $roleToSpace,
            'token' => $token,
            'user' => $payload,
        ]);
    }



    /**
     * UTILISATEUR CONNECTÉ
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'user' => $request->user()
        ]);
    }


    /**
     * LOGOUT
     */
    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();

        if ($token) {
            $token->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie.'
        ]);
    }


    /**
     * MOT DE PASSE OUBLIÉ
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where(
            'email',
            $request->email
        )->first();

        if (!$user) {
            return response()->json([
                'success' => true,
                'message' =>
                    'Si cette adresse email existe, un lien de réinitialisation vous sera envoyé.'
            ]);
        }

        $token = Password::createToken($user);

        $user->sendPasswordResetNotification($token);

        Log::info('Password reset request', [
            'user_email' => $user->email,
            'recipient' => 'haffoudhinour@gmail.com',
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'Si cette adresse email existe, un lien de réinitialisation vous sera envoyé.'
        ]);
    }


    /**
     * RÉINITIALISATION DU MOT DE PASSE
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => [
                'required',
                'confirmed',
                'min:8'
            ],
        ]);

        $status = Password::reset(
            $request->only([
                'email',
                'password',
                'password_confirmation',
                'token',
            ]),
            function ($user, $password) {

                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(
                    new PasswordReset($user)
                );
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'success' => true,
                'message' =>
                    'Votre mot de passe a été réinitialisé avec succès.'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' =>
                'Le lien de réinitialisation est invalide ou expiré.'
        ], 400);
    }
}