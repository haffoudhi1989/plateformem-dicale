<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CabinetMessage extends Model
{
    use HasFactory;

    protected $table = 'cabinet_messages';

    protected $fillable = [
        'cabinet_id',
        'nom',
        'email',
        'sujet',
        'message',
        'lu',
    ];

    protected $casts = [
        'lu' => 'boolean',
    ];

    public function cabinet()
    {
        return $this->belongsTo(Cabinet::class);
    }
}
