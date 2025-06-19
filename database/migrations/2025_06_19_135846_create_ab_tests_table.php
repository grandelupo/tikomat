<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ab_tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('video_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('test_type'); // 'title', 'thumbnail', 'posting_time', 'description'
            $table->json('test_config'); // Test configuration including variations
            $table->json('test_results')->nullable(); // Results data
            $table->string('status')->default('active'); // 'active', 'completed', 'paused', 'cancelled'
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration_days')->default(14);
            $table->json('success_metrics'); // Metrics to track for success
            $table->decimal('confidence_score', 5, 2)->nullable(); // Statistical confidence (0-100)
            $table->string('winning_variation')->nullable(); // Which variation won
            $table->text('insights')->nullable(); // AI-generated insights about the test
            $table->timestamps();
            
            $table->index(['video_id', 'status']);
            $table->index(['user_id', 'created_at']);
            $table->index(['test_type', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ab_tests');
    }
};
