<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Patient extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'patients';

    protected $fillable = [
        'nom',
        'prenom',
        'date_naissance',
        'sexe',
        'telephone',
        'email',
        'adresse',
        'groupe_sanguin',
        'allergies',
        'maladies_chroniques',
        'antecedents',
        'photo',
        'password',
         'cabinet_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'date_naissance' => 'date',
    ];

    /*
    |--------------------------------------------------------------------------
    | Photo
    |--------------------------------------------------------------------------
    */

   

    /*
    |--------------------------------------------------------------------------
    | Rendez-vous
    |--------------------------------------------------------------------------
    */

    public function rendezVous()
    {
        return $this->hasMany(
            RendezVous::class,
            'patient_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Médecins
    |--------------------------------------------------------------------------
    |
    | Un patient peut être suivi par plusieurs médecins (relation
    | plusieurs-à-plusieurs via la table pivot « medecin_patient »).
    |
    */

    public function medecins()
    {
        return $this->belongsToMany(
            Medecin::class,
            'medecin_patient',
            'patient_id',
            'medecin_id'
        )->withTimestamps();
    }

    /*
    |--------------------------------------------------------------------------
    | Paiements
    |--------------------------------------------------------------------------
    */

    public function paiements()
    {
        return $this->hasMany(
            Paiement::class,
            'patient_id'
        );
    }
    public function cabinet()
{
    return $this->belongsTo(Cabinet::class, 'cabinet_id');
}
    
}
