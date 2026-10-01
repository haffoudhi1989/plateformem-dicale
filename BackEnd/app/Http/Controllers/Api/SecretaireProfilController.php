<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Secretaire;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Profil du SECRÉTAIRE connecté (espace secrétariat).
 *
 * Le secrétaire s'authentifie sur la table secretaires : le compte
 * connecté ($request->user()) est donc directement la fiche concernée.
 *
 * Même principe que MedecinProfilController pour l'espace médecin :
 * la photo est enregistrée dans storage/app/public/secretaires.
 */
class SecretaireProfilController extends Controller
{
    /**
     * Afficher la fiche du secrétaire connecté (avec sa photo).
     */
    public function show(Request $request)
    {
        $secretaire = $request->user();

        if (!$secretaire instanceof Secretaire) {
            return response()->json([
                'success' => false,
                'message' => 'Secrétaire introuvable pour cet utilisateur.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->payload($secretaire),
        ], 200);
    }

    /**
     * Mettre à jour la photo de profil du secrétaire connecté.
     *
     * Route POST (et non PUT) : PHP ne décode pas le multipart sur PUT.
     *
     * Champs acceptés :
     *   - photo : fichier image (jpg, jpeg, png, webp) — 4 Mo max
     *   - remove_photo : "1" pour supprimer la photo existante
     */
    public function update(Request $request)
    {
        $secretaire = $request->user();

        if (!$secretaire instanceof Secretaire) {
            return response()->json([
                'success' => false,
                'message' => 'Secrétaire introuvable pour cet utilisateur.',
            ], 404);
        }

        $request->validate([
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        $modifie = false;

        // Suppression explicite de la photo existante
        if ($request->boolean('remove_photo')) {
            $this->supprimerPhoto($secretaire);
            $secretaire->photo = null;
            $modifie = true;
        }

        // Nouvelle photo envoyée
        if ($request->hasFile('photo')) {
            $this->supprimerPhoto($secretaire);
            $secretaire->photo = $request->file('photo')->store('secretaires', 'public');
            $modifie = true;
        }

        if ($modifie) {
            $secretaire->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour.',
            'data' => $this->payload($secretaire),
        ], 200);
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Fiche secrétaire + URL publique de la photo.
     */
    private function payload(Secretaire $secretaire): array
    {
        return [
            'id' => $secretaire->id,
            'prenom' => $secretaire->prenom,
            'nom' => $secretaire->nom,
            'email' => $secretaire->email,
            'telephone' => $secretaire->telephone,
            'cabinet_id' => $secretaire->cabinet_id,
            'actif' => $secretaire->actif,
            'photo' => $secretaire->photo,
            'photo_url' => $secretaire->photo
                ? asset('storage/' . $secretaire->photo)
                : null,
        ];
    }

    /**
     * Supprime le fichier de la photo actuelle (si présent).
     */
    private function supprimerPhoto(Secretaire $secretaire): void
    {
        if ($secretaire->photo && Storage::disk('public')->exists($secretaire->photo)) {
            Storage::disk('public')->delete($secretaire->photo);
        }
    }
}
