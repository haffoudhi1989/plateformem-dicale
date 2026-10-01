<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_type',
        'sender_id',
        'receiver_type',
        'receiver_id',
        'content',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    /**
     * Filtre : messages échangés entre deux interlocuteurs
     * (dans les deux sens), identifiés par type + id.
     */
    public function scopeBetween(
        $query,
        string $aType,
        $aId,
        string $bType,
        $bId
    ) {
        return $query->where(function ($q) use ($aType, $aId, $bType, $bId) {
            $q->where('sender_type', $aType)
              ->where('sender_id', $aId)
              ->where('receiver_type', $bType)
              ->where('receiver_id', $bId);
        })->orWhere(function ($q) use ($aType, $aId, $bType, $bId) {
            $q->where('sender_type', $bType)
              ->where('sender_id', $bId)
              ->where('receiver_type', $aType)
              ->where('receiver_id', $aId);
        });
    }
}
