<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cabinet;
use App\Models\CabinetAbonnement;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCabinetAbonnementController extends Controller
{
    /**
     * Tarification officielle de base par plan (en TND).
     */
    public const PLANS_PRIX = [
        'Basic' => 49,
        'Pro' => 99,
        'Premium' => 199,
    ];

    /**
     * Liste des abonnements & paiements cabinets pour l'admin
     * GET /api/admin/cabinet-abonnements
     */
    public function index(Request $request): JsonResponse
    {
        $query = CabinetAbonnement::with([
            'cabinet.medecins' => function ($q) {
                $q->select('id', 'nom', 'prenom', 'cabinet_id', 'specialite_id');
            }
        ]);

        // Filtre par cabinet
        if ($request->filled('cabinet_id')) {
            $query->where('cabinet_id', $request->cabinet_id);
        }

        // Filtre par plan
        if ($request->filled('plan')) {
            $query->where('plan', $request->plan);
        }

        // Filtre par statut
        if ($request->filled('statut')) {
            $statut = strtolower($request->statut);
            if ($statut === 'paye' || $statut === 'payé') {
                $query->where(function ($q) {
                    $q->where('statut', 'Payé')->orWhere('statut', 'paye');
                });
            } elseif ($statut === 'attente' || $statut === 'en_attente' || $statut === 'en attente') {
                $query->where(function ($q) {
                    $q->where('statut', 'En attente')->orWhere('statut', 'en_attente');
                });
            } else {
                $query->where('statut', $request->statut);
            }
        }

        // Recherche par mot-clé (nom du cabinet, référence, mode, notes)
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhere('mode_paiement', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhereHas('cabinet', function ($subQ) use ($search) {
                      $subQ->where('nom', 'like', "%{$search}%")
                           ->orWhere('email', 'like', "%{$search}%")
                           ->orWhere('telephone', 'like', "%{$search}%");
                  });
            });
        }

        $abonnements = $query->orderByDesc('date_paiement')
                             ->orderByDesc('id')
                             ->get();

        // Calcul des jours restants et état d'expiration pour chaque ligne
        $today = Carbon::today();
        $abonnementsFormates = $abonnements->map(function ($item) use ($today) {
            $joursRestants = null;
            $estExpire = false;

            if ($item->date_fin) {
                $dateFin = Carbon::parse($item->date_fin)->startOfDay();
                if ($dateFin->isPast()) {
                    $estExpire = true;
                    $joursRestants = 0;
                } else {
                    $joursRestants = (int) $today->diffInDays($dateFin, false);
                }
            }

            $item->jours_restants = $joursRestants;
            $item->est_expire = $estExpire;
            return $item;
        });

        // =====================================================
        // CALCUL DES STATISTIQUES GLOBALES
        // =====================================================
        $tousAbonnements = CabinetAbonnement::all();
        $tousCabinets = Cabinet::all();

        // Somme totale des paiements d'abonnements validés/payés
        $totalRevenus = (float) CabinetAbonnement::where(function ($q) {
            $q->where('statut', 'Payé')->orWhere('statut', 'paye');
        })->sum('montant');

        // Cabinets avec un abonnement actif en cours
        $cabinetsActifs = $tousCabinets->filter(function ($c) use ($today) {
            $fin = $c->date_fin_abonnement ? Carbon::parse($c->date_fin_abonnement)->startOfDay() : null;
            return ($c->statut_abonnement === 'actif' || ($fin && !$fin->isPast()));
        })->count();

        // Paiements d'abonnements en attente de confirmation
        $enAttenteCount = CabinetAbonnement::where(function ($q) {
            $q->where('statut', 'En attente')->orWhere('statut', 'en_attente');
        })->count();
        $enAttenteMontant = (float) CabinetAbonnement::where(function ($q) {
            $q->where('statut', 'En attente')->orWhere('statut', 'en_attente');
        })->sum('montant');

        // Abonnements expirés ou expirant dans les 15 prochains jours
        $expirantBientot = $tousCabinets->filter(function ($c) use ($today) {
            if (!$c->date_fin_abonnement) return false;
            $fin = Carbon::parse($c->date_fin_abonnement)->startOfDay();
            $diff = $today->diffInDays($fin, false);
            return $diff >= 0 && $diff <= 15;
        })->count();

        $expiresTotal = $tousCabinets->filter(function ($c) use ($today) {
            if (!$c->date_fin_abonnement) return false;
            $fin = Carbon::parse($c->date_fin_abonnement)->startOfDay();
            return $fin->isPast();
        })->count();

        // Répartition par plan
        $parPlan = [
            'Basic' => CabinetAbonnement::where('plan', 'Basic')->count(),
            'Pro' => CabinetAbonnement::where('plan', 'Pro')->count(),
            'Premium' => CabinetAbonnement::where('plan', 'Premium')->count(),
        ];

        return response()->json([
            'success' => true,
            'stats' => [
                'total_revenus' => round($totalRevenus, 2),
                'total_transactions' => $tousAbonnements->count(),
                'cabinets_actifs' => $cabinetsActifs,
                'total_cabinets' => $tousCabinets->count(),
                'en_attente_count' => $enAttenteCount,
                'en_attente_montant' => round($enAttenteMontant, 2),
                'expirant_bientot' => $expirantBientot,
                'expires_total' => $expiresTotal,
                'repartition_plan' => $parPlan,
                'plans_prix' => self::PLANS_PRIX,
            ],
            'data' => $abonnementsFormates,
        ]);
    }

    /**
     * Enregistrer un nouveau paiement / abonnement pour un cabinet
     * POST /api/admin/cabinet-abonnements
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cabinet_id' => 'required|integer|exists:cabinets,id',
            'plan' => 'required|string|in:Basic,Pro,Premium',
            'duree_mois' => 'required|integer|min:1|max:60',
            'montant' => 'required|numeric|min:0',
            'mode_paiement' => 'required|string|max:100',
            'statut' => 'required|string|max:50',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date',
            'date_paiement' => 'nullable|date',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $cabinet = Cabinet::findOrFail($validated['cabinet_id']);
        $duree = (int) $validated['duree_mois'];
        $statut = $validated['statut'];

        // Calcul des dates
        $debut = $validated['date_debut'] ? Carbon::parse($validated['date_debut']) : Carbon::today();
        if (!empty($validated['date_fin'])) {
            $fin = Carbon::parse($validated['date_fin']);
        } else {
            $fin = (clone $debut)->addMonths($duree);
        }

        // Référence automatique si non fournie
        $reference = !empty($validated['reference'])
            ? trim($validated['reference'])
            : 'ABO-' . Carbon::now()->format('Ymd') . '-' . strtoupper(Str::random(4));

        $datePaiement = !empty($validated['date_paiement'])
            ? $validated['date_paiement']
            : (in_array(strtolower($statut), ['payé', 'paye']) ? Carbon::today()->toDateString() : null);

        $abonnement = CabinetAbonnement::create([
            'cabinet_id' => $cabinet->id,
            'plan' => $validated['plan'],
            'montant' => $validated['montant'],
            'duree_mois' => $duree,
            'date_debut' => $debut->toDateString(),
            'date_fin' => $fin->toDateString(),
            'mode_paiement' => $validated['mode_paiement'],
            'statut' => $statut,
            'date_paiement' => $datePaiement,
            'reference' => $reference,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Mise à jour de l'état du cabinet si le paiement est effectif ou en cours
        if (in_array(strtolower($statut), ['payé', 'paye', 'actif'])) {
            $cabinet->update([
                'plan' => $validated['plan'],
                'date_debut_abonnement' => $debut->toDateString(),
                'date_fin_abonnement' => $fin->toDateString(),
                'statut_abonnement' => ($fin->isPast()) ? 'expire' : 'actif',
            ]);
        }

        $abonnement->load(['cabinet.medecins']);

        return response()->json([
            'success' => true,
            'message' => 'Paiement d\'abonnement enregistré avec succès.',
            'data' => $abonnement,
        ], 201);
    }

    /**
     * Afficher les détails d'un abonnement
     * GET /api/admin/cabinet-abonnements/{id}
     */
    public function show($id): JsonResponse
    {
        $abonnement = CabinetAbonnement::with(['cabinet.medecins', 'cabinet.secretaires'])->find($id);

        if (!$abonnement) {
            return response()->json([
                'success' => false,
                'message' => 'Abonnement introuvable.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $abonnement,
        ]);
    }

    /**
     * Modifier un abonnement (statut, dates, notes, etc.)
     * PUT /api/admin/cabinet-abonnements/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        $abonnement = CabinetAbonnement::find($id);

        if (!$abonnement) {
            return response()->json([
                'success' => false,
                'message' => 'Abonnement introuvable.',
            ], 404);
        }

        $validated = $request->validate([
            'plan' => 'nullable|string|in:Basic,Pro,Premium',
            'montant' => 'nullable|numeric|min:0',
            'duree_mois' => 'nullable|integer|min:1',
            'mode_paiement' => 'nullable|string|max:100',
            'statut' => 'nullable|string|max:50',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date',
            'date_paiement' => 'nullable|date',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'sync_cabinet' => 'nullable|boolean',
        ]);

        $abonnement->update(array_filter($validated, function ($val) {
            return $val !== null;
        }));

        // Si le statut passe à 'Payé', renseigner date_paiement si vide
        if (isset($validated['statut']) && in_array(strtolower($validated['statut']), ['payé', 'paye']) && empty($abonnement->date_paiement)) {
            $abonnement->date_paiement = Carbon::today()->toDateString();
            $abonnement->save();
        }

        // Synchroniser avec le cabinet si demandé ou si statut Payé
        $syncCabinet = $request->boolean('sync_cabinet', true);
        if ($syncCabinet && in_array(strtolower($abonnement->statut), ['payé', 'paye', 'actif'])) {
            $cabinet = $abonnement->cabinet;
            if ($cabinet) {
                $fin = $abonnement->date_fin ? Carbon::parse($abonnement->date_fin) : null;
                $cabinet->update([
                    'plan' => $abonnement->plan,
                    'date_debut_abonnement' => $abonnement->date_debut,
                    'date_fin_abonnement' => $abonnement->date_fin,
                    'statut_abonnement' => ($fin && $fin->isPast()) ? 'expire' : 'actif',
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Abonnement mis à jour avec succès.',
            'data' => $abonnement->load('cabinet.medecins'),
        ]);
    }

    /**
     * Supprimer un enregistrement d'abonnement
     * DELETE /api/admin/cabinet-abonnements/{id}
     */
    public function destroy($id): JsonResponse
    {
        $abonnement = CabinetAbonnement::find($id);

        if (!$abonnement) {
            return response()->json([
                'success' => false,
                'message' => 'Abonnement introuvable.',
            ], 404);
        }

        $abonnement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Paiement d\'abonnement supprimé avec succès.',
        ]);
    }

    /**
     * Liste des cabinets avec leurs abonnements et totaux payés (Vue par cabinet)
     * GET /api/admin/cabinet-abonnements/cabinets
     */
    public function cabinetsList(): JsonResponse
    {
        $today = Carbon::today();

        $cabinets = Cabinet::with([
            'medecins' => function ($q) {
                $q->select('id', 'nom', 'prenom', 'cabinet_id');
            },
            'abonnements' => function ($q) {
                $q->orderByDesc('date_paiement')->orderByDesc('id');
            }
        ])
        ->orderBy('nom', 'asc')
        ->get();

        $cabinetsFormates = $cabinets->map(function ($cab) use ($today) {
            $joursRestants = null;
            $estExpire = false;

            if ($cab->date_fin_abonnement) {
                $fin = Carbon::parse($cab->date_fin_abonnement)->startOfDay();
                if ($fin->isPast()) {
                    $estExpire = true;
                    $joursRestants = 0;
                } else {
                    $joursRestants = (int) $today->diffInDays($fin, false);
                }
            }

            $totalPaye = (float) $cab->abonnements->filter(function ($a) {
                return in_array(strtolower($a->statut), ['payé', 'paye']);
            })->sum('montant');

            $dernierPaiement = $cab->abonnements->first();

            $cab->jours_restants = $joursRestants;
            $cab->est_expire = $estExpire;
            $cab->total_paye = $totalPaye;
            $cab->dernier_paiement = $dernierPaiement;
            return $cab;
        });

        return response()->json([
            'success' => true,
            'data' => $cabinetsFormates,
            'plans_prix' => self::PLANS_PRIX,
        ]);
    }
}
