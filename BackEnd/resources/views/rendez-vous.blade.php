<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">

    <title>Liste des rendez-vous</title>

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            color: #1e293b;
        }

        h1 {
            text-align: center;
            font-size: 20px;
            margin-bottom: 5px;
        }

        .date {
            text-align: center;
            color: #64748b;
            margin-bottom: 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            background: #ede9fe;
            color: #4c1d95;
            font-weight: bold;
            padding: 8px;
            border: 1px solid #cbd5e1;
        }

        td {
            padding: 7px;
            border: 1px solid #cbd5e1;
        }

        .statut-confirme {
            color: #047857;
            font-weight: bold;
        }

        .statut-annule {
            color: #be123c;
            font-weight: bold;
        }

        .statut-attente {
            color: #b45309;
            font-weight: bold;
        }
    </style>
</head>

<body>

    <h1>Gestion des rendez-vous</h1>

    <div class="date">
        Liste des rendez-vous — {{ now()->format('d/m/Y H:i') }}
    </div>

    <table>

        <thead>
            <tr>
                <th>ID</th>
                <th>Patient</th>
                <th>Téléphone</th>
                <th>Médecin</th>
                <th>Spécialité</th>
                <th>Date</th>
                <th>Heure</th>
                <th>Motif</th>
                <th>Statut</th>
            </tr>
        </thead>

        <tbody>

            @foreach($rendezVous as $rdv)

                @php
                    $statut = strtolower($rdv->statut ?? '');
                @endphp

                <tr>

                    <td>{{ $rdv->id }}</td>

                    <td>
                        {{ $rdv->patient->prenom ?? '' }}
                        {{ $rdv->patient->nom ?? '' }}
                    </td>

                    <td>
                        {{ $rdv->patient->telephone ?? '' }}
                    </td>

                    <td>
                        Dr.
                        {{ $rdv->medecin->prenom ?? '' }}
                        {{ $rdv->medecin->nom ?? '' }}
                    </td>

                    <td>
                        {{ $rdv->medecin->specialite->nom ?? '' }}
                    </td>

                    <td>
                        {{ \Carbon\Carbon::parse($rdv->date_rdv)->format('d/m/Y') }}
                    </td>

                    <td>
                        {{ substr($rdv->heure_rdv ?? '', 0, 5) }}
                    </td>

                    <td>
                        {{ $rdv->motif ?? 'Consultation' }}
                    </td>

                    <td
                        class="
                            @if(str_contains($statut, 'confirm'))
                                statut-confirme
                            @elseif(str_contains($statut, 'annul'))
                                statut-annule
                            @elseif(str_contains($statut, 'attente'))
                                statut-attente
                            @endif
                        "
                    >
                        {{ $rdv->statut ?? 'En attente' }}
                    </td>

                </tr>

            @endforeach

        </tbody>

    </table>

</body>
</html>