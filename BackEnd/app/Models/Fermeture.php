<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Fermeture extends Model
{
    use HasFactory;

    protected $table = 'fermetures';

    protected $fillable = [
        'cabinet_id',
        'type',
        'date_debut',
        'date_fin',
        'medecin_id',
        'patient_id',
        'motif',
    ];

    protected $casts = [
        'date_debut' => 'date:Y-m-d',
        'date_fin'   => 'date:Y-m-d',
    ];

    public function cabinet()
    {
        return $this->belongsTo(Cabinet::class, 'cabinet_id');
    }

    public function medecin()
    {
        return $this->belongsTo(Medecin::class, 'medecin_id');
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }
}
