<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Booking;
use App\Models\Venue;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class SendBookingReminders extends Command
{
    protected $signature = 'bookings:send-reminders';
    protected $description = 'Sends HTML reminders for events in 24 hours';

    public function handle()
    {
        $upcoming = Booking::whereIn('status', ['Approved', 'Confirmed'])
            ->where('reminder_sent', false)
            ->where('start_time', '>', Carbon::now())
            ->where('start_time', '<=', Carbon::now()->addHours(24))->get();

        foreach ($upcoming as $booking) {
            $venue = Venue::find($booking->venue_id);
            $date = Carbon::parse($booking->start_time)->format('F j, Y, g:i a');

            $html = "
                <div style='font-family: sans-serif; padding: 20px; background: #f4f4f4;'>
                    <h2>Event Reminder: Tomorrow</h2>
                    <p>Hello {$booking->full_name}, your event <strong>{$booking->event_name}</strong> starts soon.</p>
                    <p><strong>Venue:</strong> " . ($venue->name ?? 'MoA Hall') . "</p>
                    <p><strong>Time:</strong> {$date}</p>
                    <p>Please contact IT for technical setup.</p>
                </div>";

            try {
                Mail::html($html, function($m) use ($booking) { $m->to($booking->email)->subject('Event Reminder - MoA'); });
                $booking->update(['reminder_sent' => true]);
            } catch(\Exception $e) {}
        }
    }
}