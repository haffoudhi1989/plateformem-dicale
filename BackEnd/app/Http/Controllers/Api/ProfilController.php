<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\Request;

class ProfilController extends Controller
{
    /**
     * Afficher le profil de l'utilisateur connecté
     */
    public function show(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Utilisateur non authentifié.'
            ], 401);
        }

        /*
        |--------------------------------------------------------------------------
        | SECRETAIRE
        |--------------------------------------------------------------------------
        */
        if ($user instanceof \App\Models\Secretaire) {

            return response()->json([
                'data' => [
                    'id' => $user->id,
                    'prenom' => $user->prenom,
                    'nom' => $user->nom,
                    'email' => $user->email,
                    'telephone' => $user->telephone,
                    'adresse' => null,

                    'date_naissance' => null,
                    'sexe' => null,
                    'groupe_sanguin' => null,
                    'allergies' => null,
                    'maladies_chroniques' => null,
                    'antecedents' => null,

                    'specialite' => 'Secrétaire',
                    'fonction' => 'Secrétaire',
                    'role' => 'secretaire',
                    'actif' => $user->actif,
                    'cabinet_id' => $user->cabinet_id,

                    'photo' => $user->photo,
                    'photo_url' => $user->photo
                        ? asset('storage/' . $user->photo)
                        : null,
                ]
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | PATIENT
        |--------------------------------------------------------------------------
        |
        | Le compte de connexion est dans users
        | Les informations médicales sont dans patients.
        |
        | On fait la liaison avec l'email.
        |--------------------------------------------------------------------------
        */

        if (($user->role ?? null) === 'patient') {

            $patient = Patient::where(
                'email',
                $user->email
            )->first();

            if (!$patient) {
                return response()->json([
                    'message' => 'Patient introuvable pour cet utilisateur.',
                    'data' => [
                        'id' => $user->id,
                        'prenom' => $user->name,
                        'nom' => null,
                        'email' => $user->email,
                        'telephone' => null,
                        'adresse' => null,
                        'date_naissance' => null,
                        'sexe' => null,
                        'groupe_sanguin' => null,
                        'allergies' => null,
                        'maladies_chroniques' => null,
                        'antecedents' => null,
                        'photo' => null,
                        'role' => 'patient',
                    ]
                ], 200);
            }

            return response()->json([
                'data' => [
                    'id' => $patient->id,

                    'prenom' => $patient->prenom,
                    'nom' => $patient->nom,

                    'email' => $patient->email,
                    'telephone' => $patient->telephone,
                    'adresse' => $patient->adresse,

                    'date_naissance' => $patient->date_naissance,

                    'sexe' => $patient->sexe,

                    'groupe_sanguin' => $patient->groupe_sanguin,
                    'allergies' => $patient->allergies,
                    'maladies_chroniques' => $patient->maladies_chroniques,
                    'antecedents' => $patient->antecedents,

                    'photo' => $patient->photo,

                    'role' => 'patient',
                ]
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | USER NORMAL
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'data' => [
                'id' => $user->id,
                'prenom' => $user->name ?? null,
                'nom' => null,
                'email' => $user->email,

                'telephone' => null,
                'adresse' => null,
                'date_naissance' => null,
                'sexe' => null,

                'groupe_sanguin' => null,
                'allergies' => null,
                'maladies_chroniques' => null,
                'antecedents' => null,

                'role' => $user->role ?? null,
                'actif' => true,
            ]
        ]);
    }
}