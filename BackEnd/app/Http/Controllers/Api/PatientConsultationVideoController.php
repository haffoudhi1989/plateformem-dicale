<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConsultationVideo;
use App\Models\Patient;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PatientConsultationVideoController extends Controller
{
    /**
     * Récupérer le patient connecté.
     */
    private function getPatient(Request $request)
    {
        $user = $request->user();
        $patient = null;

        if (!empty($user->patient_id)) {
            $patient = Patient::find($user->patient_id);
        }

        if (!$patient && !empty($user->email)) {
            $patient = Patient::where('email', $user->email)->first();
        }

        return $patient;
    }

    /**
     * Restreindre une requête au praticien du cabinet du patient.
     *
     * Le patient ne voit que les consultations vidéo de son praticien de
     * cabinet (cabinet du patient → medecin.cabinet_id). Si le patient
     * n'est rattaché à aucun cabinet, aucune restriction n'est appliquée.
     */
    private function restreindreAuCabinet($query, $patient)
    {
        if (empty($patient->cabinet_id)) {
            return $query;
        }

        return $query->whereHas('rendezVous.medecin', function ($q) use ($patient) {
            $q->where('cabinet_id', $patient->cabinet_id);
        });
    }

    /**
     * Consultations vidéo à venir.
     */
    public function index(Request $request)
    {
        $patient = $this->getPatient($request);

        if (!$patient) {
            return response()->json([
                'message' => 'Patient non trouvé.',
                'data' => []
            ], 404);
        }

        $query = ConsultationVideo::with([
            'rendezVous.medecin',
            'rendezVous.medecin.specialite'
        ])
        ->whereHas('rendezVous', function ($query) use ($patient) {
            $query->where('patient_id', $patient->id);
        })
        ->whereIn('status', ['scheduled', 'in_progress'])
        ->whereHas('rendezVous', function ($query) {
            $query->whereDate('date_rdv', '>=', Carbon::today());
        });

        /* Praticien du cabinet du patient uniquement */
        $this->restreindreAuCabinet($query, $patient);

        $consultations = $query
            ->orderBy(
                'rendez_vous_id',
                'asc'
            )
            ->get();

        return response()->json([
            'patient' => $patient,
            'data' => $consultations
        ]);
    }

    /**
     * Historique des consultations vidéo.
     */
    public function historique(Request $request)
    {
        $patient = $this->getPatient($request);

        if (!$patient) {
            return response()->json([
                'message' => 'Patient non trouvé.',
                'data' => []
            ], 404);
        }

        $query = ConsultationVideo::with([
            'rendezVous.medecin',
            'rendezVous.medecin.specialite'
        ])
        ->whereHas('rendezVous', function ($query) use ($patient) {
            $query->where('patient_id', $patient->id);
        })
        ->whereIn('status', ['completed', 'cancelled']);

        /* Praticien du cabinet du patient uniquement */
        $this->restreindreAuCabinet($query, $patient);

        $consultations = $query
            ->orderBy('ended_at', 'desc')
            ->get();

        return response()->json([
            'patient' => $patient,
            'data' => $consultations
        ]);
    }

    /**
     * Statistiques des consultations vidéo.
     */
    public function stats(Request $request)
    {
        $patient = $this->getPatient($request);

        if (!$patient) {
            return response()->json([
                'message' => 'Patient non trouvé.'
            ], 404);
        }

        $consultations = ConsultationVideo::whereHas(
            'rendezVous',
            function ($query) use ($patient) {
                $query->where('patient_id', $patient->id);
            }
        );

        /* Praticien du cabinet du patient uniquement */
        $this->restreindreAuCabinet($consultations, $patient);

        $total = (clone $consultations)->count();

        $terminees = (clone $consultations)
            ->where('status', 'completed')
            ->count();

        $dureeTotale = (clone $consultations)
            ->where('status', 'completed')
            ->sum('duration');

        $dureeMoyenne = $terminees > 0
            ? round($dureeTotale / $terminees)
            : 0;

        return response()->json([
            'total' => $total,
            'terminees' => $terminees,
            'duree_totale' => $dureeTotale,
            'duree_moyenne' => $dureeMoyenne,
        ]);
    }

    /**
     * Terminer une consultation vidéo.
     */
    public function end(Request $request, $id)
    {
        $patient = $this->getPatient($request);

        if (!$patient) {
            return response()->json([
                'message' => 'Patient non trouvé.'
            ], 404);
        }

        $consultation = ConsultationVideo::with('rendezVous')
            ->where('id', $id)
            ->whereHas('rendezVous', function ($query) use ($patient) {
                $query->where('patient_id', $patient->id);
            })
            ->first();

        if (!$consultation) {
            return response()->json([
                'message' => 'Consultation vidéo non trouvée.'
            ], 404);
        }

        $endedAt = Carbon::now();

        if ($consultation->started_at) {
            $duration = $consultation->started_at->diffInSeconds($endedAt);
        } else {
            $duration = 0;
        }

        $consultation->update([
            'ended_at' => $endedAt,
            'duration' => $duration,
            'status' => 'completed',
        ]);

        return response()->json([
            'message' => 'Consultation terminée.',
            'data' => $consultation
        ]);
    }

    /**
     * Générer le token Agora.
     *
     * Cette méthode sera complétée lorsque nous configurerons Agora.
     */
    public function agoraToken(Request $request, $id)
    {
        $patient = $this->getPatient($request);

        if (!$patient) {
            return response()->json([
                'message' => 'Patient non trouvé.'
            ], 404);
        }

        $consultation = ConsultationVideo::with('rendezVous')
            ->where('id', $id)
            ->whereHas('rendezVous', function ($query) use ($patient) {
                $query->where('patient_id', $patient->id);
            })
            ->first();

        if (!$consultation) {
            return response()->json([
                'message' => 'Consultation vidéo non trouvée.'
            ], 404);
        }

        return response()->json([
            'message' => 'Consultation trouvée. Configuration Agora à venir.',
            'consultation' => $consultation
        ]);
    }
}