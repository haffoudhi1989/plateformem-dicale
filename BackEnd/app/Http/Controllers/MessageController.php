<?php

namespace App\Http\Controllers;

use App\Models\Medecin;
use App\Models\Message;
use App\Models\Patient;
use App\Models\RendezVous;
use App\Models\Secretaire;
use App\Models\User;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    /**
     * Lire les messages échangés avec un destinataire.
     * Restriction : seuls les contacts autorisés par le rôle sont accessibles.
     */
    public function getConversation($receiverId)
    {
        $authUser = auth()->user();

        if (!$this->receiverAllowed($authUser, (int) $receiverId)) {
            return response()->json([
                'message' => 'Discussion non autorisée avec ce destinataire.',
                'data' => [],
            ], 403);
        }

        $authId = auth()->id();

        $messages = Message::where(function ($query) use ($authId, $receiverId) {
            $query->where('sender_id', $authId)
                  ->where('receiver_id', $receiverId);
        })->orWhere(function ($query) use ($authId, $receiverId) {
            $query->where('sender_id', $receiverId)
                  ->where('receiver_id', $authId);
        })
        ->orderBy('created_at', 'asc')
        ->get();

        return response()->json(['data' => $messages]);
    }

    /**
     * Envoyer un message.
     * Restriction : patient ↔ son médecin uniquement,
     * personnel de cabinet ↔ ses collaborateurs autorisés.
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'content' => 'required|string|min:1',
        ]);

        $authUser = auth()->user();

        if (!$this->receiverAllowed($authUser, (int) $request->receiver_id)) {
            return response()->json([
                'message' => 'Envoi non autorisé vers ce destinataire.',
            ], 403);
        }

        $message = Message::create([
            'sender_id' => auth()->id(),
            'receiver_id' => $request->receiver_id,
            'content' => $request->content,
        ]);

        return response()->json(['data' => $message], 201);
    }

    /**
     * Marquer un message reçu comme lu.
     *
     * Appelé par la messagerie du front : l'ouverture d'une discussion marque
     * ses messages comme lus, ce qui décrémente immédiatement le compteur de
     * messages non lus (pastille de la barre latérale) sans attendre le
     * rafraîchissement automatique.
     */
    public function markAsRead($id)
    {
        $authUser = auth()->user();

        if (!$authUser instanceof User) {
            return response()->json([
                'success' => false,
                'message' => 'Messagerie non disponible pour ce compte.',
            ], 403);
        }

        $message = Message::find($id);

        if (!$message) {
            return response()->json([
                'success' => false,
                'message' => 'Message introuvable.',
            ], 404);
        }

        // Seul le destinataire peut marquer le message comme lu.
        if ((int) $message->receiver_id !== (int) $authUser->id) {
            return response()->json([
                'success' => false,
                'message' => 'Message non destiné à ce compte.',
            ], 403);
        }

        if (!$message->is_read) {
            $message->is_read = true;
            $message->save();
        }

        return response()->json([
            'success' => true,
            'data' => $message,
        ]);
    }

    /**
     * Vérifie qu'un compte users peut échanger avec le destinataire.
     */
    private function receiverAllowed($authUser, int $receiverId): bool
    {
        if (!$authUser || $receiverId <= 0) {
            return false;
        }

        // Les comptes hors table users (ex. secrétaire authentifiée
        // depuis la table secretaires) passent par la messagerie interne
        // /api/staff/messages, pas par la messagerie générique.
        if ($authUser instanceof Secretaire) {
            return false;
        }

        if (!($authUser instanceof User)) {
            return false;
        }

        $me = $authUser;
        $role = $me->role ?? null;

        // Admin et cabinet conservent un accès global (comportement historique).
        if (in_array($role, ['admin', 'cabinet'], true)) {
            return true;
        }

        $receiver = User::find($receiverId);

        if (!$receiver) {
            return false;
        }

        if ($role === 'patient') {
            // Le patient ne peut discuter qu'avec SES médecins (RDV).
            return $this->patientCanWriteTo($me, $receiver);
        }

        if ($role === 'medecin') {
            return $this->medecinCanWriteTo($me, $receiver);
        }

        if ($role === 'secretaire') {
            return $this->secretaireCanWriteTo($me, $receiver);
        }

        return false;
    }

    private function patientCanWriteTo(User $patientUser, User $receiver): bool
    {
        if (($receiver->role ?? null) !== 'medecin') {
            return false;
        }

        $patient = Patient::where('email', $patientUser->email)->first();
        $medecin = Medecin::where('email', $receiver->email)->first();

        if (!$patient || !$medecin) {
            return false;
        }

        return RendezVous::where('patient_id', $patient->id)
            ->where('medecin_id', $medecin->id)
            ->exists();
    }

    private function medecinCanWriteTo(User $medecinUser, User $receiver): bool
    {
        $role = $receiver->role ?? null;

        // Médecin → admin : autorisé.
        if ($role === 'admin') {
            return true;
        }

        $medecin = Medecin::where('email', $medecinUser->email)->first();

        if (!$medecin) {
            return false;
        }

        // Médecin → ses patients (RDV existant).
        if ($role === 'patient') {
            $patient = Patient::where('email', $receiver->email)->first();

            if (!$patient) {
                return false;
            }

            return RendezVous::where('medecin_id', $medecin->id)
                ->where('patient_id', $patient->id)
                ->exists();
        }

        // Médecin → secrétaire du même cabinet.
        if ($role === 'secretaire') {
            $secretaire = Secretaire::where('email', $receiver->email)->first();

            return $secretaire
                && $secretaire->cabinet_id
                && $medecin->cabinet_id
                && (int) $secretaire->cabinet_id === (int) $medecin->cabinet_id;
        }

        return false;
    }

    private function secretaireCanWriteTo(User $secretaireUser, User $receiver): bool
    {
        // Secrétaire → admin : autorisé.
        if (($receiver->role ?? null) === 'admin') {
            return true;
        }

        $secretaire = Secretaire::where('email', $secretaireUser->email)->first();

        if (!$secretaire || !$secretaire->cabinet_id) {
            return false;
        }

        // Secrétaire → médecin du même cabinet.
        if (($receiver->role ?? null) === 'medecin') {
            $medecin = Medecin::where('email', $receiver->email)->first();

            return $medecin
                && $medecin->cabinet_id
                && (int) $medecin->cabinet_id === (int) $secretaire->cabinet_id;
        }

        return false;
    }

    // Exemple dans Laravel (ContactController.php ou MessageController.php)
    public function getContacts()
    {
        // Récupère les médecins ou secrétaires disponibles pour le patient
        $contacts = User::whereIn('role', ['medecin', 'secretaire'])->get();

        return response()->json([
            'data' => $contacts
        ]);
    }
}
