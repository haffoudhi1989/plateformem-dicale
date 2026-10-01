<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Horaire extends Model
{
    use HasFactory;

    protected $fillable = [
        'cabinet_id',
        'jour',
        'heure_ouverture',
        'heure_fermeture',
        'actif',
        'satut',
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    public function cabinet()
    {
        return $this->belongsTo(Cabinet::class);
    }
}