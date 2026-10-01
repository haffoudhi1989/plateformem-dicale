<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Medecin extends Model
{
    use HasFactory;

    protected $table = 'medecin';

    protected $fillable = [
        'nom',
        'prenom',
        'telephone',
        'email',
        'adresse',
        'photo',
        'specialite_id',
        'cabinet_id', // ✅ ajouté
    ];

    public function specialite()
    {
        return $this->belongsTo(
            Specialite::class,
            'specialite_id'
        );
    }

    public function cabinet()
    {
        return $this->belongsTo(
            Cabinet::class,
            'cabinet_id'
        );
    }

    public function rendezVous()
    {
        return $this->hasMany(
            RendezVous::class,
            'medecin_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Patients
    |--------------------------------------------------------------------------
    |
    | Un médecin peut suivre plusieurs patients (relation
    | plusieurs-à-plusieurs via la table pivot « medecin_patient »).
    |
    */

    public function patients()
    {
        return $this->belongsToMany(
            Patient::class,
            'medecin_patient',
            'medecin_id',
            'patient_id'
        )->withTimestamps();
    }
}