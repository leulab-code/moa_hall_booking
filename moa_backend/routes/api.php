<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\AdminController;

 
Route::get('/venues', [BookingController::class, 'getVenues']);
Route::get('/services', [BookingController::class, 'getServices']);
Route::get('/get_availability', [BookingController::class, 'checkAvailability']);
Route::post('/book', [BookingController::class, 'store']);
Route::get('/track', [BookingController::class, 'track']);

 
Route::post('/upload', [AdminController::class, 'uploadFile']);

Route::post('/force_override', [AdminController::class, 'forceVipOverride']);
Route::get('/admin_api', [AdminController::class, 'getBookings']);
Route::post('/admin_api', [AdminController::class, 'updateBooking']);
Route::post('/delete_booking', [AdminController::class, 'deleteBooking']);

Route::post('/update_venue', [AdminController::class, 'saveVenue']);
Route::get('/venue_images_api', [AdminController::class, 'getVenueImages']);
Route::post('/venue_images_api', [AdminController::class, 'saveVenueImages']);

Route::post('/services', [AdminController::class, 'saveService']);

Route::get('/staff_api', [AdminController::class, 'getStaff']);
Route::post('/staff_api', [AdminController::class, 'saveStaff']);
Route::delete('/staff_api', [AdminController::class, 'deleteStaff']);