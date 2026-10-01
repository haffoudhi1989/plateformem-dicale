<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ordonnance extends Model
{
    use HasFactory;

    protected $table = 'ordonnances';

    protected $fillable = [
        'patient_id',
        'medecin_id',
        'date_ordonnance',
        'statut',
        'notes',
    ];

    protected $casts = [
        'date_ordonnance' => 'date',
    ];

    public function patient()
    {
        return $this->belongsTo(
            Patient::class,
            'patient_id'
        );
    }

    public function medecin()
    {
        return $this->belongsTo(
            Medecin::class,
            'medecin_id'
        );
    }

    public function lignes()
    {
        return $this->hasMany(
            OrdonnanceLigne::class,
            'ordonnance_id'
        );
    }
}