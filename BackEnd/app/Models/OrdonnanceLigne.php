<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrdonnanceLigne extends Model
{
    use HasFactory;

    protected $table = 'ordonnance_lignes';

    protected $fillable = [
        'ordonnance_id',
        'medicament',
        'posologie',
        'duree',
        'quantite',
        'instructions',
    ];

    /**
     * Une ligne appartient à une ordonnance
     */
    public function ordonnance()
    {
        return $this->belongsTo(
            Ordonnance::class,
            'ordonnance_id'
        );
    }
}