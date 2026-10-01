<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Specialite extends Model
{
    protected $table = 'specialite';

    protected $fillable = [
        'nom',
        'description',
    ];

    public function medecins()
    {
        return $this->hasMany(
            Medecin::class,
            'specialite_id'
        );
    }
}