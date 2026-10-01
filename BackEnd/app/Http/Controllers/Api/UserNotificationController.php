<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medecin;
use App\Models\Notification;
use App\Models\Patient;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Notifications in-app du patient et du médecin connectés.
 *
 * Le destinataire est résolu à partir du compte utilisateur
 * (même logique que les autres contrôleurs : patient_id / medecin_id
 * si présents sur l'utilisateur, sinon correspondance par e-mail).
 */
class UserNotificationController extends Controller
{
    /**
     * Notifications du destinataire connecté.
     *
     * GET /api/notifications
     */
    public function index(Request $request): JsonResponse
    {
        [$recipientType, $recipientId] = $this->resolveRecipient($request);

        if (!$recipientType || !$recipientId) {
            return response()->json([
                'success' => true,
                'data' => [],
                'unread' => 0,
            ]);
        }

        $query = Notification::where('recipient_type', $recipientType)
            ->where('recipient_id', $recipientId)
            ->orderByDesc('created_at');

        $unread = (clone $query)->whereNull('read_at')->count();

        $data = $query->get()->map(function (Notification $n) {
            return [
                'id' => $n->id,
                'type' => $n->type,
                'title' => $n->data['title'] ?? 'Notification',
                'message' => $n->data['message'] ?? '',
                'read_at' => $n->read_at?->toISOString(),
                'created_at' => $n->created_at?->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'unread' => $unread,
        ]);
    }

    /**
     * Marquer une notification comme lue.
     *
     * PUT /api/notifications/{id}/read
     */
    public function markAsRead(Request $request, $id): JsonResponse
    {
        [$recipientType, $recipientId] = $this->resolveRecipient($request);

        $notification = $this->findOwned($id, $recipientType, $recipientId);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification introuvable.',
            ], 404);
        }

        $notification->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marquée comme lue.',
        ]);
    }

    /**
     * Tout marquer comme lu.
     *
     * PUT /api/notifications/read-all
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        [$recipientType, $recipientId] = $this->resolveRecipient($request);

        if ($recipientType && $recipientId) {
            Notification::where('recipient_type', $recipientType)
                ->where('recipient_id', $recipientId)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Toutes les notifications ont été marquées comme lues.',
        ]);
    }

    /**
     * Résolution patient / médecin du compte connecté.
     *
     * @return array{0: ?string, 1: ?int}
     */
    private function resolveRecipient(Request $request): array
    {
        $user = $request->user();

        if (!$user) {
            return [null, null];
        }

        $role = strtolower((string) ($user->role ?? ''));

        // Médecin
        if (str_contains($role, 'medecin')) {
            $medecin = !empty($user->medecin_id)
                ? Medecin::find($user->medecin_id)
                : Medecin::where('email', $user->email)->first();

            return $medecin
                ? [NotificationService::RECIPIENT_MEDECIN, $medecin->id]
                : [null, null];
        }

        // Patient
        if (str_contains($role, 'patient')) {
            $patient = !empty($user->patient_id)
                ? Patient::find($user->patient_id)
                : Patient::where('email', $user->email)->first();

            return $patient
                ? [NotificationService::RECIPIENT_PATIENT, $patient->id]
                : [null, null];
        }

        return [null, null];
    }

    /**
     * Notification appartenant au destinataire connecté.
     */
    private function findOwned(int $id, ?string $recipientType, ?int $recipientId): ?Notification
    {
        if (!$recipientType || !$recipientId) {
            return null;
        }

        return Notification::where('id', $id)
            ->where('recipient_type', $recipientType)
            ->where('recipient_id', $recipientId)
            ->first();
    }
}
