<?php

namespace App\Exports;

use App\Models\RendezVous;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class RendezVousExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return RendezVous::with([
            'patient',
            'medecin.specialite',
        ])
        ->orderBy('date_rdv')
        ->orderBy('heure_rdv')
        ->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Patient',
            'Téléphone',
            'Médecin',
            'Spécialité',
            'Date',
            'Heure',
            'Motif',
            'Statut',
        ];
    }

    public function map($rdv): array
    {
        return [
            $rdv->id,
            trim(($rdv->patient->prenom ?? '') . ' ' . ($rdv->patient->nom ?? '')),
            $rdv->patient->telephone ?? '',
            trim(($rdv->medecin->prenom ?? '') . ' ' . ($rdv->medecin->nom ?? '')),
            $rdv->medecin->specialite->nom ?? '',
            $rdv->date_rdv,
            $rdv->heure_rdv,
            $rdv->motif ?? 'Consultation',
            $rdv->statut ?? 'En attente',
        ];
    }
}