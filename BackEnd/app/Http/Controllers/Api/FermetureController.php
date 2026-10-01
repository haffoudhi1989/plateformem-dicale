<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Fermeture;
use App\Models\Medecin;
use App\Models\RendezVous;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class FermetureController extends Controller
{
    /**
     * Liste des fermetures / absences d'un cabinet.
     *
     * GET /api/fermetures?cabinet_id=1
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'cabinet_id' => 'required|exists:cabinets,id',
        ]);

        $fermetures = Fermeture::where('cabinet_id', $request->cabinet_id)
            ->with([
                'medecin:id,nom,prenom',
                'patient:id,nom,prenom',
            ])
            ->orderBy('date_debut')
            ->orderBy('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $fermetures,
        ]);
    }

    /**
     * Créer une fermeture / absence (jour férié, médecin, patient).
     *
     * POST /api/fermetures
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cabinet_id' => 'required|exists:cabinets,id',

            'type' => [
                'required',
                'string',
                'in:jour_ferie,absence_medecin,absence_patient',
            ],

            'date_debut' => 'required|date',
            'date_fin' => 'nullable|date|after_or_equal:date_debut',

            'medecin_id' => [
                'nullable',
                'integer',
                'required_if:type,absence_medecin',
                'exists:medecin,id',
            ],

            'patient_id' => [
                'nullable',
                'integer',
                'required_if:type,absence_patient',
                'exists:patients,id',
            ],

            'motif' => 'nullable|string|max:255',
        ]);

        $fermeture = Fermeture::create([
            'cabinet_id' => $validated['cabinet_id'],
            'type' => $validated['type'],
            'date_debut' => $validated['date_debut'],
            'date_fin' => $validated['date_fin']
                ?? $validated['date_debut'],
            'medecin_id' => $validated['medecin_id'] ?? null,
            'patient_id' => $validated['patient_id'] ?? null,
            'motif' => $validated['motif'] ?? null,
        ]);

        $fermeture->load([
            'medecin:id,nom,prenom',
            'patient:id,nom,prenom',
        ]);

        $this->notifierAbsences($fermeture);

        return response()->json([
            'success' => true,
            'message' => 'Fermeture enregistrée avec succès.',
            'data' => $fermeture,
        ], 201);
    }

    /**
     * Supprimer une fermeture / absence.
     *
     * DELETE /api/fermetures/{fermeture}
     */
    public function destroy(Fermeture $fermeture): JsonResponse
    {
        $fermeture->delete();

        return response()->json([
            'success' => true,
            'message' => 'Fermeture supprimée avec succès.',
        ]);
    }

    /**
     * Notifie les patients / médecins concernés quand un jour est bloqué :
     * - jour_ferie        : fermeture du cabinet -> patients + médecins du cabinet
     * - absence_medecin   : prévenir les patients ayant un RDV avec ce médecin
     * - absence_patient   : prévenir les médecins ayant un RDV avec ce patient
     */
    private function notifierAbsences(Fermeture $fermeture): void
    {
        if (!in_array($fermeture->type, ['jour_ferie', 'absence_medecin', 'absence_patient'], true)) {
            return;
        }

        $debut = Carbon::parse($fermeture->date_debut)->format('d/m/Y');
        $fin = $fermeture->date_fin
            ? Carbon::parse($fermeture->date_fin)->format('d/m/Y')
            : $debut;
        $periode = $debut === $fin ? "le {$debut}" : "du {$debut} au {$fin}";

        // Blocage d'un jour férié / fermeture du cabinet : on prévient
        // tous les patients et médecins du cabinet ayant des RDV sur la période.
        if ($fermeture->type === 'jour_ferie') {
            $medecinsCabinet = Medecin::where('cabinet_id', $fermeture->cabinet_id)
                ->pluck('id');

            $rdvs = RendezVous::whereIn('medecin_id', $medecinsCabinet)
                ->whereBetween('date_rdv', [
                    $fermeture->date_debut,
                    $fermeture->date_fin ?? $fermeture->date_debut,
                ])
                ->where('statut', 'not like', '%annul%')
                ->get();

            foreach ($rdvs->groupBy('patient_id') as $patientId => $liste) {
                $n = count($liste);
                $details = $this->detailsRdvs($liste);
                NotificationService::notifyPatient(
                    (int) $patientId,
                    'Cabinet fermé (jour férié)',
                    $n === 1
                        ? "Le cabinet sera fermé {$periode}. Votre rendez-vous concerné : {$details} — merci de le reporter."
                        : "Le cabinet sera fermé {$periode}. Vos {$n} rendez-vous concernés : {$details} — merci de les reporter."
                );
            }

            foreach ($rdvs->groupBy('medecin_id') as $medecinId => $liste) {
                $n = count($liste);
                $details = $this->detailsRdvs($liste);
                NotificationService::notifyMedecin(
                    (int) $medecinId,
                    'Cabinet fermé (jour férié)',
                    "Le cabinet sera fermé {$periode} : {$n} rendez-vous à reporter sur cette période. Détail : {$details}."
                );
            }

            return;
        }

        $rdvs = RendezVous::whereBetween('date_rdv', [
            $fermeture->date_debut,
            $fermeture->date_fin ?? $fermeture->date_debut,
        ])
            ->where('statut', 'not like', '%annul%')
            ->get();

        // Absence d'un médecin -> prévenir ses patients ayant un RDV dans la période
        if ($fermeture->type === 'absence_medecin') {
            $nomMedecin = $fermeture->medecin
                ? 'Dr ' . trim(($fermeture->medecin->prenom ?? '') . ' ' . ($fermeture->medecin->nom ?? ''))
                : 'le médecin';

            $parPatient = $rdvs
                ->where('medecin_id', $fermeture->medecin_id)
                ->groupBy('patient_id');

            foreach ($parPatient as $patientId => $liste) {
                $n = count($liste);
                $details = $this->detailsRdvs($liste);
                NotificationService::notifyPatient(
                    (int) $patientId,
                    'Absence du médecin',
                    $n === 1
                        ? "{$nomMedecin} sera absent {$periode}. Votre rendez-vous concerné : {$details} — merci de le reporter."
                        : "{$nomMedecin} sera absent {$periode}. Vos {$n} rendez-vous concernés : {$details} — merci de les reporter."
                );
            }

            return;
        }

        // Absence d'un patient -> prévenir ses médecins ayant un RDV dans la période
        $nomPatient = $fermeture->patient
            ? trim(($fermeture->patient->prenom ?? '') . ' ' . ($fermeture->patient->nom ?? '')) ?: 'le patient'
            : 'le patient';

        $parMedecin = $rdvs
            ->where('patient_id', $fermeture->patient_id)
            ->groupBy('medecin_id');

        foreach ($parMedecin as $medecinId => $liste) {
            $n = count($liste);
            $details = $this->detailsRdvs($liste);
            NotificationService::notifyMedecin(
                (int) $medecinId,
                "Absence d'un patient",
                "Votre patient {$nomPatient} a posé une absence {$periode} ({$n} rendez-vous à reporter). Détail : {$details}."
            );
        }
    }

    /**
     * Détail des rendez-vous concernés (dates + heures).
     *
     * @param  \Illuminate\Support\Collection|array  $rdvs
     */
    private function detailsRdvs($rdvs): string
    {
        $liste = collect($rdvs)
            ->sortBy('date_rdv')
            ->values();

        $parts = $liste->take(3)
            ->map(function ($r) {
                $date = Carbon::parse($r->date_rdv)->format('d/m');
                $heure = $r->heure_rdv ? substr($r->heure_rdv, 0, 5) : '';

                return $heure ? "{$date} à {$heure}" : $date;
            })
            ->all();

        $texte = implode(', ', $parts);
        $total = $liste->count();

        if ($total > 3) {
            $reste = $total - 3;
            $texte .= ' (+ ' . $reste . ' autre' . ($reste > 1 ? 's' : '') . ')';
        }

        return $texte !== '' ? $texte : '—';
    }
}
