<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Cabinet;
use App\Models\Medecin;
use App\Models\Patient;
use App\Models\Paiement;
use App\Models\RendezVous;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // =====================================================
        // STATISTIQUES
        // =====================================================

        $nombreMedecins = Medecin::count();

        $nombrePatients = Patient::count();

        $nombreRendezVous = RendezVous::count();

        $revenusAbonnements = (float) \App\Models\CabinetAbonnement::where(function ($q) {
            $q->where('statut', 'Payé')->orWhere('statut', 'paye');
        })->sum('montant');

        $revenus = ($revenusAbonnements > 0) ? $revenusAbonnements : (float) Paiement::sum('montant');


        // =====================================================
        // DERNIERS RENDEZ-VOUS
        // =====================================================

        $derniersRendezVous = RendezVous::with([
            'patient',
            'medecin'
        ])
            ->latest()
            ->take(5)
            ->get();


        // =====================================================
        // REPONSE
        // =====================================================

        return response()->json([

            'success' => true,

            'stats' => [

                'medecins' => $nombreMedecins,

                'patients' => $nombrePatients,

                'rendez_vous' => $nombreRendezVous,

                'revenus' => $revenus,

            ],

            'derniers_rendez_vous' => $derniersRendezVous,

        ]);
    }
    public function medecin(Request $request)
{
    return response()->json([
        'success' => true,
        'message' => 'Accès dashboard médecin autorisé.',
        'user' => $request->user(),
    ]);
}

    /**
     * Données du tableau de bord du médecin connecté.
     */
    public function medecinDashboard(Request $request)
    {
        $user = $request->user();
        $medecin = !empty($user->medecin_id)
            ? Medecin::with(['specialite', 'cabinet'])->find($user->medecin_id)
            : Medecin::with(['specialite', 'cabinet'])->where('email', $user->email)->first();

        if (!$medecin) {
            return response()->json(['message' => 'Médecin non trouvé.'], 404);
        }

        $rendezVous = RendezVous::with('patient')
            ->where('medecin_id', $medecin->id)
            ->orderBy('date_rdv', 'asc')
            ->orderBy('heure_rdv', 'asc')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | COURBE : RENDEZ-VOUS PAR MOIS (6 derniers mois)
        |--------------------------------------------------------------------------
        */

        $parMois = RendezVous::selectRaw(
            'DATE_FORMAT(date_rdv, "%Y-%m") as mois, COUNT(*) as total'
        )
            ->where('medecin_id', $medecin->id)
            ->where('date_rdv', '>=', now()->subMonths(5)->startOfMonth())
            ->where('date_rdv', '<=', now()->endOfMonth())
            ->groupBy('mois')
            ->pluck('total', 'mois');

        $rendezVousParMois = collect();

        for ($i = 5; $i >= 0; $i--) {
            $mois = now()->subMonths($i)->format('Y-m');
            $rendezVousParMois->push([
                'mois' => $mois,
                'total' => (int) ($parMois[$mois] ?? 0),
            ]);
        }

        return response()->json([
            'medecin' => $medecin,
            'rendez_vous' => $rendezVous,
            'patients' => $rendezVous->pluck('patient')->filter()->unique('id')->values(),
            'rendez_vous_par_mois' => $rendezVousParMois,
        ]);
    }

public function secretaire(Request $request)
{
    $user = $request->user();

    // Filtrage par secrétaire : uniquement les médecins et RDV de son cabinet
    $cabinetId = $user->cabinet_id ?? null;

    $nombreMedecins = \App\Models\Medecin::where(
        'cabinet_id',
        $cabinetId
    )->count();

    $nombrePatients = \App\Models\Patient::count();

    $nombreRendezVous = \App\Models\RendezVous::whereHas(
        'medecin',
        function ($q) use ($cabinetId) {
            $q->where('cabinet_id', $cabinetId);
        }
    )->count();

    $derniersRendezVous = \App\Models\RendezVous::with(['patient', 'medecin'])
        ->whereHas(
            'medecin',
            function ($q) use ($cabinetId) {
                $q->where('cabinet_id', $cabinetId);
            }
        )
        ->latest()
        ->take(5)
        ->get();

    /*
    |--------------------------------------------------------------------------
    | COURBE : RENDEZ-VOUS PAR MOIS (6 derniers mois)
    |--------------------------------------------------------------------------
    */

    $parMois = \App\Models\RendezVous::selectRaw(
        'DATE_FORMAT(date_rdv, "%Y-%m") as mois, COUNT(*) as total'
    )
        ->whereHas(
            'medecin',
            function ($q) use ($cabinetId) {
                $q->where('cabinet_id', $cabinetId);
            }
        )
        ->where('date_rdv', '>=', now()->subMonths(5)->startOfMonth())
        ->where('date_rdv', '<=', now()->endOfMonth())
        ->groupBy('mois')
        ->pluck('total', 'mois');

    $rendezVousParMois = collect();

    for ($i = 5; $i >= 0; $i--) {
        $mois = now()->subMonths($i)->format('Y-m');
        $rendezVousParMois->push([
            'mois' => $mois,
            'total' => (int) ($parMois[$mois] ?? 0),
        ]);
    }

    return response()->json([
        'success' => true,
        'message' => 'Accès dashboard secrétaire autorisé.',
        'user' => $request->user(),
        'stats' => [
            'medecins' => $nombreMedecins,
            'patients' => $nombrePatients,
            'rendez_vous' => $nombreRendezVous,
        ],
        'derniers_rendez_vous' => $derniersRendezVous,
        'rendez_vous_par_mois' => $rendezVousParMois,
    ]);
}

