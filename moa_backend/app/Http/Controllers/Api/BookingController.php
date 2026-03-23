<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Venue;
use App\Models\Service;
use Carbon\Carbon; // Added this
use Illuminate\Support\Facades\Mail; // Added this

class BookingController extends Controller
{
    public function getVenues()
    {
        return response()->json(Venue::all());
    }

    public function getServices()
    {
        return response()->json(Service::all());
    }

    public function checkAvailability(Request $request)
    {
        $venueId = $request->query('venue_id');
        
        $bookings = Booking::where('venue_id', $venueId)
            ->whereIn('status', ['Confirmed', 'Approved'])
            ->get();

        $ranges = $bookings->map(function ($booking) {
            return [
                'start' => str_replace(' ', 'T', $booking->start_time),
                'end' => str_replace(' ', 'T', $booking->end_time),
                'status' => $booking->status
            ];
        });

        return response()->json(['ranges' => $ranges]);
    }

    public function store(Request $request)
    {
        $data = $request->all();
        
        // Use Carbon for reliable date formatting
        $startTime = Carbon::parse($data['start_time'])->format('Y-m-d H:i:s');
        $endTime = Carbon::parse($data['end_time'])->format('Y-m-d H:i:s');
        
        $venueId = $data['venue_id'];
        $isVip = !empty($data['is_vip']) && ($data['is_vip'] == true || $data['is_vip'] == 1);

        // 1. IMPROVED OVERLAP LOGIC (Strict Cross-Check)
        // This finds ANY booking that touches this time slot
        $conflictingBooking = Booking::where('venue_id', $venueId)
            ->whereIn('status', ['Confirmed', 'Approved'])
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startTime);
            })
            ->first();

        if ($conflictingBooking) {
            if ($isVip) {
                // --- THE OVERRIDE LOGIC ---
                // 1. Displace the existing booking
                $conflictingBooking->update([
                    'status' => 'Displaced',
                    'admin_message' => 'Slot reassigned for urgent Ministerial/VIP priority. Refund processing required.'
                ]);

                // 2. Send the Displacement Email
                $this->sendDisplacementEmail($conflictingBooking);

            } else {
                // Block normal user from overlapping
                return response()->json([
                    'success' => false, 
                    'error' => 'This slot is already reserved. Please choose another time.'
                ], 422);
            }
        }

        // 2. Save the new booking
        $newBooking = Booking::create([
            'venue_id' => $venueId,
            'full_name' => $data['full_name'],
            'organization' => $data['organization'] ?? null,
            'email' => $data['email'],
            'phone' => $data['phone'],
            'event_name' => $data['event_title'],
            'pax_count' => $data['pax'],
            'start_time' => $startTime,
            'end_time' => $endTime,
            'is_vip' => $isVip,
            'status' => $isVip ? 'Confirmed' : 'Pending',
            'total_amount' => $data['total_amount'] ?? 0,
        ]);

        if($isVip) { 
            $this->sendVipConfirmation($newBooking); 
        }

        return response()->json(['success' => true, 'booking_id' => $newBooking->booking_id]);
    }

    // --- EMAIL HELPERS ---

    private function sendDisplacementEmail($oldBooking) {
        $html = "
            <div style='font-family: sans-serif; border: 2px solid #dc3545; padding: 20px; border-radius: 15px;'>
                <h2 style='color: #dc3545;'>URGENT: Booking Reassignment Notice</h2>
                <p>Dear {$oldBooking->full_name},</p>
                <p>Your reservation for <strong>{$oldBooking->event_name}</strong> at the Ministry of Agriculture has been reassigned due to an <strong>Urgent Ministerial/VIP Priority</strong> requirement.</p>
                <div style='background: #f8d7da; padding: 15px; border-left: 5px solid #dc3545;'>
                    <strong>REFUND ACTION:</strong> Please visit the Finance Department with Booking ID #{$oldBooking->booking_id} for a full refund or to reschedule.
                </div>
                <p>We apologize for this unavoidable adjustment.</p>
                <p><strong>MoA Facilities Management</strong></p>
            </div>
        ";
        try {
            Mail::html($html, function($m) use ($oldBooking) {
                $m->to($oldBooking->email)->subject('URGENT: MoA Booking Displacement Notice');
            });
        } catch(\Exception $e) {
            \Log::error("Email failed: " . $e->getMessage());
        }
    }

    private function sendVipConfirmation($booking) {
        $html = "<h2>VIP Priority Secured</h2><p>Your Ministerial booking for '{$booking->event_name}' is confirmed and the hall has been secured.</p>";
        try {
            Mail::html($html, function($m) use ($booking) {
                $m->to($booking->email)->subject('VIP Priority Booking Confirmed');
            });
        } catch(\Exception $e) {}
    }

    public function track(Request $request)
    {
        $id = $request->query('id');
        $query = Booking::join('venues', 'bookings.venue_id', '=', 'venues.venue_id')
            ->select('bookings.*', 'venues.name as venue_name');

        if (str_contains($id, 'BKG-')) {
            $query->where('event_name', 'LIKE', '%[#' . $id . ']%');
        } else {
            $query->where('bookings.booking_id', $id);
        }

        $results = $query->orderBy('start_time', 'asc')->get();
        return response()->json(['success' => $results->count() > 0, 'data' => $results]);
    }
}