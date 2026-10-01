<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Analyse extends Model
{
    protected $table = 'analyses_examens';

    protected $fillable = [
        'patient_id',
         'medecin_id',
          'type',
        'nom',
        'date_examen',
        'statut',
        'resultat',
    ];

    /**
     * Médecin prescripteur de l'analyse.
     */
    public function medecin(): BelongsTo
    {
        return $this->belongsTo(Medecin::class, 'medecin_id');
    }
}