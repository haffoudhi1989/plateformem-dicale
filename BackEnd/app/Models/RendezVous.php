<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RendezVous extends Model
{
    protected $table = "rendez_vous";

    protected $fillable = [
        'patient_id',
        'medecin_id',
        'date_rdv',
        'heure_rdv',
        'motif',
        'statut',
        'mode',
        'notes',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function medecin()
    {
        return $this->belongsTo(Medecin::class);
    }

    public function consultationVideo()
    {
        return $this->hasOne(
            ConsultationVideo::class,
            'rendez_vous_id'
        );
    }
}