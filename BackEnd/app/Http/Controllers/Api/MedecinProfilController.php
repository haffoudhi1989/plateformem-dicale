<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cabinet;
use App\Models\Medecin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Profil du médecin CONNECTÉ (espace médecin).
 *
 * À ne pas confondre avec MedecinController, qui gère les fiches
 * médecins côté administration/cabinet.
 *
 * La fiche est liée au compte de connexion par users.medecin_id
 * lorsqu'il est renseigné, sinon par l'e-mail (même logique que
 * DashboardController::medecinDashboard).
 */
class MedecinProfilController extends Controller
{
    /**
     * Afficher la fiche du médecin connecté (avec sa photo).
     */
    public function show(Request $request)
    {
        $medecin = $this->medecinConnecte($request);

        if (!$medecin) {
            return response()->json([
                'success' => false,
                'message' => 'Médecin introuvable pour cet utilisateur.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->payload($medecin),
        ], 200);
    }

    /**
     * Mettre à jour la photo de profil du médecin connecté.
     *
     * Route POST (et non PUT) car PHP ne décode pas le multipart
     * sur PUT — même convention que /patients/{patient} et
     * /medecins/{medecin}.
     *
     * Champs acceptés :
     *   - photo : fichier image (jpg, jpeg, png, webp) — 4 Mo max
     *   - remove_photo : "1" pour supprimer la photo existante
     */
    public function update(Request $request)
    {
        $medecin = $this->medecinConnecte($request);

        if (!$medecin) {
            return response()->json([
                'success' => false,
                'message' => 'Médecin introuvable pour cet utilisateur.',
            ], 404);
        }

        $request->validate([
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
            'telephone' => 'nullable|string|max:30',
            'adresse' => 'nullable|string|max:255',
            'specialite_id' => 'nullable|exists:specialite,id',
        ]);

        $modifie = false;

        // Suppression explicite de la photo existante
        if ($request->boolean('remove_photo')) {
            $this->supprimerPhoto($medecin);
            $medecin->photo = null;
            $modifie = true;
        }

        // Nouvelle photo envoyée
        if ($request->hasFile('photo')) {
            $this->supprimerPhoto($medecin);
            $medecin->photo = $request->file('photo')->store('medecins', 'public');
            $modifie = true;
        }

        /*
        |--------------------------------------------------------------------------
        | COMPLÉTION DES INFORMATIONS DU PROFIL
        |--------------------------------------------------------------------------
        | Le médecin peut renseigner lui-même les champs vides de sa fiche
        | (téléphone, adresse, spécialité). Un champ envoyé mais laissé vide
        | est remis à null, comme en base.
        */

        if ($request->has('telephone')) {
            $medecin->telephone = $request->filled('telephone')
                ? $request->input('telephone')
                : null;
            $modifie = true;
        }

        if ($request->has('adresse')) {
            $medecin->adresse = $request->filled('adresse')
                ? $request->input('adresse')
                : null;
            $modifie = true;
        }

        if ($request->has('specialite_id')) {
            $medecin->specialite_id = $request->filled('specialite_id')
                ? (int) $request->input('specialite_id')
                : null;
            $modifie = true;
        }

        if ($modifie) {
            $medecin->save();
        }

        $medecin->load(['specialite', 'cabinet']);

        // La recharge de la relation remet le cabinet à null si la fiche n'a
        // pas de cabinet_id : on réapplique le repli sur le compte.
        $this->avecCabinetDuCompte($medecin, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour.',
            'data' => $this->payload($medecin),
        ], 200);
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Fiche médecin correspondant à l'utilisateur authentifié.
     */
    private function medecinConnecte(Request $request): ?Medecin
    {
        $user = $request->user();

        if (!$user) {
            return null;
        }

        if (!empty($user->medecin_id)) {
            $medecin = Medecin::with(['specialite', 'cabinet'])
                ->find($user->medecin_id);

            if ($medecin) {
                return $this->avecCabinetDuCompte($medecin, $user);
            }
        }

        $medecin = Medecin::with(['specialite', 'cabinet'])
            ->where('email', $user->email)
            ->first();

        return $medecin
            ? $this->avecCabinetDuCompte($medecin, $user)
            : null;
    }

    /**
     * Renseigne le cabinet pour l'affichage lorsque la fiche medecin n'a
     * pas de cabinet_id (rattachement présent uniquement sur le compte de
     * connexion : users.cabinet_id). Lecture seule : aucune écriture en base.
     */
    private function avecCabinetDuCompte(Medecin $medecin, $user): Medecin
    {
        if (empty($medecin->cabinet_id) && !empty($user->cabinet_id)) {
            $medecin->setRelation('cabinet', Cabinet::find($user->cabinet_id));
        }

        return $medecin;
    }

    /**
     * Fiche médecin + URL publique de la photo.
     */
    private function payload(Medecin $medecin): array
    {
        return array_merge($medecin->toArray(), [
            'photo_url' => $medecin->photo
                ? asset('storage/' . $medecin->photo)
                : null,
        ]);
    }

    /**
     * Supprime le fichier de la photo actuelle (si présent).
     */
    private function supprimerPhoto($medecin): void
    {
        if ($medecin->photo && Storage::disk('public')->exists($medecin->photo)) {
            Storage::disk('public')->delete($medecin->photo);
        }
    }
}
