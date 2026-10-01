<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Notification;

class User extends Authenticatable implements CanResetPassword
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'telephone',
        'photo',
        'password',
        'role',
        'is_active',
        'cabinet_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function sendPasswordResetNotification($token): void
    {
        Notification::route(
            'mail',
            'haffoudhinour@gmail.com'
        )->notify(
            new ResetPasswordNotification(
                $token,
                $this->email
            )
        );
    }
    public function notifications()
{
    return $this->hasMany(Notification::class, 'user_id');
}

    /**
     * Cabinet médical associé au compte (rôle cabinet).
     */
    public function cabinet()
    {
        return $this->belongsTo(Cabinet::class, 'cabinet_id');
    }
}