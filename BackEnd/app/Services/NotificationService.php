<?php

namespace App\Services;

use App\Models\Notification;

/**
 * Création centralisée des notifications in-app.
 *
 * recipient_type : 'patient' | 'medecin'
 * recipient_id   : id de la table patients ou medecin
 */
class NotificationService
{
    public const RECIPIENT_PATIENT = 'patient';

    public const RECIPIENT_MEDECIN = 'medecin';

    public static function notify(
        string $recipientType,
        int $recipientId,
        string $title,
        string $message,
        string $type = 'info'
    ): ?Notification {
        if (!in_array($recipientType, [self::RECIPIENT_PATIENT, self::RECIPIENT_MEDECIN], true)) {
            return null;
        }

        if ($recipientId <= 0) {
            return null;
        }

        return Notification::create([
            'recipient_type' => $recipientType,
            'recipient_id' => $recipientId,
            'type' => $type,
            'data' => [
                'title' => $title,
                'message' => $message,
            ],
        ]);
    }

    public static function notifyPatient(
        int $patientId,
        string $title,
        string $message,
        string $type = 'info'
    ): ?Notification {
        return self::notify(self::RECIPIENT_PATIENT, $patientId, $title, $message, $type);
    }

    public static function notifyMedecin(
        int $medecinId,
        string $title,
        string $message,
        string $type = 'info'
    ): ?Notification {
        return self::notify(self::RECIPIENT_MEDECIN, $medecinId, $title, $message, $type);
    }
}
