<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medecin;
use App\Models\Secretaire;
use App\Models\StaffMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Messagerie interne du personnel :
 *   - médecin  ↔ secrétaire (même cabinet)
 *   - secrétaire ↔ admin
 *   - médecin  ↔ admin
 *
 * Les identifiants des interlocuteurs appartiennent à des tables
 * différentes (users / medecin / secretaires), chaque message stocke
 * donc un couple (type, id) pour l'expéditeur et le destinataire.
 */
class StaffMessageController extends Controller
{
    /* =====================================================
       IDENTITÉ DU PERSONNEL CONNECTÉ
    ===================================================== */

    private function resolveIdentity($user): ?array
    {
        if ($user instanceof Secretaire) {
            return [
                'type' => 'secretaire',
                'id' => $user->id,
                'cabinet_id' => $user->cabinet_id,
            ];
        }

        if ($user instanceof User) {
            return match ($user->role ?? null) {
                'admin' => [
                    'type' => 'admin',
                    'id' => $user->id,
                    'cabinet_id' => null,
                ],
                'medecin' => $this->resolveMedecinByEmail($user->email),
                'secretaire' => $this->resolveSecretaireByEmail($user->email),
                default => null,
            };
        }

        return null;
    }

    private function resolveMedecinByEmail(?string $email): ?array
    {
        if (!$email) {
            return null;
        }

        $medecin = Medecin::where('email', $email)->first();

        return $medecin ? [
            'type' => 'medecin',
            'id' => $medecin->id,
            'cabinet_id' => $medecin->cabinet_id,
        ] : null;
    }

    private function resolveSecretaireByEmail(?string $email): ?array
    {
        if (!$email) {
            return null;
        }

        $secretaire = Secretaire::where('email', $email)->first();

        return $secretaire ? [
            'type' => 'secretaire',
            'id' => $secretaire->id,
            'cabinet_id' => $secretaire->cabinet_id,
        ] : null;
    }

    /* =====================================================
       TOTAL DES MESSAGES NON LUS (toutes messageries)
    ===================================================== */

    /**
     * Nombre total de messages non lus pour le membre du personnel connecté.
     *
     * Sont comptés, pour le compte connecté uniquement :
     *   - les messages REÇUS pas encore lus ;
     *   - les messages ENVOYÉS pas encore lus par leur destinataire.
     *
     * Et ce dans les deux messageries :
     *   - la messagerie du personnel (table staff_messages, API /staff/messages) ;
     *   - la messagerie historique (table messages, ancienne API /messages),
     *     qui référence les comptes « users » (liaison par e-mail).
     */
    public function totalNonLus(Request $request): JsonResponse
    {
        $identite = $this->resolveIdentity($request->user());
        $utilisateur = $request->user();

        $staffRecus = 0;
        $staffEnvoyes = 0;

        /*
         * Le canal « Personnel » est de nouveau accessible depuis l'espace
         * médecin (onglet « Secrétaires » de la page Messagerie) : les messages
         * non lus de la messagerie du personnel sont donc comptés pour tous les
         * membres du personnel, médecin compris. Ils peuvent être ouverts — et
         * donc décrémentés — depuis cet onglet.
         *
         * L'espace médecin n'affiche que le secrétariat de son cabinet :
         * l'administration n'y figure pas, donc ses messages ne sont pas
         * comptés pour lui — sinon ils gonfleraient la pastille sans pouvoir
         * être ouverts, ni décrémentés.
         *
         * Le secrétariat, lui, correspond à l'ensemble de ses contacts
         * (médecins du cabinet + administration) : aucun filtre.
         */
        $contrepartie = match ($identite['type'] ?? null) {
            'medecin' => 'secretaire',
            'admin' => 'secretaire',
            default => null,
        };

        if ($identite) {
            $staffRecus = StaffMessage::where('receiver_type', $identite['type'])
                ->where('receiver_id', $identite['id'])
                ->where('is_read', false)
                ->when($contrepartie, fn ($q) => $q->where('sender_type', $contrepartie))
                ->count();

            $staffEnvoyes = StaffMessage::where('sender_type', $identite['type'])
                ->where('sender_id', $identite['id'])
                ->where('is_read', false)
                ->when($contrepartie, fn ($q) => $q->where('receiver_type', $contrepartie))
                ->count();
        }

        /*
         * La messagerie historique (table `messages`) est réservée aux
         * comptes de la table `users` : un secrétaire s'authentifie sur la
         * table `secretaires` et n'y a pas accès (MessageController refuse
         * toute discussion pour lui). Ses messages non lus y sont donc
         * volontairement exclus, sinon ils ne pourraient jamais décrémenter.
         */
        $compte = $utilisateur instanceof Secretaire
            ? null
            : ($utilisateur instanceof User
                ? $utilisateur
                : User::where('email', $utilisateur->email ?? null)->first());

        $historiqueRecus = 0;
        $historiqueEnvoyes = 0;

        if ($compte) {
            $historiqueRecus = \Illuminate\Support\Facades\DB::table('messages')
                ->where('receiver_id', $compte->id)
                ->where('is_read', false)
                ->count();

            $historiqueEnvoyes = \Illuminate\Support\Facades\DB::table('messages')
                ->where('sender_id', $compte->id)
                ->where('is_read', false)
                ->count();
        }

        $recus = $staffRecus + $historiqueRecus;
        $envoyes = $staffEnvoyes + $historiqueEnvoyes;

        /*
         * Le compteur affiché ne retient que les messages REÇUS non lus :
         * ce sont les seuls qui peuvent décrémenter quand on ouvre une
         * discussion (leur ouverture les marque comme lus). Les messages
         * envoyés pas encore lus par leur destinataire relèvent du compteur
         * du destinataire : ils sont donc renvoyés à titre indicatif.
         */
        return response()->json([
            'success' => true,
            'staff' => $staffRecus,
            'historique' => $historiqueRecus,
            'recus' => $recus,
            'envoyes' => $envoyes,
            'total' => $recus,
        ]);
    }

