<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class PatientController extends Controller
{
    /**
     * Supprime le fichier de la photo actuelle (si présent).
     */
    private function supprimerPhoto($patient): void
    {
        if ($patient->photo && Storage::disk('public')->exists($patient->photo)) {
            Storage::disk('public')->delete($patient->photo);
        }
    }

    /**
     * Liste des patients
     */
    public function index()
    {
        $patients = Patient::all();

        return response()->json([
            'success' => true,
            'data' => $patients
        ]);
    }

    /**
     * Ajouter un patient
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'telephone' => 'nullable|string|max:30',
            'email' => 'required|email|max:255|unique:patients,email|unique:users,email',
            'adresse' => 'nullable|string',
            'date_naissance' => 'nullable|date',
            'sexe' => 'nullable|string|max:20',
            'groupe_sanguin' => 'nullable|string|max:10',
            'allergies' => 'nullable|string',
            'maladies_chroniques' => 'nullable|string',
            'antecedents' => 'nullable|string',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
            'password' => 'required|string|min:8',
        ]);

        // Rattacher le patient au cabinet du créateur (secrétaire / cabinet)
        $createur = $request->user('sanctum');
        $cabinetId = $createur->cabinet_id ?? null;

        // Photo de profil (facultative)
        $photo = $request->hasFile('photo')
            ? $request->file('photo')->store('patients', 'public')
            : null;

        // Créer le patient
        $patient = Patient::create([
            'cabinet_id' => $cabinetId,
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'telephone' => $validated['telephone'] ?? null,
            'email' => $validated['email'],
            'adresse' => $validated['adresse'] ?? null,
            'date_naissance' => $validated['date_naissance'] ?? null,
            'sexe' => $validated['sexe'] ?? null,
            'groupe_sanguin' => $validated['groupe_sanguin'] ?? null,
            'allergies' => $validated['allergies'] ?? null,
            'maladies_chroniques' => $validated['maladies_chroniques'] ?? null,
            'antecedents' => $validated['antecedents'] ?? null,
            'photo' => $photo,
        ]);

        // Créer le compte utilisateur
        $user = User::create([
            'name' => $validated['prenom'] . ' ' . $validated['nom'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'patient',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Patient et compte de connexion créés avec succès.',
            'data' => $patient,
            'login' => [
                'email' => $user->email,
                'role' => $user->role,
            ]
        ], 201);
    }

    /**
     * Historique des paiements d'un patient
     */
    public function paiements($id)
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient introuvable',
            ], 404);
        }

        $paiements = Paiement::where('patient_id', $patient->id)
            ->orderByDesc('date_paiement')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'patient' => [
                'id' => $patient->id,
                'nom' => $patient->nom,
                'prenom' => $patient->prenom,
                'email' => $patient->email,
                'telephone' => $patient->telephone,
            ],
            'total' => (float) $paiements->sum('montant'),
            'data' => $paiements,
        ]);
    }

    /**
     * Afficher un patient
     */
    public function show($id)
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient introuvable'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $patient
        ]);
    }

    /**
     * Modifier un patient
     */
    public function update(Request $request, $id)
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient introuvable'
            ], 404);
        }

        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'telephone' => 'nullable|string|max:30',
            'email' => 'required|email|max:255',
            'adresse' => 'nullable|string',
            'date_naissance' => 'nullable|date',
            'sexe' => 'nullable|string|max:20',
            'groupe_sanguin' => 'nullable|string|max:10',
            'allergies' => 'nullable|string',
            'maladies_chroniques' => 'nullable|string',
            'antecedents' => 'nullable|string',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        // « photo » doit sortir du tableau validé : il contient l'objet
        // UploadedFile, dont la conversion en chaîne écraserait le chemin
        // du fichier stocké par le chemin du fichier temporaire PHP.
        unset($validated['photo']);

        // Suppression explicite de la photo existante
        if ($request->boolean('remove_photo')) {
            $this->supprimerPhoto($patient);
            $patient->photo = null;
        }

        // Nouvelle photo envoyée
        if ($request->hasFile('photo')) {
            $this->supprimerPhoto($patient);
            $patient->photo = $request->file('photo')->store('patients', 'public');
        }

        $patient->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Patient modifié avec succès.',
            'data' => $patient
        ]);
    }

    /**
     * Supprimer un patient
     */
    public function destroy($id)
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient introuvable'
            ], 404);
        }

        $patient->delete();

        return response()->json([
            'success' => true,
            'message' => 'Patient supprimé avec succès.'
        ]);
    }
}