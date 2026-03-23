<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id('booking_id');
            $table->foreignId('venue_id')->constrained('venues', 'venue_id')->onDelete('cascade');
            
            // Organizer Details
            $table->string('full_name');
            $table->string('organization')->nullable();
            $table->string('email');
            $table->string('phone');
            
            // Event Details
            $table->string('event_name');
            $table->text('event_description')->nullable();
            $table->integer('pax_count');
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            
            // JSON Arrays for flexible multi-selects
            $table->json('technical_needs')->nullable();
            $table->json('support_needs')->nullable();
            $table->json('allocated_staff')->nullable();
            
            $table->string('attachment_url')->nullable();
            $table->boolean('is_vip')->default(false);
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->string('status')->default('Pending');
            $table->text('admin_message')->nullable();
            
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
