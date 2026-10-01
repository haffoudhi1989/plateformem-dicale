<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use Illuminate\Http\Request;

class PatientMessageController extends Controller
{
    /**
     * Récupérer toutes les conversations du patient connecté
     */
    public function conversations()
    {
        $patientId = auth()->id();

        // Recherche si le patient est le destinataire OU l'expéditeur
        $conversations = Conversation::with('secretaire')
            ->where(function ($query) use ($patientId) {
                $query->where('recipient_id', $patientId)
                      ->where('recipient_type', 'patient');
            })
            ->orWhere(function ($query) use ($patientId) {
                $query->where('sender_id', $patientId)
                      ->where('sender_type', 'patient');
            })
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'success'       => true,
            'conversations' => $conversations,
        ]);
    }

    /**
     * Récupérer les messages d'une conversation spécifique
     */
    public function messages($conversationId)
    {
        $patientId = auth()->id();

        // Vérification de sécurité : le patient doit faire partie de la conversation
        $conversation = Conversation::with('secretaire')
            ->where('id', $conversationId)
            ->where(function ($query) use ($patientId) {
                $query->where('recipient_id', $patientId)
                      ->orWhere('sender_id', $patientId);
            })
            ->firstOrFail();

        $messages = $conversation->messages()
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success'      => true,
            'conversation' => $conversation,
            'messages'     => $messages,
        ]);
    }

    /**
     * Envoyer un message dans une conversation
     */
    public function sendMessage(Request $request, $conversationId)
    {
        $request->validate([
            'content' => 'required|string',
        ]);

        $patientId = auth()->id();

        $conversation = Conversation::where('id', $conversationId)
            ->where(function ($query) use ($patientId) {
                $query->where('recipient_id', $patientId)
                      ->orWhere('sender_id', $patientId);
            })
            ->firstOrFail();

        $message = $conversation->messages()->create([
            'sender_id'   => $patientId,
            'sender_type' => 'patient',
            'content'     => $request->content,
        ]);

        $conversation->update([
            'last_message' => $request->content,
            'updated_at'   => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => $message,
        ], 201);
    }
}