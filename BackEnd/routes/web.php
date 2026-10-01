<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PaiementController;

Route::get('/', function () {
    return view('welcome');
});
Route::middleware('auth:sanctum')->group(function () {

    Route::get(
        '/patient/mes-paiements',
        [PaiementController::class, 'mesPaiements']
    );

});