    /* =====================================================
       FORMAT DES CONTACTS
    ===================================================== */

    private function formatMedecin(Medecin $medecin): array
    {
        return [
            'type' => 'medecin',
            'id' => $medecin->id,
            'prenom' => $medecin->prenom,
            'nom' => $medecin->nom,
            'email' => $medecin->email,
            'groupe' => 'Médecins',
        ];
    }

    private function formatSecretaire(Secretaire $secretaire): array
    {
        return [
            'type' => 'secretaire',
            'id' => $secretaire->id,
            'prenom' => $secretaire->prenom,
            'nom' => $secretaire->nom,
            'email' => $secretaire->email,
            'groupe' => 'Secrétaires',
        ];
    }

    private function formatAdmin(User $admin): array
    {
        return [
            'type' => 'admin',
            'id' => $admin->id,
            'prenom' => null,
            'nom' => $admin->name ?? 'Administrateur',
            'email' => $admin->email,
            'groupe' => 'Administration',
        ];
    }

    /* =====================================================
       LISTE DES CONTACTS AUTORISÉS
    ===================================================== */

    public function contacts(Request $request): JsonResponse
    {
        $me = $this->resolveIdentity($request->user());

        if (!$me) {
            return response()->json([
                'success' => false,
                'message' => 'Messagerie interne non disponible pour ce compte.',
            ], 403);
        }

        $contacts = [];

        if ($me['type'] === 'admin') {
            Secretaire::where('actif', true)
                ->orderBy('nom')
                ->orderBy('prenom')
                ->get()
                ->each(function ($s) use (&$contacts) {
                    $contacts[] = $this->formatSecretaire($s);
                });

            Medecin::orderBy('nom')
                ->orderBy('prenom')
                ->get()
                ->each(function ($m) use (&$contacts) {
                    $contacts[] = $this->formatMedecin($m);
                });
        } else {
            // Secrétaire ou médecin : mêmes règles de visibilité.
            $cabinetId = $me['cabinet_id'] ?? null;

            if ($me['type'] === 'secretaire') {
                Medecin::when($cabinetId, fn ($q) => $q->where('cabinet_id', $cabinetId))
                    ->orderBy('nom')
                    ->orderBy('prenom')
                    ->get()
                    ->each(function ($m) use (&$contacts) {
                        $contacts[] = $this->formatMedecin($m);
                    });
            } else {
                Secretaire::when($cabinetId, fn ($q) => $q->where('cabinet_id', $cabinetId))
                    ->orderBy('nom')
                    ->orderBy('prenom')
                    ->get()
                    ->each(function ($s) use (&$contacts) {
                        $contacts[] = $this->formatSecretaire($s);
                    });
            }

            User::where('role', 'admin')
                ->orderBy('name')
                ->get()
                ->each(function ($admin) use (&$contacts) {
                    $contacts[] = $this->formatAdmin($admin);
                });
        }

        /* =====================================================
           ENRICHISSEMENT : non-lus + dernier message par contact
        ===================================================== */

        $stats = [];

        $rows = StaffMessage::query()
            ->where(function ($q) use ($me) {
                $q->where('sender_type', $me['type'])
                  ->where('sender_id', $me['id']);
            })
            ->orWhere(function ($q) use ($me) {
                $q->where('receiver_type', $me['type'])
                  ->where('receiver_id', $me['id']);
            })
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->get([
                'sender_type',
                'sender_id',
                'receiver_type',
                'receiver_id',
                'content',
                'is_read',
                'created_at',
            ]);

        foreach ($rows as $row) {
            $isSender = $row->sender_type === $me['type']
                && (int) $row->sender_id === (int) $me['id'];

            $otherType = $isSender ? $row->receiver_type : $row->sender_type;
            $otherId = (int) ($isSender ? $row->receiver_id : $row->sender_id);
            $key = $otherType . '-' . $otherId;

            if (!isset($stats[$key])) {
                $stats[$key] = [
                    'unread' => 0,
                    'last_message' => null,
                    'last_at' => null,
                ];
            }

            if (!$isSender && !$row->is_read) {
                $stats[$key]['unread']++;
            }

            $stats[$key]['last_message'] = $row->content;
            $stats[$key]['last_at'] = optional($row->created_at)->toDateTimeString();
        }

        $contacts = array_map(function (array $contact) use ($stats) {
            $key = $contact['type'] . '-' . $contact['id'];

            $stat = $stats[$key] ?? [
                'unread' => 0,
                'last_message' => null,
                'last_at' => null,
            ];

            return array_merge($contact, $stat);
        }, $contacts);

        return response()->json([
            'success' => true,
            'me' => $me,
            'data' => $contacts,
        ]);
    }

