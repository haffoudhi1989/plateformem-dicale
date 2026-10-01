<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_id',
        'recipient_id',
        'recipient_type',
        'last_message',
    ];

    public function messages()
    {
        return $this->hasMany(
            Message::class,
            'conversation_id'
        );
    }

    public function secretaire()
    {
        return $this->belongsTo(
            Secretaire::class,
            'recipient_id'
        );
    }
}