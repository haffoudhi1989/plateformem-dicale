<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

Artisan::command('creer:medecin {email} {password}', function ($email, $password) {

    $medecin = \App\Models\Medecin::where('email', $email)->first();

    if (!$medecin) {
        $this->error('Médecin introuvable.');
        return;
    }

    $user = User::updateOrCreate(
        ['email' => $medecin->email],
        [
            'name' => $medecin->prenom . ' ' . $medecin->nom,
            'password' => Hash::make($password),
            'role' => 'medecin',
        ]
    );

    $this->info('Compte médecin créé.');
    $this->info('Email : ' . $user->email);
    $this->info('Mot de passe : ' . $password);
});