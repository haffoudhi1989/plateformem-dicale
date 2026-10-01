<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Patient;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        

$notifications = $user->notifications()->latest()->get();

        if (!$user) {
            return response()->json([
                'message' => 'Utilisateur non authentifié.'
            ], 401);
        }

        // Trouver le patient correspondant à l'utilisateur connecté
        $patient = Patient::where('user_id', $user->id)->first();

        if (!$patient) {
            return response()->json([
                'data' => [],
                'message' => 'Patient introuvable.'
            ], 200);
        }

        $notifications = Notification::where(
            'patient_id',
            $patient->id
        )
        ->orderByDesc('created_at')
        ->get();

        return response()->json([
            'data' => $notifications
        ]);
    }
}