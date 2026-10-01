<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Cabinet;
use App\Models\CabinetAbonnement;
use Carbon\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $cabinets = Cabinet::all();

        $tarifs = [
            'Basic' => 49.00,
            'Pro' => 99.00,
            'Premium' => 199.00,
        ];

        foreach ($cabinets as $cabinet) {
            $existing = CabinetAbonnement::where('cabinet_id', $cabinet->id)->count();
            if ($existing === 0) {
                $plan = $cabinet->plan ?: 'Basic';
                $prixMensuel = $tarifs[$plan] ?? 49.00;
                $debut = $cabinet->date_debut_abonnement ?: Carbon::now()->subMonths(1)->toDateString();
                $fin = $cabinet->date_fin_abonnement ?: Carbon::now()->addMonths(5)->toDateString();

                // Calculer la durée approximative
                $duree = 6;
                $montant = $prixMensuel * $duree;

                CabinetAbonnement::create([
                    'cabinet_id' => $cabinet->id,
                    'plan' => $plan,
                    'montant' => $montant,
                    'duree_mois' => $duree,
                    'date_debut' => $debut,
                    'date_fin' => $fin,
                    'mode_paiement' => 'Virement bancaire',
                    'statut' => 'Payé',
                    'date_paiement' => $debut,
                    'reference' => 'ABO-' . Carbon::parse($debut)->format('Ym') . '-00' . $cabinet->id,
                    'notes' => 'Abonnement initial configuré pour le cabinet ' . $cabinet->nom,
                ]);

                // S'assurer que le cabinet a des dates cohérentes
                if (!$cabinet->date_debut_abonnement || !$cabinet->date_fin_abonnement) {
                    $cabinet->update([
                        'date_debut_abonnement' => $debut,
                        'date_fin_abonnement' => $fin,
                        'statut_abonnement' => 'actif',
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Ne rien supprimer pour préserver les données
    }
};
