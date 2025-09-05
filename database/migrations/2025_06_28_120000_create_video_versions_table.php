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
        // Only create the table if it doesn't already exist
        if (!Schema::hasTable('video_versions')) {
            Schema::create('video_versions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('video_id')->constrained()->onDelete('cascade');
                $table->enum('version_type', ['backup', 'current'])->default('current');
                $table->string('title');
                $table->text('description')->nullable();
                $table->json('tags')->nullable();
                $table->string('thumbnail_path')->nullable();
                $table->json('changes_summary')->nullable(); // Summary of what was changed
                $table->boolean('has_subtitle_changes')->default(false);
                $table->boolean('has_watermark_removal')->default(false);
                $table->timestamps();
                
                // Index for efficient querying
                $table->index(['video_id', 'version_type']);
                $table->index(['video_id', 'created_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('video_versions');
    }
}; 