    /* =====================================================
       CONVERSATION ENTRE DEUX INTERLOCUTEURS
    ===================================================== */

    public function conversation(Request $request): JsonResponse
    {
        $me = $this->resolveIdentity($request->user());

        if (!$me) {
            return response()->json([
                'success' => false,
                'message' => 'Messagerie interne non disponible pour ce compte.',
            ], 403);
        }

        $validated = $request->validate([
            'other_type' => 'required|string|in:medecin,secretaire,admin',
            'other_id' => 'required|integer',
            'date' => 'nullable|date',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $otherType = $validated['other_type'];
        $otherId = (int) $validated['other_id'];

        if ($otherType === $me['type'] && $otherId === $me['id']) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas discuter avec vous-même.',
            ], 422);
        }

        if (!$this->authorizedPair($me, $otherType, $otherId)) {
            return response()->json([
                'success' => false,
                'message' => 'Discussion non autorisée avec ce contact.',
            ], 403);
        }

        $query = StaffMessage::between(
            $me['type'],
            $me['id'],
            $otherType,
            $otherId
        );

        if (!empty($validated['date'])) {
            $query->whereDate('created_at', $validated['date']);
        } else {
            if (!empty($validated['from'])) {
                $query->whereDate('created_at', '>=', $validated['from']);
            }
            if (!empty($validated['to'])) {
                $query->whereDate('created_at', '<=', $validated['to']);
            }
        }

        $messages = $query->orderBy('created_at', 'asc')->get();

        // Marquer les messages reçus comme lus
        StaffMessage::where('receiver_type', $me['type'])
            ->where('receiver_id', $me['id'])
            ->where('sender_type', $otherType)
            ->where('sender_id', $otherId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'data' => $messages,
        ]);
    }

    /* =====================================================
       ENVOI D'UN MESSAGE
    ===================================================== */

    public function send(Request $request): JsonResponse
    {
        $me = $this->resolveIdentity($request->user());

        if (!$me) {
            return response()->json([
                'success' => false,
                'message' => 'Messagerie interne non disponible pour ce compte.',
            ], 403);
        }

        $validated = $request->validate([
            'receiver_type' => 'required|string|in:medecin,secretaire,admin',
            'receiver_id' => 'required|integer',
            'content' => 'required|string|min:1|max:5000',
        ]);

        $receiverType = $validated['receiver_type'];
        $receiverId = (int) $validated['receiver_id'];

        if (!$this->authorizedPair($me, $receiverType, $receiverId)) {
            return response()->json([
                'success' => false,
                'message' => 'Envoi non autorisé vers ce contact.',
            ], 403);
        }

        $message = StaffMessage::create([
            'sender_type' => $me['type'],
            'sender_id' => $me['id'],
            'receiver_type' => $receiverType,
            'receiver_id' => $receiverId,
            'content' => $validated['content'],
            'is_read' => false,
        ]);

        return response()->json([
            'success' => true,
            'data' => $message,
        ], 201);
    }

    /* =====================================================
       RÈGLES D'AUTORISATION ENTRE DEUX CONTACTS
    ===================================================== */

    private function authorizedPair(array $me, string $otherType, int $otherId): bool
    {
        if ($me['type'] === $otherType) {
            return false;
        }

        // L'admin peut échanger avec tout le personnel.
        if ($me['type'] === 'admin') {
            return in_array($otherType, ['medecin', 'secretaire'], true);
        }
        if ($otherType === 'admin') {
            return in_array($me['type'], ['medecin', 'secretaire'], true);
        }

        // médecin ↔ secrétaire : même cabinet obligatoirement.
        if (
            in_array($me['type'], ['medecin', 'secretaire'], true)
            && in_array($otherType, ['medecin', 'secretaire'], true)
        ) {
            $otherCabinet = $this->cabinetOf($otherType, $otherId);

            return $otherCabinet !== null
                && ($me['cabinet_id'] ?? null) !== null
                && (int) $otherCabinet === (int) $me['cabinet_id'];
        }

        return false;
    }

    private function cabinetOf(string $type, int $id): ?int
    {
        if ($type === 'medecin') {
            $row = Medecin::find($id);
            return $row?->cabinet_id;
        }
        if ($type === 'secretaire') {
            $row = Secretaire::find($id);
            return $row?->cabinet_id;
        }
        return null;
    }
}
