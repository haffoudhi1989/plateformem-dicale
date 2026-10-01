<?php

namespace App\Http\Controllers;

use App\Exports\RendezVousExport;
use App\Models\RendezVous;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

class RendezVousExportController extends Controller
{
    /**
     * Export Excel
     */
    public function excel()
    {
        return Excel::download(
            new RendezVousExport,
            'rendez-vous.xlsx'
        );
    }

    /**
     * Export PDF
     */
    public function pdf()
    {
        $rendezVous = RendezVous::with([
            'patient',
            'medecin.specialite',
        ])
        ->orderBy('date_rdv')
        ->orderBy('heure_rdv')
        ->get();

        $pdf = Pdf::loadView(
            'exports.rendez-vous',
            compact('rendezVous')
        );

        $pdf->setPaper('a4', 'landscape');

        return $pdf->download('rendez-vous.pdf');
    }
}