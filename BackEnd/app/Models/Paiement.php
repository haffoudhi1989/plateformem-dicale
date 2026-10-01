<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    use HasFactory;

    protected $table = 'paiements';

    protected $fillable = [
        'patient_id',
        'rendez_vous_id',
        'montant',
        'mode_paiement',
        'statut',
        'date_paiement',
        'description',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date_paiement' => 'date',
    ];

    /**
     * Un paiement appartient à un patient
     */
    public function patient()
    {
        return $this->belongsTo(
            Patient::class,
            'patient_id'
        );
    }

    /**
     * Un paiement est lié au rendez-vous consulté
     */
    public function rendezVous()
    {
        return $this->belongsTo(
            RendezVous::class,
            'rendez_vous_id'
        );
    }
}