<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Medecin;
use App\Models\Patient;
use App\Models\RendezVous;
use App\Models\Paiement;
use App\Models\Cabinet;
use App\Models\Specialite;
use App\Models\Message;
use App\Models\CabinetMessage;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | DASHBOARD
    |--------------------------------------------------------------------------
    */

    public function dashboard()
    {
        try {

            $stats = [
                'medecins' => Medecin::count(),
                'patients' => Patient::count(),
                'rendez_vous' => RendezVous::count(),
                'revenus' => Paiement::where('statut', 'validé')->sum('montant'),
            ];

            $derniersRendezVous = RendezVous::with([
                'patient',
                'medecin'
            ])
                ->latest()
                ->take(5)
                ->get();

            $rendezVous = RendezVous::with([
                'patient',
                'medecin'
            ])
                ->latest()
                ->take(5)
                ->get()
                ->map(function ($rdv) {

                    return [
                        'type' => 'rdv',
                        'title' => 'Nouveau rendez-vous pris',
                        'desc' =>
                            'Dr. ' .
                            ($rdv->medecin->prenom ?? '') . ' ' .
                            ($rdv->medecin->nom ?? '') .
                            ' avec ' .
                            ($rdv->patient->prenom ?? '') . ' ' .
                            ($rdv->patient->nom ?? ''),
                        'created_at' => $rdv->created_at,
                    ];
                });

            $patients = Patient::latest()
                ->take(5)
                ->get()
                ->map(function ($patient) {

                    return [
                        'type' => 'patient',
                        'title' => 'Patient enregistré',
                        'desc' =>
                            'Inscription de ' .
                            ($patient->prenom ?? '') . ' ' .
                            ($patient->nom ?? ''),
                        'created_at' => $patient->created_at,
                    ];
                });

            $medecins = Medecin::latest()
                ->take(5)
                ->get()
                ->map(function ($medecin) {

                    return [
                        'type' => 'doctor',
                        'title' => 'Nouveau médecin',
                        'desc' =>
                            'Ajout du Dr. ' .
                            ($medecin->prenom ?? '') . ' ' .
                            ($medecin->nom ?? ''),
                        'created_at' => $medecin->created_at,
                    ];
                });

            /*
            |--------------------------------------------------------------------------
            | DERNIERS PAIEMENTS
            |--------------------------------------------------------------------------
            */

            $paiements = Paiement::with('patient')
                ->latest('date_paiement')
                ->take(5)
                ->get();

            /*
            |--------------------------------------------------------------------------
            | ACTIVITÉS PAIEMENTS
            |--------------------------------------------------------------------------
            */

            $paiementsActivities = $paiements->map(function ($paiement) {

                $patient = $paiement->patient;

                $nomPatient = $patient
                    ? trim(
                        ($patient->prenom ?? '') . ' ' .
                        ($patient->nom ?? '')
                    )
                    : 'Patient inconnu';

                return [
                    'type' => 'paiement',
                    'title' => 'Paiement enregistré',
                    'desc' =>
                        $nomPatient . ' - ' .
                        number_format(
                            (float) $paiement->montant,
                            2,
                            ',',
                            ' '
                        ) . ' DT',
                    'created_at' =>
                        $paiement->created_at ??
                        $paiement->date_paiement,
                ];
            });

            /*
            |--------------------------------------------------------------------------
            | TOUTES LES ACTIVITÉS
            |--------------------------------------------------------------------------
            */

            $activities = $rendezVous
                ->concat($patients)
                ->concat($medecins)
                ->concat($paiementsActivities)
                ->sortByDesc('created_at')
                ->take(8)
                ->values()
                ->map(function ($activity) {

                    return [
                        'type' => $activity['type'],
                        'title' => $activity['title'],
                        'desc' => $activity['desc'],
                        'time' => $activity['created_at']
                            ? $activity['created_at']->diffForHumans()
                            : '',
                    ];
                });

            /*
            |--------------------------------------------------------------------------
            | RÉPONSE API
            |--------------------------------------------------------------------------
            */

            return response()->json([
                'success' => true,
                'stats' => $stats,
                'derniers_rendez_vous' => $derniersRendezVous,

                // IMPORTANT : paiements envoyés à React
                'derniers_paiements' => $paiements,

                'activities' => $activities,
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | MÉDECINS
    |--------------------------------------------------------------------------
    */

    public function doctors()
    {
        return response()->json([
            'success' => true,
            'data' => Medecin::latest()->get()
        ]);
    }


    public function storeDoctor(Request $request)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
        ]);

        $doctor = Medecin::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Médecin ajouté avec succès.',
            'data' => $doctor
        ], 201);
    }


    public function doctor($id)
    {
        $doctor = Medecin::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $doctor
        ]);
    }


    public function updateDoctor(Request $request, $id)
    {
        $doctor = Medecin::findOrFail($id);

        $doctor->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Médecin modifié avec succès.',
            'data' => $doctor
        ]);
    }


    public function deleteDoctor($id)
    {
        $doctor = Medecin::findOrFail($id);

        $doctor->delete();

        return response()->json([
            'success' => true,
            'message' => 'Médecin supprimé avec succès.'
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | PATIENTS
    |--------------------------------------------------------------------------
    */

    public function patients()
    {
        return response()->json([
            'success' => true,
            'data' => Patient::latest()->get()
        ]);
    }


    public function storePatient(Request $request)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
        ]);

        $patient = Patient::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Patient ajouté avec succès.',
            'data' => $patient
        ], 201);
    }


    public function patient($id)
    {
        $patient = Patient::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $patient
        ]);
    }


    public function updatePatient(Request $request, $id)
    {
        $patient = Patient::findOrFail($id);

        $patient->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Patient modifié avec succès.',
            'data' => $patient
        ]);
    }


    public function deletePatient($id)
    {
        $patient = Patient::findOrFail($id);

        $patient->delete();

        return response()->json([
            'success' => true,
            'message' => 'Patient supprimé avec succès.'
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | RENDEZ-VOUS
    |--------------------------------------------------------------------------
    */

    public function rdv()
    {
        $rdv = RendezVous::with([
            'patient',
            'medecin'
        ])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rdv
        ]);
    }


    public function storeRdv(Request $request)
    {
        $rdv = RendezVous::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Rendez-vous créé avec succès.',
            'data' => $rdv
        ], 201);
    }


    public function oneRdv($id)
    {
        $rdv = RendezVous::with([
            'patient',
            'medecin'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $rdv
        ]);
    }


    public function updateRdv(Request $request, $id)
    {
        $rdv = RendezVous::findOrFail($id);

        $rdv->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Rendez-vous modifié avec succès.',
            'data' => $rdv
        ]);
    }


    public function deleteRdv($id)
    {
        $rdv = RendezVous::findOrFail($id);

        $rdv->delete();

        return response()->json([
            'success' => true,
            'message' => 'Rendez-vous supprimé avec succès.'
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CABINET
    |--------------------------------------------------------------------------
    */

    public function cabinet()
    {
        $cabinet = Cabinet::first();

        return response()->json([
            'success' => true,
            'data' => $cabinet
        ]);
    }


    public function updateCabinet(Request $request)
    {
        $cabinet = Cabinet::first();

        if (!$cabinet) {
            $cabinet = Cabinet::create($request->all());
        } else {
            $cabinet->update($request->all());
        }

        return response()->json([
            'success' => true,
            'message' => 'Cabinet mis à jour avec succès.',
            'data' => $cabinet
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | SPÉCIALITÉS
    |--------------------------------------------------------------------------
    */

    public function specialites()
    {
        return response()->json([
            'success' => true,
            'data' => Specialite::latest()->get()
        ]);
    }


    public function storeSpecialite(Request $request)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:255'
        ]);

        $specialite = Specialite::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Spécialité ajoutée avec succès.',
            'data' => $specialite
        ], 201);
    }


    public function updateSpecialite(Request $request, $id)
    {
        $specialite = Specialite::findOrFail($id);

        $specialite->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Spécialité modifiée avec succès.',
            'data' => $specialite
        ]);
    }


    public function deleteSpecialite($id)
    {
        $specialite = Specialite::findOrFail($id);

        $specialite->delete();

        return response()->json([
            'success' => true,
            'message' => 'Spécialité supprimée avec succès.'
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | PAIEMENTS
    |--------------------------------------------------------------------------
    */

    public function payments()
    {
        $payments = Paiement::with('patient')
            ->latest('date_paiement')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payments
        ]);
    }


    public function storePayment(Request $request)
    {
        $payment = Paiement::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Paiement ajouté avec succès.',
            'data' => $payment
        ], 201);
    }


    public function payment($id)
    {
        $payment = Paiement::with('patient')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $payment
        ]);
    }


    public function updatePayment(Request $request, $id)
    {
        $payment = Paiement::findOrFail($id);

        $payment->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Paiement modifié avec succès.',
            'data' => $payment
        ]);
    }


    public function deletePayment($id)
    {
        $payment = Paiement::findOrFail($id);

        $payment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Paiement supprimé avec succès.'
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | MESSAGES
    |--------------------------------------------------------------------------
    */

    public function messages()
    {
        return response()->json([
            'success' => true,
            'data' => Message::latest()->get()
        ]);
    }


    public function storeMessage(Request $request)
    {
        $message = Message::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Message créé avec succès.',
            'data' => $message
        ], 201);
    }


    public function message($id)
    {
        $message = Message::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $message
        ]);
    }


    public function updateMessage(Request $request, $id)
    {
        $message = Message::findOrFail($id);

        $message->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Message modifié avec succès.',
            'data' => $message
        ]);
    }


    public function deleteMessage($id)
    {
        $message = Message::findOrFail($id);

        $message->delete();

        return response()->json([
            'success' => true,
            'message' => 'Message supprimé avec succès.'
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | NOTIFICATIONS
    |--------------------------------------------------------------------------
    */

    public function notifications()
    {
        return response()->json([
            'success' => true,
            'data' => Notification::latest()->get()
        ]);
    }


    public function storeNotification(Request $request)
    {
        $notification = Notification::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Notification créée avec succès.',
            'data' => $notification
        ], 201);
    }


    public function notification($id)
    {
        $notification = Notification::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $notification
        ]);
    }


    public function updateNotification(Request $request, $id)
    {
        $notification = Notification::findOrFail($id);

        $notification->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Notification modifiée avec succès.',
            'data' => $notification
        ]);
    }


    public function deleteNotification($id)
    {
        $notification = Notification::findOrFail($id);

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification supprimée avec succès.'
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | RESET PASSWORD
    |--------------------------------------------------------------------------
    */

    public function resetUserPassword(Request $request, $id)
    {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::findOrFail($id);

        $user->password = $request->password;
        $user->save();

        // Synchroniser le mot de passe de la secrétaire
        // (la connexion secrétaire vérifie la table secretaires)
        if (($user->role ?? null) === 'secretaire') {
            \App\Models\Secretaire::where('email', $user->email)
                ->update(['password' => bcrypt($request->password)]);
        }

        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe réinitialisé avec succès.'
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | UTILISATEURS & RÔLES
    |--------------------------------------------------------------------------
    */

    /**
     * Liste de tous les utilisateurs avec leur rôle
     */
    public function users()
    {
        $users = User::orderBy('id', 'asc')
            ->get(['id', 'name', 'email', 'role', 'is_active', 'created_at']);

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Modifier le rôle d'un utilisateur
     */
    public function updateUserRole(Request $request, $id)
    {
        $request->validate([
            'role' => 'required|string|in:admin,medecin,patient,secretaire',
        ]);

        $user = User::findOrFail($id);

        $user->role = $request->role;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Rôle mis à jour avec succès.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ]
        ]);
    }

    public function cabinetMessages()
    {
        $messages = CabinetMessage::with('cabinet:id,nom')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $messages,
        ]);
    }

    public function markMessageRead($id)
    {
        $message = CabinetMessage::findOrFail($id);
        $message->update(['lu' => true]);

        return response()->json([
            'success' => true,
            'data' => $message,
        ]);
    }

    public function deleteCabinetMessage($id)
    {
        $message = CabinetMessage::findOrFail($id);
        $message->delete();

        return response()->json([
            'success' => true,
            'message' => 'Message supprimé.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | PARAMÈTRES DU COMPTE ADMINISTRATEUR
    |--------------------------------------------------------------------------
    | Coordonnées (nom, email, téléphone) + photo de profil.
    */

    /**
     * Coordonnées actuelles du compte connecté.
     */
    public function getParametres(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $this->profilAdminPayload($request->user()),
        ]);
    }

    /**
     * Mise à jour des coordonnées, de la photo et du mot de passe.
     *
     * Le mot de passe est OPTIONNEL : s'il est vide, il n'est pas modifié.
     */
    public function updateParametres(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non authentifié.',
            ], 401);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:120',
            'email' => 'required|email|max:190|unique:users,email,' . $user->id,
            'telephone' => 'nullable|string|max:30',
            'password' => 'nullable|string|min:8|confirmed',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->telephone = $validated['telephone'] ?? null;

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        // Suppression explicite de la photo
        if ($request->boolean('remove_photo')) {
            $this->supprimerPhoto($user);
            $user->photo = null;
        }

        // Nouvelle photo envoyée
        if ($request->hasFile('photo')) {
            $this->supprimerPhoto($user);

            $user->photo = $request
                ->file('photo')
                ->store('admins', 'public');
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Paramètres enregistrés avec succès.',
            'data' => $this->profilAdminPayload($user->fresh()),
        ]);
    }

    /**
     * Supprime le fichier de la photo actuelle (si présent).
     */
    private function supprimerPhoto($user): void
    {
        if ($user->photo && Storage::disk('public')->exists($user->photo)) {
            Storage::disk('public')->delete($user->photo);
        }
    }

    /**
     * Données de profil renvoyées au front.
     */
    private function profilAdminPayload($user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'telephone' => $user->telephone,
            'role' => $user->role,
            'photo' => $user->photo,
            'photo_url' => $user->photo
                ? asset('storage/' . $user->photo)
                : null,
        ];
    }
}