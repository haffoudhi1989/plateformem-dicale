<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    /**
     * Liste des notifications avec pagination
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->get('per_page', 10);

        // Sécurité : éviter un nombre trop important
        $perPage = min(max($perPage, 1), 100);

        $notifications = Notification::orderBy(
            'created_at',
            'desc'
        )->paginate($perPage);

        return response()->json([
            'success' => true,
            'notifications' => $notifications->items(),
            'current_page' => $notifications->currentPage(),
            'last_page' => $notifications->lastPage(),
            'per_page' => $notifications->perPage(),
            'total' => $notifications->total(),
            'from' => $notifications->firstItem(),
            'to' => $notifications->lastItem(),
        ]);
    }

    /**
     * Ajouter une notification
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|string|max:50',
        ]);

        $notification = Notification::create([
            'type' => $validated['type'],
            'data' => [
                'title' => $validated['title'],
                'message' => $validated['message'],
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notification ajoutée avec succès.',
            'notification' => $notification,
        ], 201);
    }

    /**
     * Marquer une notification comme lue
     */
    public function markAsRead($id)
{
    $notification = Notification::findOrFail($id);

    $notification->update([
        'read_at' => now(),
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Notification marquée comme lue.',
        'notification' => $notification,
    ]);
}

public function markAllAsRead()
{
    Notification::whereNull('read_at')
        ->update([
            'read_at' => now(),
        ]);

    return response()->json([
        'success' => true,
        'message' => 'Toutes les notifications ont été marquées comme lues.',
    ]);
}
    /**
     * Supprimer une notification
     */
    public function destroy($id)
    {
        $notification = Notification::findOrFail($id);

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification supprimée.',
        ]);
    }
}
