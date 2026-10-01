<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    /**
     * Token de réinitialisation.
     */
    protected string $token;

    /**
     * Adresse email de l'utilisateur.
     */
    protected string $email;

    /**
     * Création de la notification.
     */
    public function __construct(string $token, string $email)
    {
        $this->token = $token;
        $this->email = $email;
    }

    /**
     * Canaux utilisés.
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Email de réinitialisation.
     */
public function toMail(object $notifiable): MailMessage
{
    $frontendUrl = env(
        'FRONTEND_URL',
        'http://localhost:3000'
    );
$resetUrl = rtrim($frontendUrl, '/')
    . '/reset-password?token='
    . urlencode($this->token)
    . '&email='
    . urlencode($this->email);
    return (new MailMessage)
        ->subject('Réinitialisation de votre mot de passe')
        ->greeting('Bonjour,')
        ->line('Vous avez demandé une réinitialisation de votre mot de passe.')
        ->action(
            'Réinitialiser mon mot de passe',
            $resetUrl
        )
        ->line('Ce lien est temporaire.')
        ->salutation('Cordialement, Clinique Nour');
}
}