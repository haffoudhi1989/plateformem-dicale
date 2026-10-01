<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CabinetAbonnement extends Model
{
    use HasFactory;

    protected $table = 'cabinet_abonnements';

    protected $fillable = [
        'cabinet_id',
        'plan',
        'montant',
        'duree_mois',
        'date_debut',
        'date_fin',
        'mode_paiement',
        'statut',
        'date_paiement',
        'reference',
        'notes',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'duree_mois' => 'integer',
        'date_debut' => 'date',
        'date_fin' => 'date',
        'date_paiement' => 'date',
    ];

    /**
     * Un abonnement appartient à un cabinet.
     */
    public function cabinet()
    {
        return $this->belongsTo(Cabinet::class, 'cabinet_id');
    }
}
