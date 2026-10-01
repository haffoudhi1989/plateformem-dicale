<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Secretaire extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'secretaires';

    protected $fillable = [
        'prenom',
        'nom',
        'email',
        'telephone',
        'photo',
        'password',
        'cabinet_id',
        'actif',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'actif' => 'boolean',
        'password' => 'hashed',
    ];

    public function cabinet()
    {
        return $this->belongsTo(Cabinet::class, 'cabinet_id');
    }
}