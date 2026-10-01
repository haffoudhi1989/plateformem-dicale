<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cabinet extends Model
{
    use HasFactory;

    protected $table = 'cabinets';

    protected $fillable = [
        'nom',
        'adresse',
        'telephone',
        'email',
        'description',
        'actif',
        'plan',
        'date_debut_abonnement',
        'date_fin_abonnement',
        'statut_abonnement',
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    /**
     * Médecins du cabinet
     */
    public function medecins()
    {
        return $this->hasMany(Medecin::class, 'cabinet_id');
    }

    /**
     * Patients du cabinet
     */
    public function patients()
    {
        return $this->hasMany(Patient::class, 'cabinet_id');
    }

    /**
     * Secrétaires du cabinet
     */
    public function secretaires()
    {
        return $this->hasMany(Secretaire::class, 'cabinet_id');
    }
    public function horaires()
    {
        return $this->hasMany(Horaire::class);
    }

    /**
     * Abonnements et paiements du cabinet
     */
    public function abonnements()
    {
        return $this->hasMany(CabinetAbonnement::class, 'cabinet_id')->orderByDesc('date_debut')->orderByDesc('id');
    }

    /**
     * Dernier abonnement en date du cabinet
     */
    public function dernierAbonnement()
    {
        return $this->hasOne(CabinetAbonnement::class, 'cabinet_id')->latestOfMany();
    }
}