public function cabinet(Request $request)
{
    $user = $request->user();
    $cabinetId = $user->cabinet_id ?? null;

    if (!$cabinetId) {
        return response()->json([
            'success' => false,
            'message' => 'Aucun cabinet associé à ce compte.',
        ], 404);
    }

    $cabinet = Cabinet::with([
        'medecins.specialite',
        'secretaires',
    ])->find($cabinetId);

    if (!$cabinet) {
        return response()->json([
            'success' => false,
            'message' => 'Cabinet introuvable.',
        ], 404);
    }

    $medecinIds = $cabinet->medecins->pluck('id')->all();
    $patientIds = Patient::where('cabinet_id', $cabinetId)->pluck('id');

    /*
    |--------------------------------------------------------------------------
    | STATISTIQUES
    |--------------------------------------------------------------------------
    */

    $rdvQuery = RendezVous::whereIn('medecin_id', $medecinIds);

    $rdvTotal = (clone $rdvQuery)->count();
    $rdvAujourdhui = (clone $rdvQuery)
        ->whereDate('date_rdv', now()->toDateString())
        ->count();
    $rdvSemaine = (clone $rdvQuery)
        ->whereBetween('date_rdv', [
            now()->startOfWeek()->toDateString(),
            now()->endOfWeek()->toDateString(),
        ])
        ->count();
    $rdvEnAttente = (clone $rdvQuery)
        ->whereRaw('LOWER(REPLACE(statut, " ", "_")) = ?', ['en_attente'])
        ->count();
    $revenus = Paiement::whereIn('patient_id', $patientIds)->sum('montant');

    // Estimation : 8 créneaux/jour × 5 jours × nombre de médecins
    $tauxOccupation = $medecinIds
        ? min(100, (int) round(($rdvSemaine / max(1, count($medecinIds) * 40)) * 100))
        : 0;

    /*
    |--------------------------------------------------------------------------
    | COURBE : RENDEZ-VOUS PAR MOIS (6 derniers mois)
    |--------------------------------------------------------------------------
    */

    $moisFrancais = [
        '01' => 'janv.', '02' => 'févr.', '03' => 'mars', '04' => 'avr.',
        '05' => 'mai', '06' => 'juin', '07' => 'juil.', '08' => 'août',
        '09' => 'sept.', '10' => 'oct.', '11' => 'nov.', '12' => 'déc.',
    ];

    $parMois = RendezVous::selectRaw(
        'DATE_FORMAT(date_rdv, "%Y-%m") as mois, COUNT(*) as total'
    )
        ->whereIn('medecin_id', $medecinIds)
        ->where('date_rdv', '>=', now()->subMonths(5)->startOfMonth())
        ->where('date_rdv', '<=', now()->endOfMonth())
        ->groupBy('mois')
        ->pluck('total', 'mois');

    $rdvParMois = collect();

    for ($i = 5; $i >= 0; $i--) {
        $mois = now()->subMonths($i)->format('Y-m');
        $rdvParMois->push([
            'mois' => $mois,
            'label' => $moisFrancais[substr($mois, 5, 2)] ?? $mois,
            'total' => (int) ($parMois[$mois] ?? 0),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | LISTES DES RENDEZ-VOUS
    |--------------------------------------------------------------------------
    */

    $prochainsRdv = (clone $rdvQuery)
        ->with(['patient', 'medecin'])
        ->where('date_rdv', '>=', now()->toDateString())
        ->orderBy('date_rdv', 'asc')
        ->orderBy('heure_rdv', 'asc')
        ->take(5)
        ->get();

    $derniersRdv = (clone $rdvQuery)
        ->with(['patient', 'medecin'])
        ->latest()
        ->take(5)
        ->get();

    return response()->json([
        'success' => true,
        'cabinet' => $cabinet,
        'stats' => [
            'medecins' => $cabinet->medecins->count(),
            'secretaires' => $cabinet->secretaires->count(),
            'patients' => $patientIds->count(),
            'rdv_total' => $rdvTotal,
            'rdv_aujourdhui' => $rdvAujourdhui,
            'rdv_semaine' => $rdvSemaine,
            'rdv_en_attente' => $rdvEnAttente,
            'revenus' => (float) $revenus,
            'taux_occupation' => $tauxOccupation,
        ],
        'rdv_par_mois' => $rdvParMois,
        'prochains_rdv' => $prochainsRdv,
        'derniers_rdv' => $derniersRdv,
    ]);
}

public function patient(Request $request)
{
    return response()->json([
        'success' => true,
        'message' => 'Accès dashboard patient autorisé.',
        'user' => $request->user(),
    ]);
}
}
