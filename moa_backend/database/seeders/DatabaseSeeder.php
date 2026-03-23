<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Venue;
use App\Models\Service;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. IMPORT ALL VENUES (HALLS)
        $venues = [
            ['venue_id' => 1, 'name' => 'Abol Hall', 'capacity' => 850, 'price_per_hour' => 15.00, 'best_for' => 'Large conferences & national events, Internet Access Included,24/7'],
            ['venue_id' => 2, 'name' => 'Adey Hall', 'capacity' => 90, 'price_per_hour' => 20.00, 'best_for' => 'Mid-size trainings & symposia'],
            ['venue_id' => 3, 'name' => 'Adey Hall A', 'capacity' => 50, 'price_per_hour' => 0.00, 'best_for' => 'Breakout sessions'],
            ['venue_id' => 4, 'name' => 'Adey Hall B', 'capacity' => 40, 'price_per_hour' => 0.00, 'best_for' => 'Breakout sessions'],
            ['venue_id' => 5, 'name' => 'Lamebora Hall', 'capacity' => 40, 'price_per_hour' => 0.00, 'best_for' => 'Standard meetings'],
            ['venue_id' => 6, 'name' => 'Lamebora Hall A', 'capacity' => 26, 'price_per_hour' => 0.00, 'best_for' => 'Small meetings'],
            ['venue_id' => 7, 'name' => 'Lamebora Hall B', 'capacity' => 14, 'price_per_hour' => 0.00, 'best_for' => 'Very Small meetings'],
            ['venue_id' => 8, 'name' => 'VIP Board Room', 'capacity' => 12, 'price_per_hour' => 0.00, 'best_for' => 'High-level / ministerial meetings'],
        ];

        foreach ($venues as $venue) {
            Venue::updateOrCreate(['venue_id' => $venue['venue_id']], $venue);
        }

        // 2. IMPORT ALL SERVICES (TECHNICAL & SUPPORT)
        $services = [
            ['id' => 1, 'name' => 'Premium Coffee Break', 'price' => 50.00, 'category' => 'Support'],
            ['id' => 2, 'name' => 'Diplomatic Lunch Buffet', 'price' => 150.00, 'category' => 'Support'],
            ['id' => 3, 'name' => 'IT Support & Translation', 'price' => 100.00, 'category' => 'Technical'],
            ['id' => 4, 'name' => '4K Livestreaming Setup', 'price' => 200.00, 'category' => 'Technical'],
            ['id' => 5, 'name' => 'Internet Access', 'price' => 0.00, 'category' => 'Technical'],
            ['id' => 6, 'name' => 'HDMI Connection', 'price' => 0.00, 'category' => 'Technical'],
            ['id' => 7, 'name' => 'Wireless Sharing', 'price' => 0.00, 'category' => 'Technical'],
            ['id' => 8, 'name' => 'LED Screen / Display', 'price' => 0.00, 'category' => 'Technical'],
            ['id' => 9, 'name' => 'Microphone', 'price' => 0.00, 'category' => 'Technical'],
            ['id' => 10, 'name' => 'Sound System', 'price' => 0.00, 'category' => 'Technical'],
            ['id' => 11, 'name' => 'Video Conferencing', 'price' => 0.00, 'category' => 'Technical'],
            ['id' => 12, 'name' => 'Photography', 'price' => 0.00, 'category' => 'Technical'],
            ['id' => 13, 'name' => 'Meeting Recording', 'price' => 0.00, 'category' => 'Technical'],
            ['id' => 14, 'name' => 'Livestreaming', 'price' => 0.00, 'category' => 'Technical'],
            ['id' => 15, 'name' => 'Interpretation System', 'price' => 0.00, 'category' => 'Technical'],
            ['id' => 16, 'name' => 'Presentation Laptop', 'price' => 0.00, 'category' => 'Technical'],
            ['id' => 17, 'name' => 'Stationery', 'price' => 0.00, 'category' => 'Support'],
            ['id' => 18, 'name' => 'Coffee Break', 'price' => 0.00, 'category' => 'Support'],
            ['id' => 19, 'name' => 'Lunch Catering', 'price' => 0.00, 'category' => 'Support'],
            ['id' => 20, 'name' => 'Water Service', 'price' => 0.00, 'category' => 'Support'],
            ['id' => 21, 'name' => 'Registration Desk', 'price' => 0.00, 'category' => 'Support'],
            ['id' => 22, 'name' => 'Event Signage', 'price' => 0.00, 'category' => 'Support'],
            ['id' => 23, 'name' => 'Reception Support', 'price' => 0.00, 'category' => 'Support'],
            ['id' => 24, 'name' => 'Security Support', 'price' => 0.00, 'category' => 'Support'],
            ['id' => 25, 'name' => 'Cleaning Service', 'price' => 0.00, 'category' => 'Support'],
        ];

        foreach ($services as $service) {
            Service::updateOrCreate(['id' => $service['id']], $service);
        }
    }
}