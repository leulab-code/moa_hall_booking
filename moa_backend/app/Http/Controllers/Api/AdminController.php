<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Venue;
use App\Models\Service;
use App\Models\Staff;
use App\Models\VenueImage;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    // --- 1. BOOKING MANAGEMENT ---

    public function getBookings() {
        $bookings = Booking::leftJoin('venues', 'bookings.venue_id', '=', 'venues.venue_id')
            ->select('bookings.*', 'venues.name as room_name')
            ->orderBy('start_time', 'desc')
            ->get();
        return response()->json($bookings);
    }

    public function updateBooking(Request $request) {
        $data = $request->all();
        
        if (isset($data['booking_id'])) {
            // Handle Staff Allocation Action
            if (isset($data['action']) && $data['action'] === 'allocate_staff') {
                Booking::where('booking_id', $data['booking_id'])->update([
                    'allocated_staff' => json_encode($data['staff_ids'])
                ]);
                return response()->json(['success' => true]);
            }

            // Handle Regular Status Update
            $booking = Booking::find($data['booking_id']);
            if (!$booking) return response()->json(['success' => false]);

            $status = $data['status'];
            $messageText = $data['message'] ?? 'Status updated by coordinator.';

            $booking->update([
                'status' => $status,
                'admin_message' => $messageText
            ]);

            // --- HTML EMAIL LOGIC ---
            $statusColor = ($status === 'Approved' || $status === 'Confirmed') ? 'green' : ($status === 'Rejected' ? 'red' : 'orange');

            $htmlContent = "
                <div style='font-family: sans-serif; color: #333;'>
                    <h2 style='color: #198754;'>Ministry of Agriculture Conference Center</h2>
                    <p>Dear {$booking->full_name},</p>
                    <p>The status of your booking request (<strong>{$booking->event_name}</strong>) has been updated.</p>
                    <p>New Status: <strong style='color: {$statusColor}; text-transform: uppercase;'>{$status}</strong></p>
                    <hr style='border: 0; border-top: 1px solid #eee;' />
                    <p><strong>Message from Coordinator:</strong><br/>{$messageText}</p>
                    <hr style='border: 0; border-top: 1px solid #eee;' />
                    <p style='font-size: 12px; color: #777;'>You can track your request using your Booking ID: #{$booking->booking_id}</p>
                </div>";

            try {
                Mail::html($htmlContent, function ($message) use ($booking, $status) {
                    $message->to($booking->email)
                            ->subject("MoA Booking Update [{$status}]: {$booking->event_name}");
                });
            } catch (\Exception $e) {
                Log::error("Mail fail: " . $e->getMessage());
            }

            return response()->json(['success' => true]);
        }
        return response()->json(['success' => false, 'error' => 'No booking ID provided']);
    }

    public function deleteBooking(Request $request) {
        Booking::where('booking_id', $request->booking_id)->delete();
        return response()->json(['success' => true]);
    }

    // --- 2. VIP MANUAL OVERRIDE (FIX FOR CONFLICTS) ---

    public function forceVipOverride(Request $request) {
        $vipBookingId = $request->vip_booking_id;
        $vipBooking = Booking::find($vipBookingId);

        if (!$vipBooking || !$vipBooking->is_vip) {
            return response()->json(['success' => false, 'error' => 'Not a VIP booking']);
        }

        // Find all non-VIP bookings in the same room that overlap this time
        $conflicts = Booking::where('venue_id', $vipBooking->venue_id)
            ->where('is_vip', 0)
            ->whereIn('status', ['Confirmed', 'Approved'])
            ->where('booking_id', '!=', $vipBookingId)
            ->where('start_time', '<', $vipBooking->end_time)
            ->where('end_time', '>', $vipBooking->start_time)
            ->get();

        foreach ($conflicts as $victim) {
            $victim->update([
                'status' => 'Displaced',
                'admin_message' => 'OVERRIDDEN BY MINISTERIAL OFFICE. Please visit Finance for a refund.'
            ]);

            // Displacement Email
            $html = "<h2>Urgent: Booking Reassigned</h2><p>Your booking #{$victim->booking_id} has been displaced by a Ministerial VIP event. Please contact us for a refund.</p>";
            try {
                Mail::html($html, function($m) use ($victim) {
                    $m->to($victim->email)->subject('URGENT: Booking Displacement');
                });
            } catch (\Exception $e) {}
        }

        return response()->json(['success' => true, 'count' => $conflicts->count()]);
    }

    // --- 3. VENUE MANAGEMENT ---

    public function saveVenue(Request $request) {
        $data = $request->all();
        if (isset($data['action']) && $data['action'] === 'delete') {
            Venue::where('venue_id', $data['venue_id'])->delete();
            return response()->json(['success' => true]);
        }

        $venue = Venue::updateOrCreate(
            ['venue_id' => $data['venue_id'] ?? null],
            [
                'name' => $data['name'],
                'capacity' => $data['capacity'],
                'price_per_hour' => $data['price_per_hour'],
                'best_for' => $data['best_for'] ?? null
            ]
        );
        return response()->json(['success' => true, 'venue_id' => $venue->venue_id]);
    }

    public function getVenueImages(Request $request) {
        $images = VenueImage::where('venue_id', $request->venue_id)->pluck('image_url');
        return response()->json($images);
    }

    public function saveVenueImages(Request $request) {
        foreach($request->images as $url) {
            VenueImage::create(['venue_id' => $request->venue_id, 'image_url' => $url]);
        }
        return response()->json(['success' => true]);
    }

    // --- 4. SERVICES & STAFF ---

    public function saveService(Request $request) {
        $data = $request->all();
        Service::updateOrCreate(
            ['id' => $data['id'] ?? null],
            ['name' => $data['name'], 'price' => $data['price'], 'category' => $data['category']]
        );
        return response()->json(['success' => true]);
    }

    public function getStaff() {
        return response()->json(Staff::all());
    }

    public function saveStaff(Request $request) {
        $data = $request->all();
        $updateData = [
            'name' => $data['name'],
            'role' => $data['role'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
        ];
        if (!empty($data['password'])) {
            $updateData['password'] = bcrypt($data['password']);
        }

        Staff::updateOrCreate(['staff_id' => $data['staff_id'] ?? null], $updateData);
        return response()->json(['success' => true]);
    }

    public function deleteStaff(Request $request) {
        Staff::where('staff_id', $request->staff_id)->delete();
        return response()->json(['success' => true]);
    }

    // --- 5. FILE UPLOAD ---

    public function uploadFile(Request $request) {
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '', $file->getClientOriginalName());
            $file->move(public_path('uploads'), $filename);
            return response()->json([
                'success' => true, 
                'url' => url('/uploads/' . $filename) 
            ]);
        }
        return response()->json(['success' => false, 'error' => 'No file received']);
    }
}