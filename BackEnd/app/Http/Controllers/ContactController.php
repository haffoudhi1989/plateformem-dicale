<?php

namespace App\Http\Controllers;

use App\Models\Medecin;
use App\Models\Patient;
use App\Models\RendezVous;
use App\Models\Secretaire;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class ContactController extends Controller
{
    /**
     * Return every account that can receive a direct message.
     */
    public function getContacts(Request $request)
    {
        $currentUser = $request->user();

        if (!$currentUser) {
            return response()->json([
                'status' => false,
                'message' => 'Utilisateur non authentifié.',
                'data' => [],
            ], 401);
        }

        // Older databases use name; others also contain nom/prenom/role.
        $columns = ['id', 'email'];
        foreach (['name', 'nom', 'prenom', 'role'] as $column) {
            if (Schema::hasColumn('users', $column)) {
                $columns[] = $column;
            }
        }

        $users = User::where('id', '!=', $currentUser->id)
            ->select($columns)
            ->orderBy(Schema::hasColumn('users', 'name') ? 'name' : 'email')
            ->get();

        // Do not join users.email and patients.email in SQL: their collations differ.
        $patientsByEmail = Patient::query()
            ->select(['id', 'email', 'prenom', 'nom'])
            ->get()
            ->keyBy(fn (Patient $patient) => strtolower(trim($patient->email)));

        $contacts = $users->map(function (User $contact) use ($patientsByEmail) {
            $patient = $patientsByEmail->get(strtolower(trim($contact->email)));

            return [
                'id' => $contact->id,
                'patient_id' => $patient?->id,
                'prenom' => $patient?->prenom ?? $contact->getAttribute('prenom') ?? $contact->getAttribute('name') ?? '',
                'nom' => $patient?->nom ?? $contact->getAttribute('nom') ?? '',
                'role' => $patient ? 'Patient' : ($contact->getAttribute('role') ?? 'Utilisateur'),
                'email' => $contact->email,
            ];
        })->values();

        return response()->json([
            'status' => true,
            'count' => $contacts->count(),
            'data' => $contacts,
        ]);
    }

    /**
     * Contacts autorisés selon le rôle (messagerie restreinte).
     *
     *  - patient   → uniquement les médecins avec qui il a un RDV
     *  - médecin   → ses patients (RDV) + secrétaires du cabinet + admins
     *  - secrétaire→ médecins de son cabinet + admins
     *  - admin     → tous les utilisateurs (inchangé)
     */
    public function mesContacts(Request $request)
    {
        $currentUser = $request->user();

        if (!$currentUser) {
            return response()->json([
                'status' => false,
                'message' => 'Utilisateur non authentifié.',
                'data' => [],
            ], 401);
        }

        $currentId = $currentUser->id;

        // Emails autorisés (vide = aucun résultat)
        $allowedEmails = null;

        if ($currentUser instanceof User) {
            $role = $currentUser->role ?? null;

            if (in_array($role, ['admin', 'cabinet'], true)) {
                $allowedEmails = null; // null = tous (comportement historique)
            } elseif ($role === 'medecin') {
                $medecin = Medecin::where('email', $currentUser->email)->first();

                if ($medecin) {
                    $rdvPatientIds = RendezVous::where('medecin_id', $medecin->id)
                        ->pluck('patient_id')
                        ->unique();

                    $patientEmails = Patient::whereIn('id', $rdvPatientIds)
                        ->pluck('email');

                    $secretaireEmails = Secretaire::where('cabinet_id', $medecin->cabinet_id)
                        ->pluck('email');

                    $adminEmails = User::where('role', 'admin')->pluck('email');

                    $allowedEmails = $patientEmails
                        ->concat($secretaireEmails)
                        ->concat($adminEmails)
                        ->unique()
                        ->values();
                } else {
                    $allowedEmails = collect();
                }
            } elseif ($role === 'patient') {
                $patient = Patient::where('email', $currentUser->email)->first();

                if ($patient) {
                    $medecinIds = RendezVous::where('patient_id', $patient->id)
                        ->pluck('medecin_id')
                        ->unique();

                    $allowedEmails = Medecin::whereIn('id', $medecinIds)
                        ->pluck('email')
                        ->unique()
                        ->values();
                } else {
                    $allowedEmails = collect();
                }
            } elseif ($role === 'secretaire') {
                $secretaire = Secretaire::where('email', $currentUser->email)->first();
                $allowedEmails = $this->staffCabinetEmails($secretaire);
            } else {
                $allowedEmails = collect();
            }
        } elseif ($currentUser instanceof Secretaire) {
            $allowedEmails = $this->staffCabinetEmails($currentUser);
        } else {
            $allowedEmails = collect();
        }

        $columns = ['id', 'email'];
        foreach (['name', 'nom', 'prenom', 'role'] as $column) {
            if (Schema::hasColumn('users', $column)) {
                $columns[] = $column;
            }
        }

        $query = User::where('id', '!=', $currentId)->select($columns);

        if ($allowedEmails !== null) {
            $query->whereIn('email', $allowedEmails);
        }

        $users = $query
            ->orderBy(Schema::hasColumn('users', 'name') ? 'name' : 'email')
            ->get();

        // Do not join users.email and patients.email in SQL: collations differentes.
        $patientsByEmail = Patient::query()
            ->select(['id', 'email', 'prenom', 'nom'])
            ->get()
            ->keyBy(fn (Patient $patient) => strtolower(trim($patient->email)));

        /* Enrichissement : dernier message et messages non lus par contact
           (table `messages`, comptes de la table `users`). Comme pour la
           messagerie du personnel, ces informations alimentent la pastille de
           chaque discussion dans la liste des contacts. */
        $stats = [];

        if ($currentUser instanceof User) {
            $historique = \Illuminate\Support\Facades\DB::table('messages')
                ->where(function ($q) use ($currentId) {
                    $q->where('sender_id', $currentId)
                      ->orWhere('receiver_id', $currentId);
                })
                ->orderBy('created_at')
                ->orderBy('id')
                ->get(['sender_id', 'receiver_id', 'content', 'is_read', 'created_at']);

            foreach ($historique as $row) {
                $isSender = (int) $row->sender_id === (int) $currentId;
                $autreId = (int) ($isSender ? $row->receiver_id : $row->sender_id);

                if (!isset($stats[$autreId])) {
                    $stats[$autreId] = [
                        'unread' => 0,
                        'last_message' => null,
                        'last_at' => null,
                    ];
                }

                if (!$isSender && !$row->is_read) {
                    $stats[$autreId]['unread']++;
                }

                $stats[$autreId]['last_message'] = $row->content;
                $stats[$autreId]['last_at'] = $row->created_at;
            }
        }

        $contacts = $users->map(function (User $contact) use ($patientsByEmail, $stats) {
            $patient = $patientsByEmail->get(strtolower(trim($contact->email)));
            $stat = $stats[$contact->id] ?? [
                'unread' => 0,
                'last_message' => null,
                'last_at' => null,
            ];

            return [
                'id' => $contact->id,
                'patient_id' => $patient?->id,
                'prenom' => $patient?->prenom ?? $contact->getAttribute('prenom') ?? $contact->getAttribute('name') ?? '',
                'nom' => $patient?->nom ?? $contact->getAttribute('nom') ?? '',
                'role' => $patient ? 'Patient' : ($contact->getAttribute('role') ?? 'Utilisateur'),
                'email' => $contact->email,
                'unread' => $stat['unread'],
                'last_message' => $stat['last_message'],
                'last_at' => $stat['last_at'],
            ];
        })->values();

        return response()->json([
            'status' => true,
            'count' => $contacts->count(),
            'data' => $contacts,
        ]);
    }

    /**
     * Emails autorisés pour un membre du personnel de cabinet.
     */
    private function staffCabinetEmails(?Secretaire $secretaire)
    {
        if (!$secretaire) {
            return collect();
        }

        $medecinEmails = Medecin::where('cabinet_id', $secretaire->cabinet_id)
            ->pluck('email');

        $adminEmails = User::where('role', 'admin')->pluck('email');

        return $medecinEmails
            ->concat($adminEmails)
            ->unique()
            ->values();
    }
}
