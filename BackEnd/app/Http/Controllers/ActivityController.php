<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    /**
     * Liste des activités récentes
     */
    public function index()
    {
        $activities = Activity::latest()
            ->take(10)
            ->get()
            ->map(function ($activity) {
                return [
                    'id' => $activity->id,
                    'type' => $activity->type,
                    'title' => $activity->title,
                    'desc' => $activity->description,
                    'time' => $activity->created_at
                        ? $activity->created_at->diffForHumans()
                        : '',
                ];
            });

        return response()->json([
            'success' => true,
            'activities' => $activities,
        ]);
    }

    /**
     * Créer une activité
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|max:50',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
        ]);

        $activity = Activity::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Activité créée avec succès.',
            'activity' => $activity,
        ], 201);
    }

    /**
     * Supprimer une activité
     */
    public function destroy($id)
    {
        $activity = Activity::findOrFail($id);

        $activity->delete();

        return response()->json([
            'success' => true,
            'message' => 'Activité supprimée avec succès.',
        ]);
    }
}