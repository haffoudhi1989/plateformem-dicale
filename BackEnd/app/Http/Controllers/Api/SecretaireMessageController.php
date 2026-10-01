<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Secretaire;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SecretaireMessageController extends Controller
{
    /**
     * =====================================================
     * ADMIN - LISTE DES CONVERSATIONS AVEC LES SECRETaires
     * =====================================================
     */
    public function conversations()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            $conversations = Conversation::where(
                'admin_id',
                $user->id
            )
            ->where(
                'recipient_type',
                'secretaire'
            )
            ->with('messages')
            ->latest('updated_at')
            ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'conversations' => $conversations,
                ],
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des conversations.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * =====================================================
     * ADMIN - CREER UNE CONVERSATION
     * =====================================================
     */
    public function createConversation(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            $validated = $request->validate([
                'recipient_id' => [
                    'required',
                    'integer',
                    'exists:secretaires,id',
                ],
                'recipient_type' => [
                    'required',
                    'string',
                    'in:secretaire',
                ],
            ]);

            $conversation = Conversation::where(
                'admin_id',
                $user->id
            )
            ->where(
                'recipient_id',
                $validated['recipient_id']
            )
            ->where(
                'recipient_type',
                'secretaire'
            )
            ->first();

            if ($conversation) {
                return response()->json([
                    'success' => true,
                    'message' => 'Conversation existante.',
                    'data' => [
                        'conversation' => $conversation,
                    ],
                ]);
            }

            $conversation = Conversation::create([
                'admin_id' => $user->id,
                'recipient_id' => $validated['recipient_id'],
                'recipient_type' => 'secretaire',
                'last_message' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Conversation créée avec succès.',
                'data' => [
                    'conversation' => $conversation,
                ],
            ], 201);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de créer la conversation.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * =====================================================
     * ADMIN - AFFICHER UNE CONVERSATION
     * =====================================================
     */
    public function showConversation($conversationId)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            $conversation = Conversation::with('messages')
                ->where('id', $conversationId)
                ->where('admin_id', $user->id)
                ->where('recipient_type', 'secretaire')
                ->first();

            if (!$conversation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Conversation introuvable.',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'conversation' => $conversation,
                    'messages' => $conversation->messages,
                ],
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de récupérer la conversation.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * =====================================================
     * ENVOYER UN MESSAGE
     * ADMIN OU SECRETAIRE
     * =====================================================
     */
    public function sendMessage(Request $request, $conversationId)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            $validated = $request->validate([
                'content' => 'required|string|max:5000',
            ]);

            $conversation = Conversation::find($conversationId);

            if (!$conversation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Conversation introuvable.',
                ], 404);
            }

            /*
            |--------------------------------------------------
            | DETERMINER LE TYPE D'UTILISATEUR
            |--------------------------------------------------
            */

            if ($user instanceof Secretaire) {

                $senderId = $user->id;
                $senderType = 'secretaire';

                /*
                | Vérifier que la secrétaire appartient
                | bien à cette conversation.
                */

                if (
                    $conversation->recipient_id != $user->id ||
                    $conversation->recipient_type !== 'secretaire'
                ) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Utilisateur non autorisé.',
                    ], 403);
                }

            } else {

                $senderId = $user->id;
                $senderType = 'admin';

                /*
                | Vérifier que l'admin est bien propriétaire
                | de la conversation.
                */

                if ($conversation->admin_id != $user->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Utilisateur non autorisé.',
                    ], 403);
                }
            }

            /*
            |--------------------------------------------------
            | CREER LE MESSAGE
            |--------------------------------------------------
            */

            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $senderId,
                'sender_type' => $senderType,
                'content' => $validated['content'],
                'is_read' => false,
            ]);

            /*
            |--------------------------------------------------
            | METTRE A JOUR LA CONVERSATION
            |--------------------------------------------------
            */

            $conversation->update([
                'last_message' => $validated['content'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Message envoyé avec succès.',
                'data' => [
                    'message' => $message,
                    'conversation' => $conversation,
                ],
            ], 201);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi du message.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * =====================================================
     * SECRETAIRE - SES CONVERSATIONS
     * =====================================================
     */
    public function secretaireConversations()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            /*
            | Vérifier que l'utilisateur connecté
            | est bien une secrétaire.
            */

            if (!($user instanceof Secretaire)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non autorisé.',
                ], 403);
            }

            $conversations = Conversation::where(
                'recipient_id',
                $user->id
            )
            ->where(
                'recipient_type',
                'secretaire'
            )
            ->with('messages')
            ->latest('updated_at')
            ->get();

            return response()->json([
                'success' => true,
                'data' => $conversations,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des conversations.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * =====================================================
     * SECRETAIRE - SES MESSAGES
     * =====================================================
     */
    public function secretaireMessages($conversationId)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            if (!($user instanceof Secretaire)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non autorisé.',
                ], 403);
            }

            $conversation = Conversation::with('messages')
                ->where('id', $conversationId)
                ->where('recipient_id', $user->id)
                ->where('recipient_type', 'secretaire')
                ->first();

            if (!$conversation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Conversation introuvable.',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $conversation->messages,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de récupérer les messages.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * =====================================================
     * ADMIN - LISTE DES SECRETaires
     * =====================================================
     */
    public function secretaires()
    {
        try {
            $secretaires = Secretaire::where(
                'actif',
                true
            )
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get([
                'id',
                'prenom',
                'nom',
                'email',
                'telephone',
                'cabinet_id',
                'actif',
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'secretaires' => $secretaires,
                ],
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des secrétaires.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * =====================================================
     * SUPPRIMER CONVERSATION
     * =====================================================
     */
    public function destroyConversation($conversationId)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            $conversation = Conversation::where(
                'id',
                $conversationId
            )
            ->where(
                'admin_id',
                $user->id
            )
            ->first();

            if (!$conversation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Conversation introuvable.',
                ], 404);
            }

            $conversation->delete();

            return response()->json([
                'success' => true,
                'message' => 'Conversation supprimée avec succès.',
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer la conversation.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}