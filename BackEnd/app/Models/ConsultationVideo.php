<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsultationVideo extends Model
{
    protected $table = 'consultation_videos';

    protected $fillable = [
        'rendez_vous_id',
        'channel_name',
        'started_at',
        'ended_at',
        'duration',
        'status',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'duration' => 'integer',
    ];

    public function rendezVous()
    {
        return $this->belongsTo(RendezVous::class);
    }
}